import { useActions, useValues } from 'kea'
import { eventsSceneLogic } from 'scenes/events/eventsSceneLogic'
import { Query } from '~/queries/Query/Query'
import { DataTableNode, NodeKind } from '~/queries/schema'
import { isDataTableNode, isEventsNode } from '~/queries/utils'
import { objectsEqual } from 'lib/utils'

export function EventsScene(): JSX.Element {
    const { properties, eventFilter, columns } = useValues(eventsSceneLogic)
    const { setProperties, setEventFilter, setColumns } = useActions(eventsSceneLogic)

    const query: DataTableNode = {
        kind: NodeKind.DataTableNode,
        columns: columns ?? undefined,
        source: {
            kind: NodeKind.EventsNode,
            properties: properties,
            event: eventFilter,
            limit: 100,
        },
        propertiesViaUrl: true,
        showEventsBufferWarning: true,
        showColumnConfigurator: true,
        showEventFilter: true,
        showExport: true,
        showPropertyFilter: true,
        showReload: true,
    }
    return (
        <Query
            query={query}
            setQuery={(newQuery) => {
                if (isDataTableNode(newQuery) && isEventsNode(newQuery.source) && isEventsNode(query.source)) {
                    if (!objectsEqual(newQuery.source.properties ?? [], query.source.properties ?? [])) {
                        setProperties(newQuery.source.properties ?? [])
                    }
                    if (!objectsEqual(newQuery.source.event ?? '', query.source.event ?? '')) {
                        setEventFilter(newQuery.source.event ?? '')
                    }
                    if (!objectsEqual(newQuery.columns ?? null, query.columns ?? null)) {
                        setColumns(newQuery.columns ?? null)
                    }
                    // If anything else was changed in the query (nice try, hacker), we won't save it.
                    // Use the query editor to play around.
                }
            }}
        />
    )
}