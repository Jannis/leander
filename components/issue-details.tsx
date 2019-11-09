import BugReportOutlinedIcon from '@material-ui/icons/BugReportOutlined'
import BuildOutlinedIcon from '@material-ui/icons/BuildOutlined'
import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined'
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined'
import CheckCircleOutlineOutlinedIcon from '@material-ui/icons/CheckCircleOutlineOutlined'
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined'
import { Avatar } from '@material-ui/core'
import { useMutation } from 'react-query'

import { Issue, Organization, Repository } from '../utils/types'
import { setIssueSeverity } from '../hooks/issues'
import { useGitHubAccessToken } from '../hooks/github'

interface Props {
  issue: Issue
}

const ActionGroup: React.FunctionComponent<{ items: any[] }> = ({ items }) => (
  <div className="flex flex-row flex-wrap">
    {items.map((item, index) => (
      <div
        key={`${index}`}
        className={`p-1 cursor-pointer hover:opacity-100 ${
          item.active ? 'opacity-100' : 'opacity-50'
        }`}
        onClick={() => item.action()}
      >
        {item.render()}
      </div>
    ))}
  </div>
)

const SeverityActions: React.FunctionComponent<Props> = ({ issue }) => {
  let { data: accessToken } = useGitHubAccessToken()
  let [mutate] = useMutation(setIssueSeverity)

  return (
    <div className="p-8">
      <span className="font-medium">Severity</span>
      <ActionGroup
        items={[
          {
            render: () => <BugReportOutlinedIcon color="error" />,
            action: async () => await mutate({ issue, severity: 'bug', accessToken }),
            active: issue.stats.severity === 'bug',
          },
          {
            render: () => <BuildOutlinedIcon color="primary" />,
            action: async () => await mutate({ issue, severity: 'feature', accessToken }),
            active: issue.stats.severity === 'feature',
          },
          {
            render: () => <HelpOutlineOutlinedIcon color="disabled" />,
            action: async () => await mutate({ issue, severity: 'unknown', accessToken }),
            active: issue.stats.severity === 'unknown',
          },
        ]}
      />
    </div>
  )
}

const IssueDetails: React.FunctionComponent<Props> = ({ issue }) => {
  return (
    <div className="w-full flex flex-wrap bg-gray-100 leading-loose">
      <SeverityActions issue={issue} />
      <div className="p-8">
        <span className="font-medium">Assignees</span>
        <ActionGroup
          items={issue.repository.organization.members.map(member => ({
            render: () => (
              <Avatar
                alt={member.name || member.login}
                src={member.avatarUrl}
                style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '1px',
                }}
              />
            ),
            action: () => alert('assign/unassign'),
            active:
              issue.stats.assignees.find(assignee => assignee.login === member.login) !==
              undefined,
          }))}
        />
      </div>
      <div className="p-8">
        <span className="font-medium">Priority</span>
        <ActionGroup
          items={['p0', 'p1', 'p2', 'p3', 'x'].map(priority => ({
            render: () => {
              let colors = {
                p0: 'red',
                p1: 'darkOrange',
                p2: 'orange',
                p3: 'darkYellow',
                undefined: 'darkGrey',
              }

              return (
                <span style={{ fontWeight: 500, color: colors[priority] }}>
                  {(priority || '').toUpperCase()}
                </span>
              )
            },
            action: () => alert('set priority'),
            active: issue.stats.priority === priority,
          }))}
        />
      </div>
    </div>
  )
}

export default IssueDetails
