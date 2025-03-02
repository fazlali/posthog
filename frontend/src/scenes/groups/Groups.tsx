import { useActions, useValues } from 'kea'
import { Group } from '~/types'
import { groupsListLogic } from './groupsListLogic'
import { PropertiesTable } from 'lib/components/PropertiesTable'
import { PersonPageHeader } from 'scenes/persons/PersonPageHeader'
import { LemonTableColumns } from 'lib/lemon-ui/LemonTable/types'
import { TZLabel } from 'lib/components/TZLabel'
import { LemonTable } from 'lib/lemon-ui/LemonTable'
import { Link } from 'lib/lemon-ui/Link'
import { urls } from 'scenes/urls'
import { SceneExport } from 'scenes/sceneTypes'
import { GroupsIntroduction } from 'scenes/groups/GroupsIntroduction'
import { groupsAccessLogic, GroupsAccessStatus } from 'lib/introductions/groupsAccessLogic'
import { groupDisplayId } from 'scenes/persons/GroupActorHeader'
import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { AlertMessage } from 'lib/lemon-ui/AlertMessage'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { LemonDivider } from 'lib/lemon-ui/LemonDivider'

export const scene: SceneExport = {
    component: Groups,
    logic: groupsListLogic,
}

export function Groups(): JSX.Element {
    const {
        currentTabName,
        groupName: { singular, plural },
        groups,
        groupsLoading,
        search,
    } = useValues(groupsListLogic)
    const { loadGroups, setSearch } = useActions(groupsListLogic)
    const { groupsAccessStatus } = useValues(groupsAccessLogic)

    if (
        groupsAccessStatus == GroupsAccessStatus.HasAccess ||
        groupsAccessStatus == GroupsAccessStatus.HasGroupTypes ||
        groupsAccessStatus == GroupsAccessStatus.NoAccess
    ) {
        return (
            <>
                <PersonPageHeader />
                <GroupsIntroduction access={groupsAccessStatus} />
            </>
        )
    }

    const columns: LemonTableColumns<Group> = [
        {
            title: currentTabName,
            key: 'group_key',
            render: function Render(_, group: Group) {
                return (
                    <Link to={urls.group(group.group_type_index.toString(), group.group_key)}>
                        {groupDisplayId(group.group_key, group.group_properties)}
                    </Link>
                )
            },
        },
        {
            title: 'First seen',
            key: 'created_at',
            render: function Render(_, group: Group) {
                return <TZLabel time={group.created_at} />
            },
        },
    ]

    return (
        <>
            <PersonPageHeader />
            <LemonInput
                type="search"
                placeholder={`Search for ${plural}`}
                onChange={setSearch}
                value={search}
                data-attr="group-search"
                className="mb-4"
            />
            <LemonDivider className="mb-4" />
            <LemonTable
                columns={columns}
                rowKey="group_key"
                loading={groupsLoading}
                dataSource={groups.results}
                expandable={{
                    expandedRowRender: function RenderPropertiesTable({ group_properties }) {
                        return <PropertiesTable properties={group_properties} />
                    },
                    rowExpandable: ({ group_properties }) =>
                        !!group_properties && Object.keys(group_properties).length > 0,
                }}
                pagination={{
                    controlled: true,
                    onBackward: groups.previous
                        ? () => {
                              loadGroups(groups.previous)
                              window.scrollTo(0, 0)
                          }
                        : undefined,
                    onForward: groups.next
                        ? () => {
                              loadGroups(groups.next)
                              window.scrollTo(0, 0)
                          }
                        : undefined,
                }}
                emptyState={
                    <>
                        <AlertMessage type="info">
                            No {plural} found. Make sure to send properties with your {singular} for them to show up in
                            the list.{' '}
                            <a
                                href="https://posthog.com/docs/user-guides/group-analytics"
                                rel="noopener"
                                target="_blank"
                            >
                                Read more here.
                            </a>
                        </AlertMessage>
                        <CodeSnippet language={Language.JavaScript} wrap>
                            {`posthog.group('${singular}', 'id:5', {\n` +
                                `    name: 'Awesome ${currentTabName}',\n` +
                                '    value: 11\n' +
                                '});'}
                        </CodeSnippet>
                    </>
                }
            />
        </>
    )
}
