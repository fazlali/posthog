import { InsightQueryNode, EventsNode, ActionsNode, InsightNodeKind, NodeKind } from '~/queries/schema'
import { FilterType, InsightType, ActionFilter } from '~/types'
import {
    isEventsNode,
    isTrendsQuery,
    isFunnelsQuery,
    isRetentionQuery,
    isPathsQuery,
    isStickinessQuery,
} from '~/queries/utils'

type FilterTypeActionsAndEvents = { events?: ActionFilter[]; actions?: ActionFilter[] }

const seriesToActionsAndEvents = (series: (EventsNode | ActionsNode)[]): FilterTypeActionsAndEvents => {
    const actions: ActionFilter[] = []
    const events: ActionFilter[] = []
    series.forEach((node, index) => {
        const entity: ActionFilter = {
            type: isEventsNode(node) ? 'events' : 'actions',
            id: (isEventsNode(node) ? node.event : node.id) || null,
            order: index,
            name: node.name || null,
            custom_name: node.custom_name,
            math: node.math,
            math_property: node.math_property,
            math_group_type_index: node.math_group_type_index,
            properties: node.properties as any, // TODO,
        }

        if (isEventsNode(node)) {
            events.push(entity)
        } else {
            actions.push(entity)
        }
    })
    return { actions, events }
}

export const actionsAndEventsToSeries = ({
    actions,
    events,
}: FilterTypeActionsAndEvents): (EventsNode | ActionsNode)[] => {
    const series: any = [...(actions || []), ...(events || [])]
        .sort((a, b) => (a.order || b.order ? (!a.order ? -1 : !b.order ? 1 : a.order - b.order) : 0))
        // TODO: handle new_entity type
        .map((f) =>
            f.type === 'actions'
                ? {
                      kind: NodeKind.ActionsNode,
                      id: f.id,
                      name: f.name || undefined,
                      custom_name: f.custom_name,
                      properties: f.properties,
                  }
                : {
                      kind: NodeKind.EventsNode,
                      event: f.id,
                      name: f.name || undefined,
                      custom_name: f.custom_name,
                      properties: f.properties,
                  }
        )

    return series
}

const insightMap: Record<InsightNodeKind, InsightType> = {
    [NodeKind.TrendsQuery]: InsightType.TRENDS,
    [NodeKind.FunnelsQuery]: InsightType.FUNNELS,
    [NodeKind.RetentionQuery]: InsightType.RETENTION,
    [NodeKind.PathsQuery]: InsightType.PATHS,
    [NodeKind.StickinessQuery]: InsightType.STICKINESS,
    [NodeKind.LifecycleQuery]: InsightType.LIFECYCLE,
}

const filterMap: Record<InsightNodeKind, string> = {
    [NodeKind.TrendsQuery]: 'trendsFilter',
    [NodeKind.FunnelsQuery]: 'funnelsFilter',
    [NodeKind.RetentionQuery]: 'retentionFilter',
    [NodeKind.PathsQuery]: 'pathsFilter',
    [NodeKind.StickinessQuery]: 'stickinessFilter',
    [NodeKind.LifecycleQuery]: 'lifecycleFilter',
}

export const queryNodeToFilter = (query: InsightQueryNode): Partial<FilterType> => {
    const filters: Partial<FilterType> = {
        insight: insightMap[query.kind],
        properties: query.properties,
        filter_test_accounts: query.filterTestAccounts,
        date_to: query.dateRange?.date_to,
        // TODO: not used by retention queries
        date_from: query.dateRange?.date_from,
    }

    if (!isRetentionQuery(query) && !isPathsQuery(query)) {
        const { actions, events } = seriesToActionsAndEvents(query.series)
        // TODO: math is not supported by funnel and lifecycle queries
        filters.actions = actions
        filters.events = events
    }

    // TODO stickiness should probably support breakdowns as well
    if (isTrendsQuery(query) || isFunnelsQuery(query)) {
        Object.assign(filters, query.breakdown)
    }

    if (isTrendsQuery(query) || isStickinessQuery(query)) {
        filters.interval = query.interval
    }

    // get node specific filter properties e.g. trendsFilter, funnelsFilter, ...
    Object.assign(filters, query[filterMap[query.kind]])

    return filters
}