import { useState } from 'react'
import { useActions, useValues } from 'kea'

import { insightLogic } from 'scenes/insights/insightLogic'
import { funnelLogic } from 'scenes/funnels/funnelLogic'

import { FunnelCorrelation, FunnelCorrelationResultsType } from '~/types'
import { Popover } from 'lib/lemon-ui/Popover/Popover'
import { LemonButton, LemonButtonProps } from 'lib/lemon-ui/LemonButton'
import { IconEllipsis } from 'lib/lemon-ui/icons'
import { funnelCorrelationLogic } from 'scenes/funnels/funnelCorrelationLogic'
import { funnelCorrelationDetailsLogic } from 'scenes/funnels/funnelCorrelationDetailsLogic'

export const EventCorrelationActionsCell = ({ record }: { record: FunnelCorrelation }): JSX.Element => {
    const { insightProps } = useValues(insightLogic)
    const { isEventExcluded, isEventPropertyExcluded } = useValues(funnelCorrelationLogic(insightProps))
    const { excludeEventFromProject, excludeEventPropertyFromProject } = useActions(
        funnelCorrelationLogic(insightProps)
    )
    const { setFunnelCorrelationDetails } = useActions(funnelCorrelationDetailsLogic(insightProps))
    const components = record.event.event.split('::')

    const buttons: LemonButtonProps[] = [
        ...(record.result_type === FunnelCorrelationResultsType.Events
            ? [
                  {
                      children: 'View correlation details',
                      onClick: () => setFunnelCorrelationDetails(record),
                  },
              ]
            : []),
        {
            children: 'Exclude event from project',
            title: 'Remove this event from any correlation analysis report in this project.',
            onClick: () => {
                record.result_type === FunnelCorrelationResultsType.EventWithProperties
                    ? excludeEventPropertyFromProject(components[0], components[1])
                    : excludeEventFromProject(components[0])
            },
            disabled:
                record.result_type === FunnelCorrelationResultsType.EventWithProperties
                    ? isEventPropertyExcluded(components[1])
                    : isEventExcluded(components[0]),
        },
    ]

    return <CorrelationActionsCellComponent buttons={buttons} />
}

export const PropertyCorrelationActionsCell = ({ record }: { record: FunnelCorrelation }): JSX.Element => {
    const { insightProps } = useValues(insightLogic)
    const { excludePropertyFromProject } = useActions(funnelLogic(insightProps))
    const { isPropertyExcludedFromProject } = useValues(funnelLogic(insightProps))
    const { setFunnelCorrelationDetails } = useActions(funnelCorrelationDetailsLogic(insightProps))
    const propertyName = (record.event.event || '').split('::')[0]

    const buttons: LemonButtonProps[] = [
        {
            children: 'View correlation details',
            onClick: () => setFunnelCorrelationDetails(record),
        },
        {
            children: 'Exclude property from project',
            title: 'Remove this property from any correlation analysis report in this project.',
            onClick: () => excludePropertyFromProject(propertyName),
            disabled: isPropertyExcludedFromProject(propertyName),
        },
    ]

    return <CorrelationActionsCellComponent buttons={buttons} />
}

type CorrelationActionsCellComponentProps = {
    buttons: LemonButtonProps[]
}

const CorrelationActionsCellComponent = ({ buttons }: CorrelationActionsCellComponentProps): JSX.Element => {
    const [popoverOpen, setPopoverOpen] = useState(false)
    return (
        <Popover
            visible={popoverOpen}
            actionable
            onClickOutside={() => setPopoverOpen(false)}
            overlay={buttons.map((props, index) => (
                <LemonButton key={index} status="stealth" fullWidth {...props} />
            ))}
        >
            <LemonButton status="stealth" onClick={() => setPopoverOpen(!popoverOpen)}>
                <IconEllipsis />
            </LemonButton>
        </Popover>
    )
}
