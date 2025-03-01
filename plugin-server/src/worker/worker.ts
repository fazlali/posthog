import * as Sentry from '@sentry/node'

import { initApp } from '../init'
import { runInTransaction } from '../sentry'
import { Hub, PluginConfig, PluginsServerConfig } from '../types'
import { processError } from '../utils/db/error'
import { createHub } from '../utils/db/hub'
import { status } from '../utils/status'
import { cloneObject, pluginConfigIdFromStack } from '../utils/utils'
import { setupPlugins } from './plugins/setup'
import { workerTasks } from './tasks'
import { TimeoutError } from './vm/vm'

export type PiscinaTaskWorker = ({ task, args }: { task: string; args: any }) => Promise<any>

export async function createWorker(config: PluginsServerConfig, threadId: number): Promise<PiscinaTaskWorker> {
    initApp(config)

    return runInTransaction(
        {
            name: 'createWorker',
        },
        async () => {
            status.info('🧵', `Starting Piscina worker thread ${threadId}…`)

            const [hub, closeHub] = await createHub(config, threadId)

            ;['unhandledRejection', 'uncaughtException'].forEach((event) => {
                process.on(event, (error: Error) => {
                    processUnhandledException(error, hub, event)
                })
            })

            await setupPlugins(hub)

            for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
                process.on(signal, closeHub)
            }

            return createTaskRunner(hub)
        }
    )
}

export const createTaskRunner =
    (hub: Hub): PiscinaTaskWorker =>
    ({ task, args }) =>
        runInTransaction(
            {
                op: 'piscina task',
                name: task,
                data: args,
            },
            async () => {
                const timer = new Date()
                let response

                Sentry.setContext('task', { task, args })

                if (task in workerTasks) {
                    try {
                        // must clone the object, as we may get from VM2 something like { ..., properties: Proxy {} }
                        response = cloneObject(await workerTasks[task](hub, args))
                    } catch (e) {
                        status.warn('🔔', e)
                        Sentry.captureException(e)
                        throw e
                    }
                } else {
                    response = { error: `Worker task "${task}" not found in: ${Object.keys(workerTasks).join(', ')}` }
                }

                hub.statsd?.timing(`piscina_task.${task}`, timer)
                if (task === 'runPluginJob') {
                    hub.statsd?.timing('plugin_job', timer, {
                        type: String(args.job?.type),
                        pluginConfigId: String(args.job?.pluginConfigId),
                        pluginConfigTeam: String(args.job?.pluginConfigTeam),
                    })
                }
                return response
            },
            (transactionDuration: number) => {
                if (
                    task === 'runEventPipeline' ||
                    task === 'runBufferEventPipeline' ||
                    task === 'runAsyncHandlersEventPipeline'
                ) {
                    return transactionDuration > 0.5 ? 1 : 0.01
                } else {
                    return 1
                }
            }
        )

export function processUnhandledException(error: Error, server: Hub, kind: string): void {
    let pluginConfig: PluginConfig | undefined = undefined

    if (error instanceof TimeoutError) {
        pluginConfig = error.pluginConfig
    } else {
        const pluginConfigId = pluginConfigIdFromStack(error.stack || '', server.pluginConfigSecretLookup)
        pluginConfig = pluginConfigId ? server.pluginConfigs.get(pluginConfigId) : undefined
    }

    if (pluginConfig) {
        void processError(server, pluginConfig, error)
        return
    }

    Sentry.captureException(error, {
        extra: {
            type: `${kind} in worker`,
        },
    })

    status.error('🤮', `${kind}!`)
    status.error('🤮', error)
}
