import { mswDecorator } from '~/mocks/browser'
import { Meta } from '@storybook/react'
import { useAvailableFeatures } from '~/mocks/features'
import { AvailableFeature } from '~/types'
import { useEffect } from 'react'
import { router } from 'kea-router'
import { urls } from 'scenes/urls'
import { App } from 'scenes/App'
import { DatabaseSchemaQueryResponse } from '~/queries/schema'

const MOCK_DATABASE: DatabaseSchemaQueryResponse = {
    events: [
        { key: 'uuid', type: 'string' },
        { key: 'event', type: 'string' },
        { key: 'properties', type: 'json' },
        { key: 'timestamp', type: 'datetime' },
        { key: 'distinct_id', type: 'string' },
        { key: 'elements_chain', type: 'string' },
        { key: 'created_at', type: 'datetime' },
        { key: 'pdi', type: 'lazy_table', table: 'person_distinct_ids' },
        { key: 'poe', type: 'virtual_table', table: 'events', fields: ['id', 'created_at', 'properties'] },
        { key: 'person', type: 'field_traverser', chain: ['pdi', 'person'] },
        { key: 'person_id', type: 'field_traverser', chain: ['pdi', 'person_id'] },
    ],
    persons: [
        { key: 'id', type: 'string' },
        { key: 'created_at', type: 'datetime' },
        { key: 'properties', type: 'json' },
        { key: 'is_identified', type: 'boolean' },
        { key: 'is_deleted', type: 'boolean' },
        { key: 'version', type: 'integer' },
    ],
    person_distinct_ids: [
        { key: 'distinct_id', type: 'string' },
        { key: 'person_id', type: 'string' },
        { key: 'is_deleted', type: 'boolean' },
        { key: 'version', type: 'integer' },
        { key: 'person', type: 'lazy_table', table: 'persons' },
    ],
    session_recording_events: [
        { key: 'uuid', type: 'string' },
        { key: 'timestamp', type: 'datetime' },
        { key: 'distinct_id', type: 'string' },
        { key: 'session_id', type: 'string' },
        { key: 'window_id', type: 'string' },
        { key: 'snapshot_data', type: 'json' },
        { key: 'created_at', type: 'datetime' },
        { key: 'has_full_snapshot', type: 'boolean' },
        { key: 'events_summary', type: 'json' },
        { key: 'click_count', type: 'integer' },
        { key: 'keypress_count', type: 'integer' },
        { key: 'timestamps_summary', type: 'datetime' },
        { key: 'first_event_timestamp', type: 'datetime' },
        { key: 'last_event_timestamp', type: 'datetime' },
        { key: 'urls', type: 'string' },
        { key: 'pdi', type: 'lazy_table', table: 'person_distinct_ids' },
        { key: 'person', type: 'field_traverser', chain: ['pdi', 'person'] },
        { key: 'person_id', type: 'field_traverser', chain: ['pdi', 'person_id'] },
    ],
    cohort_people: [
        { key: 'person_id', type: 'string' },
        { key: 'cohort_id', type: 'integer' },
        { key: 'sign', type: 'integer' },
        { key: 'version', type: 'integer' },
        { key: 'person', type: 'lazy_table', table: 'persons' },
    ],
    static_cohort_people: [
        { key: 'person_id', type: 'string' },
        { key: 'cohort_id', type: 'integer' },
        { key: 'person', type: 'lazy_table', table: 'persons' },
    ],
    groups: [
        { key: 'index', type: 'integer' },
        { key: 'key', type: 'string' },
        { key: 'created_at', type: 'datetime' },
        { key: 'properties', type: 'json' },
    ],
}

export default {
    title: 'Scenes-App/Data Management',
    parameters: {
        layout: 'fullscreen',
        options: { showPanel: false },
        testOptions: {
            excludeNavigationFromSnapshot: true,
        },
        viewMode: 'story',
        mockDate: '2023-02-15', // To stabilize relative dates
    },
    decorators: [
        mswDecorator({
            post: {
                '/api/projects/:team_id/query/': (req) => {
                    if ((req.body as any).query.kind === 'DatabaseSchemaQuery') {
                        return [200, MOCK_DATABASE]
                    }
                },
            },
        }),
    ],
} as Meta

export function Database(): JSX.Element {
    useAvailableFeatures([AvailableFeature.EXPERIMENTATION])
    useEffect(() => {
        router.actions.push(urls.database())
    }, [])
    return <App />
}
