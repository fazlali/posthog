import { DataTableColumn, DataTableNode, DataTableStringColumn, EventsNode } from '~/queries/schema'
import { useState } from 'react'
import { useValues, BindLogic, useActions } from 'kea'
import { dataNodeLogic } from '~/queries/nodes/dataNodeLogic'
import { LemonTable, LemonTableColumn } from 'lib/components/LemonTable'
import { EventType, PropertyFilterType } from '~/types'
import { autoCaptureEventToDescription } from 'lib/utils'
import { PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import { urls } from 'scenes/urls'
import { PersonHeader } from 'scenes/persons/PersonHeader'
import { Link } from 'lib/components/Link'
import { Property } from 'lib/components/Property'
import { TZLabel } from 'lib/components/TZLabel'
import { EventName } from '~/queries/nodes/EventsNode/EventName'
import { EventPropertyFilters } from '~/queries/nodes/EventsNode/EventPropertyFilters'
import { EventDetails } from 'scenes/events'
import { EventActions } from '~/queries/nodes/DataTable/EventActions'
import { DataTableExport } from '~/queries/nodes/DataTable/DataTableExport'
import { ReloadQuery } from '~/queries/nodes/DataTable/ReloadQuery'
import { LemonButton } from 'lib/components/LemonButton'

interface DataTableProps {
    query: DataTableNode
    setQuery?: (node: DataTableNode) => void
}

export const defaultDataTableStringColumns: DataTableStringColumn[] = [
    'meta.event',
    'person',
    'event.$current_url',
    'person.email',
    'meta.timestamp',
]
export const defaultDataTableColumns: DataTableColumn[] = normalizeDataTableColumns(defaultDataTableStringColumns)

function renderTitle(type: PropertyFilterType, key: string): JSX.Element | string {
    if (type === PropertyFilterType.Meta) {
        if (key === 'timestamp') {
            return 'Time'
        }
        return key
    } else if (type === PropertyFilterType.Event || type === PropertyFilterType.Element) {
        return <PropertyKeyInfo value={key} type={type} disableIcon />
    } else if (type === PropertyFilterType.Person) {
        if (key === '') {
            return 'Person'
        } else {
            return <PropertyKeyInfo value={key} type="event" disableIcon />
        }
    } else {
        return String(type)
    }
}

function renderColumn(type: PropertyFilterType, key: string, record: EventType): JSX.Element | string {
    if (type === PropertyFilterType.Meta) {
        if (key === 'event') {
            if (record.event === '$autocapture') {
                return autoCaptureEventToDescription(record)
            } else {
                const content = <PropertyKeyInfo value={record.event} type="event" />
                const url = record.properties.$sentry_url
                return url ? (
                    <Link to={url} target="_blank">
                        {content}
                    </Link>
                ) : (
                    content
                )
            }
        } else if (key === 'timestamp') {
            return <TZLabel time={record.timestamp} showSeconds />
        } else {
            return String(record[key])
        }
    } else if (type === PropertyFilterType.Event) {
        return <Property value={record.properties[key]} />
    } else if (type === PropertyFilterType.Person) {
        if (key === '') {
            return (
                <Link to={urls.person(record.distinct_id)}>
                    <PersonHeader noLink withIcon person={record.person} />
                </Link>
            )
        } else {
            return <Property value={record.person?.properties[key]} />
        }
    }
    return <div>Unknown</div>
}

let uniqueNode = 0

export function DataTable({ query, setQuery }: DataTableProps): JSX.Element {
    const columns = query.columns ? normalizeDataTableColumns(query.columns) : defaultDataTableColumns
    const showPropertyFilter = query.showPropertyFilter ?? true
    const showEventFilter = query.showEventFilter ?? true
    const showActions = query.showActions ?? true
    const showExport = query.showExport ?? true
    const showReload = query.showReload ?? true
    const expandable = query.expandable ?? true

    const [id] = useState(() => uniqueNode++)
    const dataNodeLogicProps = { query: query.source, key: `DataTable.${id}` }
    const logic = dataNodeLogic(dataNodeLogicProps)
    const { response, responseLoading, canLoadNextData } = useValues(logic)
    const { loadNextData } = useActions(logic)

    const rows = (response as null | EventsNode['response'])?.results ?? []
    const lemonColumns: LemonTableColumn<EventType, keyof EventType | undefined>[] = columns.map(({ type, key }) => ({
        dataIndex: `${type}.${key}` as any,
        title: renderTitle(type, key),
        render: function RenderDataTableColumn(_: any, record: EventType) {
            return renderColumn(type, key, record)
        },
    }))

    if (showActions) {
        lemonColumns.push({
            dataIndex: 'more' as any,
            title: '',
            render: function RenderMore(_: any, record: EventType) {
                return <EventActions event={record} />
            },
        })
    }

    return (
        <BindLogic logic={dataNodeLogic} props={dataNodeLogicProps}>
            {(showPropertyFilter || showEventFilter || showExport) && (
                <div className="flex space-x-4 mb-4">
                    {showReload && <ReloadQuery />}
                    {showEventFilter && (
                        <EventName query={query.source} setQuery={(source) => setQuery?.({ ...query, source })} />
                    )}
                    {showPropertyFilter && (
                        <EventPropertyFilters
                            query={query.source}
                            setQuery={(source) => setQuery?.({ ...query, source })}
                        />
                    )}
                    {showExport && <DataTableExport query={query} setQuery={setQuery} />}
                </div>
            )}
            <LemonTable
                loading={responseLoading}
                columns={lemonColumns}
                dataSource={rows}
                expandable={
                    expandable
                        ? {
                              expandedRowRender: function renderExpand(event) {
                                  return event && <EventDetails event={event} />
                              },
                              rowExpandable: () => true,
                              noIndent: true,
                          }
                        : undefined
                }
            />
            {canLoadNextData && ((response as any).results.length > 0 || !responseLoading) && (
                <LemonButton type="primary" onClick={loadNextData} loading={responseLoading} className="my-8 mx-auto">
                    Load more events
                </LemonButton>
            )}
        </BindLogic>
    )
}

function normalizeDataTableColumns(input: (DataTableStringColumn | DataTableColumn)[]): DataTableColumn[] {
    return input.map((column) => {
        if (typeof column === 'string') {
            const [first, ...rest] = column.split('.')
            return {
                type: first as PropertyFilterType,
                key: rest.join('.'),
            }
        }
        return column
    })
}
