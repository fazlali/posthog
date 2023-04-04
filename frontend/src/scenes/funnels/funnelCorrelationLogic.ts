import { kea, props, key, path, selectors, listeners, connect, reducers, actions, defaults } from 'kea'
import {
    FunnelCorrelation,
    FunnelCorrelationResultsType,
    FunnelCorrelationType,
    FunnelsFilterType,
    InsightLogicProps,
} from '~/types'
import { keyForInsightLogicProps } from 'scenes/insights/sharedUtils'
import { funnelLogic } from './funnelLogic'
import api from 'lib/api'

import type { funnelCorrelationLogicType } from './funnelCorrelationLogicType'
import { loaders } from 'kea-loaders'
import { lemonToast } from '@posthog/lemon-ui'
import { teamLogic } from 'scenes/teamLogic'
import { funnelDataLogic } from './funnelDataLogic'
import { cleanFilters } from 'scenes/insights/utils/cleanFilters'
import { queryNodeToFilter } from '~/queries/nodes/InsightQuery/utils/queryNodeToFilter'
import { insightLogic } from 'scenes/insights/insightLogic'
import { appendToCorrelationConfig } from './funnelUtils'

export const funnelCorrelationLogic = kea<funnelCorrelationLogicType>([
    props({} as InsightLogicProps),
    key(keyForInsightLogicProps('insight_funnel')),
    path((key) => ['scenes', 'funnels', 'funnelCorrelationLogic', key]),
    connect((props: InsightLogicProps) => ({
        values: [
            insightLogic(props),
            ['isUsingDataExploration'],
            funnelLogic(props),
            ['filters'],
            funnelDataLogic(props),
            ['querySource'],
            teamLogic,
            ['currentTeamId', 'currentTeam'],
        ],
    })),
    actions({
        setCorrelationTypes: (types: FunnelCorrelationType[]) => ({ types }),
        excludeEventFromProject: (eventName: string) => ({ eventName }),
    }),
    defaults({
        // This is a hack to get `FunnelCorrelationResultsType` imported in `funnelCorrelationLogicType.ts`
        __ignore: null as FunnelCorrelationResultsType | null,
    }),
    loaders(({ values }) => ({
        correlations: [
            { events: [] } as Record<'events', FunnelCorrelation[]>,
            {
                loadEventCorrelations: async (_, breakpoint) => {
                    await breakpoint(100)

                    try {
                        const results: Omit<FunnelCorrelation, 'result_type'>[] = (
                            await api.create(`api/projects/${values.currentTeamId}/insights/funnel/correlation`, {
                                ...values.apiParams,
                                funnel_correlation_type: 'events',
                                funnel_correlation_exclude_event_names: values.excludedEventNames,
                            })
                        ).result?.events

                        return {
                            events: results.map((result) => ({
                                ...result,
                                result_type: FunnelCorrelationResultsType.Events,
                            })),
                        }
                    } catch (error) {
                        lemonToast.error('Failed to load correlation results', { toastId: 'funnel-correlation-error' })
                        return { events: [] }
                    }
                },
            },
        ],
        eventWithPropertyCorrelations: [
            {} as Record<string, FunnelCorrelation[]>,
            {
                loadEventWithPropertyCorrelations: async (eventName: string) => {
                    const results: Omit<FunnelCorrelation, 'result_type'>[] = (
                        await api.create(`api/projects/${values.currentTeamId}/insights/funnel/correlation`, {
                            ...values.apiParams,
                            funnel_correlation_type: 'event_with_properties',
                            funnel_correlation_event_names: [eventName],
                            funnel_correlation_event_exclude_property_names: values.excludedEventPropertyNames,
                        })
                    ).result?.events

                    return {
                        [eventName]: results.map((result) => ({
                            ...result,
                            result_type: FunnelCorrelationResultsType.EventWithProperties,
                        })),
                    }
                },
            },
        ],
    })),
    reducers({
        correlationTypes: [
            [FunnelCorrelationType.Success, FunnelCorrelationType.Failure] as FunnelCorrelationType[],
            {
                setCorrelationTypes: (_, { types }) => types,
            },
        ],
        loadedEventCorrelationsTableOnce: [
            false,
            {
                loadEventCorrelations: () => true,
            },
        ],
        eventWithPropertyCorrelations: {
            loadEventWithPropertyCorrelationsSuccess: (state, { eventWithPropertyCorrelations }) => {
                return {
                    ...state,
                    ...eventWithPropertyCorrelations,
                }
            },
            loadEventCorrelationsSuccess: () => {
                return {}
            },
        },
    }),
    selectors({
        apiParams: [
            (s) => [s.isUsingDataExploration, s.dataExplorationApiParams, s.legacyApiParams],
            (isUsingDataExploration, dataExplorationApiParams, legacyApiParams) => {
                return isUsingDataExploration ? dataExplorationApiParams : legacyApiParams
            },
        ],
        dataExplorationApiParams: [
            (s) => [s.querySource],
            (querySource) => {
                const cleanedParams: Partial<FunnelsFilterType> = querySource
                    ? cleanFilters(queryNodeToFilter(querySource))
                    : {}
                return cleanedParams
            },
        ],
        legacyApiParams: [
            (s) => [s.filters],
            (filters) => {
                const cleanedParams: Partial<FunnelsFilterType> = cleanFilters(filters)
                return cleanedParams
            },
        ],

        correlationValues: [
            (s) => [s.correlations, s.correlationTypes, s.excludedEventNames],
            (correlations, correlationTypes, excludedEventNames): FunnelCorrelation[] => {
                return correlations.events
                    ?.filter(
                        (correlation) =>
                            correlationTypes.includes(correlation.correlation_type) &&
                            !excludedEventNames.includes(correlation.event.event)
                    )
                    .map((value) => {
                        return {
                            ...value,
                            odds_ratio:
                                value.correlation_type === FunnelCorrelationType.Success
                                    ? value.odds_ratio
                                    : 1 / value.odds_ratio,
                        }
                    })
                    .sort((first, second) => {
                        return second.odds_ratio - first.odds_ratio
                    })
            },
        ],
        excludedEventNames: [
            (s) => [s.currentTeam],
            (currentTeam): string[] => currentTeam?.correlation_config?.excluded_event_names || [],
        ],
        isEventExcluded: [
            (s) => [s.excludedEventNames],
            (excludedEventNames) => (eventName: string) =>
                excludedEventNames.find((name) => name === eventName) !== undefined,
        ],
        isEventPropertyExcluded: [
            (s) => [s.excludedEventPropertyNames],
            (excludedEventPropertyNames) => (propertyName: string) =>
                excludedEventPropertyNames.find((name) => name === propertyName) !== undefined,
        ],
        excludedEventPropertyNames: [
            (s) => [s.currentTeam],
            (currentTeam): string[] => currentTeam?.correlation_config?.excluded_event_property_names || [],
        ],

        eventWithPropertyCorrelationsValues: [
            (s) => [s.eventWithPropertyCorrelations, s.correlationTypes, s.excludedEventPropertyNames],
            (
                eventWithPropertyCorrelations,
                correlationTypes,
                excludedEventPropertyNames
            ): Record<string, FunnelCorrelation[]> => {
                const eventWithPropertyCorrelationsValues: Record<string, FunnelCorrelation[]> = {}
                for (const key in eventWithPropertyCorrelations) {
                    if (eventWithPropertyCorrelations.hasOwnProperty(key)) {
                        eventWithPropertyCorrelationsValues[key] = eventWithPropertyCorrelations[key]
                            ?.filter(
                                (correlation) =>
                                    correlationTypes.includes(correlation.correlation_type) &&
                                    !excludedEventPropertyNames.includes(correlation.event.event.split('::')[1])
                            )
                            .map((value) => {
                                return {
                                    ...value,
                                    odds_ratio:
                                        value.correlation_type === FunnelCorrelationType.Success
                                            ? value.odds_ratio
                                            : 1 / value.odds_ratio,
                                }
                            })
                            .sort((first, second) => {
                                return second.odds_ratio - first.odds_ratio
                            })
                    }
                }
                return eventWithPropertyCorrelationsValues
            },
        ],
        eventHasPropertyCorrelations: [
            (s) => [s.eventWithPropertyCorrelationsValues],
            (eventWithPropertyCorrelationsValues): ((eventName: string) => boolean) => {
                return (eventName) => {
                    return !!eventWithPropertyCorrelationsValues[eventName]
                }
            },
        ],
    }),
    listeners(({ values }) => ({
        excludeEventFromProject: async ({ eventName }) => {
            appendToCorrelationConfig('excluded_event_names', values.excludedEventNames, eventName)
        },
        excludeEventPropertyFromProject: async ({ propertyName }) => {
            appendToCorrelationConfig('excluded_event_property_names', values.excludedEventPropertyNames, propertyName)
        },
    })),
])
