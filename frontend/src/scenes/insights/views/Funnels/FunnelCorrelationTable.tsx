import { useEffect } from 'react'
import { ConfigProvider, Table } from 'antd'
import Column from 'antd/lib/table/Column'
import { useActions, useValues } from 'kea'
import { RiseOutlined, FallOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { IconSelectEvents, IconUnfoldLess, IconUnfoldMore } from 'lib/lemon-ui/icons'
import { funnelLogic } from 'scenes/funnels/funnelLogic'
import {
    FunnelCorrelation,
    FunnelCorrelationResultsType,
    FunnelCorrelationType,
    FunnelStepWithNestedBreakdown,
} from '~/types'
import Checkbox from 'antd/lib/checkbox/Checkbox'
import { insightLogic } from 'scenes/insights/insightLogic'
import { ValueInspectorButton } from 'scenes/funnels/ValueInspectorButton'
import { PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import './FunnelCorrelationTable.scss'
import { Tooltip } from 'lib/lemon-ui/Tooltip'
import { VisibilitySensor } from 'lib/components/VisibilitySensor/VisibilitySensor'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { CorrelationMatrix } from './CorrelationMatrix'
import { capitalizeFirstLetter } from 'lib/utils'
import { Spinner } from 'lib/lemon-ui/Spinner/Spinner'
import { FunnelCorrelationTableEmptyState } from './FunnelCorrelationTableEmptyState'
import { EventCorrelationActionsCell } from './CorrelationActionsCell'
import { funnelCorrelationUsageLogic } from 'scenes/funnels/funnelCorrelationUsageLogic'

import { funnelCorrelationLogic } from 'scenes/funnels/funnelCorrelationLogic'
import { funnelDataLogic } from 'scenes/funnels/funnelDataLogic'
import { Noun } from '~/models/groupsModel'
import { parseDisplayNameForCorrelation } from 'scenes/funnels/funnelUtils'

export function FunnelCorrelationTableDataExploration(): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { steps, querySource, aggregationTargetLabel } = useValues(funnelDataLogic(insightProps))
    const { loadedEventCorrelationsTableOnce } = useValues(funnelCorrelationLogic(insightProps))
    const { loadEventCorrelations } = useActions(funnelCorrelationLogic(insightProps))

    // Load correlations only if this component is mounted, and then reload if the query changes
    useEffect(() => {
        // We only automatically refresh results when the query changes after the user has manually asked for the first results to be loaded
        if (loadedEventCorrelationsTableOnce) {
            loadEventCorrelations({})
        }
    }, [querySource])

    return (
        <FunnelCorrelationTableComponent
            steps={steps}
            aggregation_group_type_index={querySource?.aggregation_group_type_index}
            aggregationTargetLabel={aggregationTargetLabel}
        />
    )
}

export function FunnelCorrelationTable(): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { steps, filters, aggregationTargetLabel } = useValues(funnelLogic(insightProps))
    const { loadedEventCorrelationsTableOnce } = useValues(funnelCorrelationLogic(insightProps))
    const { loadEventCorrelations } = useActions(funnelCorrelationLogic(insightProps))

    // Load correlations only if this component is mounted, and then reload if filters change
    useEffect(() => {
        // We only automatically refresh results when filters change after the user has manually asked for the first results to be loaded
        if (loadedEventCorrelationsTableOnce) {
            loadEventCorrelations({})
        }
    }, [filters])

    return (
        <FunnelCorrelationTableComponent
            steps={steps}
            aggregation_group_type_index={filters?.aggregation_group_type_index}
            aggregationTargetLabel={aggregationTargetLabel}
        />
    )
}

type FunnelCorrelationTableComponentProps = {
    steps: FunnelStepWithNestedBreakdown[]
    aggregation_group_type_index?: number | undefined
    aggregationTargetLabel: Noun
}

export function FunnelCorrelationTableComponent({
    steps,
    aggregation_group_type_index,
    aggregationTargetLabel,
}: FunnelCorrelationTableComponentProps): JSX.Element | null {
    const { insightProps } = useValues(insightLogic)
    const { openCorrelationPersonsModal } = useActions(funnelLogic(insightProps))
    const {
        correlationTypes,
        correlationsLoading,
        correlationValues,
        loadedEventCorrelationsTableOnce,
        eventHasPropertyCorrelations,
        eventWithPropertyCorrelationsLoading,
        eventWithPropertyCorrelationsValues,
        nestedTableExpandedKeys,
    } = useValues(funnelCorrelationLogic(insightProps))
    const {
        setCorrelationTypes,
        loadEventCorrelations,
        loadEventWithPropertyCorrelations,
        addNestedTableExpandedKey,
        removeNestedTableExpandedKey,
    } = useActions(funnelCorrelationLogic(insightProps))
    const { correlationPropKey } = useValues(funnelCorrelationUsageLogic(insightProps))
    const { reportCorrelationInteraction } = useActions(funnelCorrelationUsageLogic(insightProps))

    const onClickCorrelationType = (correlationType: FunnelCorrelationType): void => {
        if (correlationTypes) {
            if (correlationTypes.includes(correlationType)) {
                setCorrelationTypes(correlationTypes.filter((types) => types !== correlationType))
            } else {
                setCorrelationTypes([...correlationTypes, correlationType])
            }
        } else {
            setCorrelationTypes([correlationType])
        }
    }

    const renderOddsRatioTextRecord = (record: FunnelCorrelation): JSX.Element => {
        const get_friendly_numeric_value = (value: number): string => {
            if (value < 10 && !Number.isInteger(value)) {
                return value.toFixed(1)
            }

            return value.toFixed()
        }
        const is_success = record.correlation_type === FunnelCorrelationType.Success

        const { first_value, second_value } = parseDisplayNameForCorrelation(record)

        return (
            <>
                <h4>
                    {is_success ? <RiseOutlined className="text-success" /> : <FallOutlined className="text-danger" />}{' '}
                    <PropertyKeyInfo value={first_value} />
                    {second_value !== undefined && (
                        <>
                            {' :: '}
                            <PropertyKeyInfo value={second_value} disablePopover />
                        </>
                    )}
                </h4>
                <div>
                    {capitalizeFirstLetter(aggregationTargetLabel.plural)}{' '}
                    {aggregation_group_type_index != undefined ? 'that' : 'who'} converted were{' '}
                    <mark>
                        <b>
                            {get_friendly_numeric_value(record.odds_ratio)}x {is_success ? 'more' : 'less'} likely
                        </b>
                    </mark>{' '}
                    to{' '}
                    {record.result_type === FunnelCorrelationResultsType.EventWithProperties
                        ? 'have this event property'
                        : 'do this event'}
                </div>
                <CorrelationMatrix />
            </>
        )
    }

    const renderSuccessCount = (record: FunnelCorrelation): JSX.Element => {
        return (
            <ValueInspectorButton
                onClick={() => {
                    openCorrelationPersonsModal(record, true)
                }}
            >
                {record.success_count}
            </ValueInspectorButton>
        )
    }

    const renderFailureCount = (record: FunnelCorrelation): JSX.Element => {
        return (
            <ValueInspectorButton
                onClick={() => {
                    openCorrelationPersonsModal(record, false)
                }}
            >
                {record.failure_count}
            </ValueInspectorButton>
        )
    }

    const renderNestedTable = (eventName: string): JSX.Element => {
        if (eventWithPropertyCorrelationsLoading) {
            return (
                <div className="flex flex-col items-center py-2">
                    <Spinner className="text-2xl mb-2" />
                    <h3 className="mb-1 text-md font-semibold">Loading correlation results…</h3>
                    <p className="m-0 text-xs text-muted">This process can take up to 20 seconds.</p>
                </div>
            )
        }

        return (
            <div>
                <h4 className="pl-4">Correlated properties</h4>
                <Table
                    dataSource={eventWithPropertyCorrelationsValues[eventName]}
                    rowKey={(record: FunnelCorrelation) => record.event.event}
                    className="nested-properties-table"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        pageSize: 5,
                        hideOnSinglePage: true,
                        onChange: (page, page_size) =>
                            reportCorrelationInteraction(
                                FunnelCorrelationResultsType.EventWithProperties,
                                'pagination change',
                                { page, page_size }
                            ),
                    }}
                >
                    <Column
                        title="Property"
                        key="eventName"
                        render={(_, record: FunnelCorrelation) => renderOddsRatioTextRecord(record)}
                        align="left"
                    />
                    <Column
                        title="Completed"
                        key="success_count"
                        render={(_, record: FunnelCorrelation) => renderSuccessCount(record)}
                        width={90}
                        align="center"
                    />
                    <Column
                        title="Dropped off"
                        key="failure_count"
                        render={(_, record: FunnelCorrelation) => renderFailureCount(record)}
                        width={120}
                        align="center"
                    />

                    <Column
                        title=""
                        key="actions"
                        render={(_, record: FunnelCorrelation) => <EventCorrelationActionsCell record={record} />}
                        align="center"
                        width={30}
                    />
                </Table>
            </div>
        )
    }

    return steps.length > 1 ? (
        <VisibilitySensor id={correlationPropKey} offset={152}>
            <div className="funnel-correlation-table">
                <span className="funnel-correlation-header">
                    <span className="table-header">
                        <IconSelectEvents className="mr-1 text-2xl opacity-50" />
                        CORRELATED EVENTS
                    </span>
                    <span className="table-options">
                        <p className="title">CORRELATION</p>
                        <div
                            className="tab-btn ant-btn"
                            onClick={() => onClickCorrelationType(FunnelCorrelationType.Success)}
                        >
                            <Checkbox
                                checked={correlationTypes.includes(FunnelCorrelationType.Success)}
                                className="pointer-events-none"
                            >
                                Success
                            </Checkbox>
                        </div>
                        <div
                            className="tab-btn ant-btn"
                            onClick={() => onClickCorrelationType(FunnelCorrelationType.Failure)}
                        >
                            <Checkbox
                                checked={correlationTypes.includes(FunnelCorrelationType.Failure)}
                                className="pointer-events-none"
                            >
                                Drop-off
                            </Checkbox>
                        </div>
                    </span>
                </span>
                <ConfigProvider
                    renderEmpty={() => (
                        <FunnelCorrelationTableEmptyState
                            infoMessage="Correlated events highlights events users have also performed that are likely to have affected their conversion
                            rate within the funnel."
                            showLoadResultsButton={!loadedEventCorrelationsTableOnce}
                            loadResults={() => loadEventCorrelations({})}
                        />
                    )}
                >
                    <Table
                        dataSource={correlationValues}
                        loading={correlationsLoading}
                        size="small"
                        scroll={{ x: 'max-content' }}
                        rowKey={(record: FunnelCorrelation) => record.event.event}
                        pagination={{
                            pageSize: 5,
                            hideOnSinglePage: true,
                            onChange: () =>
                                reportCorrelationInteraction(FunnelCorrelationResultsType.Events, 'load more'),
                        }}
                        expandable={{
                            expandedRowRender: (record) => renderNestedTable(record.event.event),
                            expandedRowKeys: nestedTableExpandedKeys,
                            rowExpandable: () => aggregation_group_type_index === undefined,
                            expandIcon: ({ expanded, onExpand, record, expandable }) => {
                                if (!expandable) {
                                    return null
                                }
                                return expanded ? (
                                    <Tooltip title="Collapse">
                                        <LemonButton
                                            icon={<IconUnfoldLess />}
                                            status="stealth"
                                            type="tertiary"
                                            active
                                            noPadding
                                            onClick={(e) => {
                                                removeNestedTableExpandedKey(record.event.event)
                                                onExpand(record, e)
                                            }}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Expand to see correlated properties for this event">
                                        <LemonButton
                                            icon={<IconUnfoldMore />}
                                            status="stealth"
                                            type="tertiary"
                                            noPadding
                                            onClick={(e) => {
                                                !eventHasPropertyCorrelations(record.event.event) &&
                                                    loadEventWithPropertyCorrelations(record.event.event)
                                                addNestedTableExpandedKey(record.event.event)
                                                onExpand(record, e)
                                            }}
                                        />
                                    </Tooltip>
                                )
                            },
                        }}
                    >
                        <Column
                            title="Event"
                            key="eventName"
                            render={(_, record: FunnelCorrelation) => renderOddsRatioTextRecord(record)}
                            align="left"
                            ellipsis
                        />
                        <Column
                            title={
                                <div className="flex items-center">
                                    Completed
                                    <Tooltip
                                        title={`${capitalizeFirstLetter(aggregationTargetLabel.plural)} ${
                                            aggregation_group_type_index != undefined ? 'that' : 'who'
                                        } performed the event and completed the entire funnel.`}
                                    >
                                        <InfoCircleOutlined className="column-info" />
                                    </Tooltip>
                                </div>
                            }
                            key="success_count"
                            render={(_, record: FunnelCorrelation) => renderSuccessCount(record)}
                            width={90}
                            align="center"
                        />
                        <Column
                            title={
                                <div className="flex items-center">
                                    Dropped off
                                    <Tooltip
                                        title={
                                            <>
                                                {capitalizeFirstLetter(aggregationTargetLabel.plural)}{' '}
                                                {aggregation_group_type_index != undefined ? 'that' : 'who'} performed
                                                the event and did <b>not complete</b> the entire funnel.
                                            </>
                                        }
                                    >
                                        <InfoCircleOutlined className="column-info" />
                                    </Tooltip>
                                </div>
                            }
                            key="failure_count"
                            render={(_, record: FunnelCorrelation) => renderFailureCount(record)}
                            width={120}
                            align="center"
                        />
                        <Column
                            title=""
                            key="actions"
                            render={(_, record: FunnelCorrelation) => <EventCorrelationActionsCell record={record} />}
                            width={30}
                        />
                    </Table>
                </ConfigProvider>
            </div>
        </VisibilitySensor>
    ) : null
}
