import { InsightModel } from '~/types'
import { useFeatureFlags, useStorybookMocks } from '~/mocks/browser'
import { useEffect } from 'react'
import { router } from 'kea-router'
import { App } from 'scenes/App'
import { FEATURE_FLAGS } from 'lib/constants'
import type { Story } from '@storybook/react'

let shortCounter = 0
export function createInsightStory(insight: Partial<InsightModel>): Story {
    const count = shortCounter++
    return function InsightStory() {
        useStorybookMocks({
            get: {
                '/api/projects/:team_id/insights/': (_, __, ctx) => [
                    ctx.delay(100),
                    ctx.status(200),
                    ctx.json({
                        count: 1,
                        results: [
                            { ...insight, short_id: `${insight.short_id}${count}`, id: (insight.id ?? 0) + 1 + count },
                        ],
                    }),
                ],
            },
        })
        useFeatureFlags([FEATURE_FLAGS.RETENTION_BREAKDOWN])

        useEffect(() => {
            router.actions.push(`/insights/${insight.short_id}${count}`)
        }, [])

        return <App />
    }
}
