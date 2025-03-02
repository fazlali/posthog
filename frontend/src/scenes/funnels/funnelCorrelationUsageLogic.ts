import { BreakPointFunction, connect, kea, key, listeners, path, props, reducers, selectors } from 'kea'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { keyForInsightLogicProps } from 'scenes/insights/sharedUtils'

import { EntityTypes, FunnelCorrelationResultsType, FunnelsFilterType, InsightLogicProps } from '~/types'
import { visibilitySensorLogic } from 'lib/components/VisibilitySensor/visibilitySensorLogic'

import type { funnelCorrelationUsageLogicType } from './funnelCorrelationUsageLogicType'
import { insightLogic } from 'scenes/insights/insightLogic'
import { insightDataLogic } from 'scenes/insights/insightDataLogic'
import { parseEventAndProperty } from './funnelUtils'
import { funnelLogic } from './funnelLogic'
import { funnelDataLogic } from './funnelDataLogic'
import { funnelCorrelationLogic } from './funnelCorrelationLogic'
import { funnelPropertyCorrelationLogic } from './funnelPropertyCorrelationLogic'

export const funnelCorrelationUsageLogic = kea<funnelCorrelationUsageLogicType>([
    props({} as InsightLogicProps),
    key(keyForInsightLogicProps('insight_funnel')),
    path((key) => ['scenes', 'funnels', 'funnelCorrelationUsageLogic', key]),

    connect((props: InsightLogicProps) => ({
        logic: [eventUsageLogic],

        values: [
            insightLogic(props),
            ['filters', 'isInDashboardContext'],
            funnelPropertyCorrelationLogic(props),
            ['allProperties'],
        ],

        actions: [
            insightLogic(props),
            ['loadResultsSuccess'],
            insightDataLogic(props),
            ['loadDataSuccess'],
            funnelLogic(props),
            ['hideSkewWarning as legacyHideSkewWarning', 'openCorrelationPersonsModal'],
            funnelDataLogic(props),
            ['hideSkewWarning'],
            funnelCorrelationLogic(props),
            [
                'setCorrelationTypes',
                'excludeEventFromProject',
                'loadEventWithPropertyCorrelations',
                'excludeEventPropertyFromProject',
            ],
            funnelPropertyCorrelationLogic(props),
            ['setPropertyCorrelationTypes', 'excludePropertyFromProject', 'setPropertyNames'],
            eventUsageLogic,
            ['reportCorrelationViewed', 'reportCorrelationInteraction'],
        ],
    })),

    reducers({
        shouldReportCorrelationViewed: [
            true as boolean,
            {
                loadResultsSuccess: () => true,
                loadDataSuccess: () => true,
                reportCorrelationViewed: (current, { propertiesTable }) => {
                    const correlationViewed = !propertiesTable
                    return correlationViewed ? false : current
                },
            },
        ],
        shouldReportPropertyCorrelationViewed: [
            true as boolean,
            {
                loadResultsSuccess: () => true,
                loadDataSuccess: () => true,
                reportCorrelationViewed: (current, { propertiesTable }) => {
                    const propertyCorrelationViewed = !!propertiesTable
                    return propertyCorrelationViewed ? false : current
                },
            },
        ],
    }),

    selectors({
        correlationPropKey: [
            () => [(_, props) => props],
            (props): string => `correlation-${keyForInsightLogicProps('insight_funnel')(props)}`,
        ],
    }),

    listeners(({ values, actions }) => ({
        // skew warning
        legacyHideSkewWarning: () => {
            actions.reportCorrelationInteraction(FunnelCorrelationResultsType.Events, 'hide skew warning')
        },
        hideSkewWarning: () => {
            actions.reportCorrelationInteraction(FunnelCorrelationResultsType.Events, 'hide skew warning')
        },

        // event correlation
        [visibilitySensorLogic({ id: values.correlationPropKey }).actionTypes.setVisible]: async (
            { visible }: { visible: boolean },
            breakpoint: BreakPointFunction
        ) => {
            if (visible && values.shouldReportCorrelationViewed) {
                actions.reportCorrelationViewed(values.filters, 0)
                await breakpoint(10000)
                actions.reportCorrelationViewed(values.filters, 10)
            }
        },
        setCorrelationTypes: ({ types }) => {
            eventUsageLogic.actions.reportCorrelationInteraction(
                FunnelCorrelationResultsType.Events,
                'set correlation types',
                { types }
            )
        },
        excludeEventFromProject: async ({ eventName }) => {
            eventUsageLogic.actions.reportCorrelationInteraction(FunnelCorrelationResultsType.Events, 'exclude event', {
                event_name: eventName,
            })
        },

        // property correlation
        [visibilitySensorLogic({ id: `${values.correlationPropKey}-properties` }).actionTypes.setVisible]: async (
            { visible }: { visible: boolean },
            breakpoint: BreakPointFunction
        ) => {
            if (visible && values.shouldReportPropertyCorrelationViewed) {
                actions.reportCorrelationViewed(values.filters, 0, true)
                await breakpoint(10000)
                actions.reportCorrelationViewed(values.filters, 10, true)
            }
        },
        setPropertyCorrelationTypes: ({ types }) => {
            eventUsageLogic.actions.reportCorrelationInteraction(
                FunnelCorrelationResultsType.Properties,
                'set property correlation types',
                { types }
            )
        },
        excludePropertyFromProject: ({ propertyName }) => {
            eventUsageLogic.actions.reportCorrelationInteraction(
                FunnelCorrelationResultsType.Events,
                'exclude person property',
                {
                    person_property: propertyName,
                }
            )
        },

        // event property correlation
        setPropertyNames: async ({ propertyNames }) => {
            eventUsageLogic.actions.reportCorrelationInteraction(
                FunnelCorrelationResultsType.Properties,
                'set property names',
                { property_names: propertyNames.length === values.allProperties.length ? '$all' : propertyNames }
            )
        },
        loadEventWithPropertyCorrelations: async (eventName: string) => {
            eventUsageLogic.actions.reportCorrelationInteraction(
                FunnelCorrelationResultsType.EventWithProperties,
                'load event with properties',
                { name: eventName }
            )
        },
        excludeEventPropertyFromProject: async ({ propertyName }) => {
            eventUsageLogic.actions.reportCorrelationInteraction(
                FunnelCorrelationResultsType.EventWithProperties,
                'exclude event property',
                {
                    property_name: propertyName,
                }
            )
        },

        // person modal
        openCorrelationPersonsModal: ({ correlation, success }) => {
            if (values.isInDashboardContext) {
                return
            }

            if (correlation.result_type === FunnelCorrelationResultsType.Properties) {
                eventUsageLogic.actions.reportCorrelationInteraction(
                    FunnelCorrelationResultsType.Properties,
                    'person modal',
                    (values.filters as FunnelsFilterType)?.funnel_correlation_person_entity
                )
            } else {
                const { name, properties } = parseEventAndProperty(correlation.event)
                eventUsageLogic.actions.reportCorrelationInteraction(correlation.result_type, 'person modal', {
                    id: name,
                    type: EntityTypes.EVENTS,
                    properties,
                    converted: success,
                })
            }
        },
    })),
])
