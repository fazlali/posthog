import './ColumnConfigurator.scss'
import { BindLogic, useActions, useValues } from 'kea'
import { LemonButton } from 'lib/components/LemonButton'
import { dataTableLogic } from '~/queries/nodes/DataTable/dataTableLogic'
import { IconClose, IconEdit, IconTuning, SortableDragIcon } from 'lib/components/icons'
import { RestrictedArea, RestrictedComponentProps, RestrictionScope } from 'lib/components/RestrictedArea'
import { LemonCheckbox } from 'lib/components/LemonCheckbox'
import clsx from 'clsx'
import { Tooltip } from 'lib/components/Tooltip'
import {
    SortableContainer as sortableContainer,
    SortableElement as sortableElement,
    SortableHandle as sortableHandle,
} from 'react-sortable-hoc'
import VirtualizedList, { ListRowProps } from 'react-virtualized/dist/es/List'
import { AutoSizer } from 'react-virtualized/dist/es/AutoSizer'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { TeamMembershipLevel } from 'lib/constants'
import { useState } from 'react'
import { columnConfiguratorLogic, ColumnConfiguratorLogicProps } from './columnConfiguratorLogic'
import { defaultDataTableColumns } from '../defaults'
import { DataTableNode, NodeKind } from '~/queries/schema'
import { LemonModal } from 'lib/components/LemonModal'
import { isEventsNode } from '~/queries/utils'
import { TaxonomicFilter } from 'lib/components/TaxonomicFilter/TaxonomicFilter'
import { PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import { PropertyFilterIcon } from 'lib/components/PropertyFilters/components/PropertyFilterIcon'
import { PropertyFilterType } from '~/types'

let uniqueNode = 0

interface ColumnConfiguratorProps {
    query: DataTableNode
    setQuery?: (node: DataTableNode) => void
}

export function ColumnConfigurator({ query, setQuery }: ColumnConfiguratorProps): JSX.Element {
    const { columns } = useValues(dataTableLogic)

    const [key] = useState(() => String(uniqueNode++))
    const columnConfiguratorLogicProps: ColumnConfiguratorLogicProps = {
        key,
        columns,
        setColumns: (columns: string[]) => {
            if (isEventsNode(query.source) && query.source.select) {
                setQuery?.({ ...query, source: { ...query.source, select: columns } })
            } else {
                setQuery?.({ ...query, columns })
            }
        },
    }
    const { showModal } = useActions(columnConfiguratorLogic(columnConfiguratorLogicProps))

    return (
        <BindLogic logic={columnConfiguratorLogic} props={columnConfiguratorLogicProps}>
            <LemonButton
                type="secondary"
                data-attr="events-table-column-selector"
                icon={<IconTuning style={{ color: 'var(--primary)' }} />}
                onClick={showModal}
            >
                Configure columns
            </LemonButton>
            <ColumnConfiguratorModal />
        </BindLogic>
    )
}

function ColumnConfiguratorModal(): JSX.Element {
    // the virtualised list doesn't support gaps between items in the list
    // setting the container to be larger than we need
    // and adding a container with a smaller height to each row item
    // allows the new row item to set a margin around itself
    const rowContainerHeight = 36
    const rowItemHeight = 32

    const { modalVisible, columns } = useValues(columnConfiguratorLogic)
    const { hideModal, moveColumn, setColumns, selectColumn, unselectColumn, save, toggleSaveAsDefault } =
        useActions(columnConfiguratorLogic)

    function SaveColumnsAsDefault({ isRestricted }: RestrictedComponentProps): JSX.Element {
        return (
            <LemonCheckbox
                label="Save as default for all project members"
                className="mt-2"
                data-attr="events-table-save-columns-as-default-toggle"
                bordered
                onChange={toggleSaveAsDefault}
                defaultChecked={false}
                disabled={isRestricted}
            />
        )
    }
    const DragHandle = sortableHandle(() => (
        <span className="drag-handle">
            <SortableDragIcon />
        </span>
    ))
    const SelectedColumn = ({ column, dataIndex }: { column: string; dataIndex: number }): JSX.Element => {
        let columnType: PropertyFilterType | null = null
        let columnKey = column
        if (column.startsWith('person.properties.')) {
            columnType = PropertyFilterType.Person
            columnKey = column.substring(18)
        }
        if (column.startsWith('properties.')) {
            columnType = PropertyFilterType.Event
            columnKey = column.substring(11)
        }

        // const SelectedColumn = (props: { column: string; dataIndex: number }): JSX.Element => {
        //     const { column, dataIndex } = props
        return (
            <div className={clsx(['SelectedColumn', 'selected'])} style={{ height: rowItemHeight }}>
                <DragHandle />
                {columnType && <PropertyFilterIcon type={columnType} />}
                <PropertyKeyInfo className="ml-1" value={columnKey} />
                <div className="flex-1" />
                <Tooltip title="Edit">
                    <LemonButton
                        onClick={() => {
                            const newColumn = window.prompt('Edit column', column)
                            if (newColumn) {
                                setColumns(columns.map((c, i) => (i === dataIndex ? newColumn : c)))
                            }
                        }}
                        status="primary"
                        size="small"
                    >
                        <IconEdit data-attr="column-display-item-edit-icon" />
                    </LemonButton>
                </Tooltip>
                <Tooltip title="Remove">
                    <LemonButton onClick={() => unselectColumn(column)} status="danger" size="small">
                        <IconClose data-attr="column-display-item-remove-icon" />
                    </LemonButton>
                </Tooltip>
            </div>
        )
    }

    const SortableSelectedColumn = sortableElement(SelectedColumn)

    const SortableSelectedColumnRenderer = ({ index, style, key }: ListRowProps): JSX.Element => {
        return (
            <div style={style} key={key}>
                <SortableSelectedColumn
                    column={columns[index]}
                    dataIndex={index}
                    index={index}
                    collection="selected-columns"
                />
            </div>
        )
    }

    const SortableColumnList = sortableContainer(() => (
        <div style={{ height: 360 }} className="selected-columns-col">
            <AutoSizer>
                {({ height, width }: { height: number; width: number }) => {
                    return (
                        <VirtualizedList
                            height={height}
                            rowCount={columns.length}
                            rowRenderer={SortableSelectedColumnRenderer}
                            rowHeight={rowContainerHeight}
                            width={width}
                        />
                    )
                }}
            </AutoSizer>
        </div>
    ))

    return (
        <LemonModal
            isOpen={modalVisible}
            title="Configure columns"
            onClose={hideModal}
            footer={
                <>
                    <div className="flex-1">
                        <LemonButton
                            type="secondary"
                            onClick={() => setColumns(defaultDataTableColumns({ kind: NodeKind.EventsNode }))}
                        >
                            Reset to defaults
                        </LemonButton>
                    </div>
                    <LemonButton type="secondary" onClick={hideModal}>
                        Close
                    </LemonButton>
                    <LemonButton type="primary" onClick={save} data-attr="items-selector-confirm">
                        Save
                    </LemonButton>
                </>
            }
        >
            <div className="ColumnConfiguratorModal">
                <div className="Columns">
                    <div className="HalfColumn">
                        <h4 className="secondary uppercase text-muted">
                            Visible columns ({columns.length}) - Drag to reorder
                        </h4>
                        <SortableColumnList
                            helperClass="column-configurator-modal-sortable-container"
                            onSortEnd={({ oldIndex, newIndex }) => moveColumn(oldIndex, newIndex)}
                            distance={5}
                            useDragHandle
                            lockAxis="y"
                        />
                    </div>
                    <div className="HalfColumn">
                        <h4 className="secondary uppercase text-muted">Available columns</h4>
                        <div style={{ height: 360 }}>
                            <AutoSizer>
                                {({ height, width }: { height: number; width: number }) => (
                                    <TaxonomicFilter
                                        height={height}
                                        width={width}
                                        taxonomicGroupTypes={[
                                            TaxonomicFilterGroupType.EventProperties,
                                            TaxonomicFilterGroupType.EventFeatureFlags,
                                            TaxonomicFilterGroupType.PersonProperties,
                                            TaxonomicFilterGroupType.HogQLExpression,
                                        ]}
                                        value={undefined}
                                        onChange={(group, value) => {
                                            if (group.type === TaxonomicFilterGroupType.EventProperties) {
                                                selectColumn(`properties.${value}`)
                                            }
                                            if (group.type === TaxonomicFilterGroupType.PersonProperties) {
                                                selectColumn(`person.properties.${value}`)
                                            }
                                            if (group.type === TaxonomicFilterGroupType.EventFeatureFlags) {
                                                selectColumn(`properties.${value}`)
                                            }
                                            if (group.type === TaxonomicFilterGroupType.HogQLExpression) {
                                                const expression = window.prompt('Enter HogQL expression')
                                                if (expression) {
                                                    selectColumn(expression)
                                                }
                                            }
                                        }}
                                        popoverEnabled={false}
                                        selectFirstItem={false}
                                    />
                                )}
                            </AutoSizer>
                        </div>
                    </div>
                </div>
                <RestrictedArea
                    Component={SaveColumnsAsDefault}
                    minimumAccessLevel={TeamMembershipLevel.Admin}
                    scope={RestrictionScope.Project}
                />
            </div>
        </LemonModal>
    )
}
