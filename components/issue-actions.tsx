import { Issue, Organization, Repository } from '../utils/types'
import {
  useSetSeverity,
  useSetPriority,
  useSetProjects,
  useSetAssignees,
} from '../hooks/mutations/issues'
import { Avatar, Icon, Radio, Select, Tag } from 'antd'
import { useMutation } from '@apollo/react-hooks'
import { stripLabelPrefix } from '../utils/labels'

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
  let [setSeverity, { data }] = useSetSeverity()

  let choices = [
    { value: 'bug', icon: 'bug', title: 'Bug', color: 'red' },
    { value: 'feature', icon: 'build', title: 'Feature', color: 'limeGreen' },
    { value: 'unknown', icon: 'question-circle', title: '-', color: 'lightGray' },
  ]

  return (
    <div className="flex-col p-4">
      <div className="font-medium">Severity</div>
      <Radio.Group
        defaultValue={issue.stats.severity || 'unknown'}
        onChange={e =>
          setSeverity({
            issue,
            severity: e.target.value === 'unknown' ? null : e.target.value,
          })
        }
      >
        {choices.map(choice => (
          <Radio.Button key={choice.value} value={choice.value}>
            <div className="flex flex-row items-center">
              <Icon type={choice.icon} theme="twoTone" twoToneColor={choice.color} />
              <span className="pl-1">{choice.title}</span>
            </div>
          </Radio.Button>
        ))}
      </Radio.Group>
    </div>
  )
}

const PriorityActions: React.FunctionComponent<Props> = ({ issue }) => {
  let [setPriority, { data }] = useSetPriority()

  let choices = [
    { value: 'p0', title: 'P0', hint: 'Drop everything', color: 'red' },
    { value: 'p1', title: 'P1', hint: 'High priority', color: 'darkOrange' },
    { value: 'p2', title: 'P2', hint: 'Soon', color: 'purple' },
    { value: 'p3', title: 'P3', hint: 'When possible', color: 'darkGray' },
    { value: 'unknown', title: '-', hint: '', color: 'inherit' },
  ]

  return (
    <div className="flex-col p-4">
      <div className="container flex flex-row items-center font-medium">
        <div className="mr-2">Priority</div>
        <a
          className="flex flex-col items-center"
          target="_blank"
          href="https://github.com/ampproject/amphtml/blob/master/contributing/issue-priorities.md"
        >
          <Icon type="question-circle" />
        </a>
      </div>
      <Radio.Group
        defaultValue={issue.stats.priority || 'unknown'}
        onChange={e =>
          setPriority({
            issue,
            priority: e.target.value === 'unknown' ? null : e.target.value,
          })
        }
      >
        {choices.map(choice => (
          <Radio.Button key={choice.value} value={choice.value}>
            <div className="flex flex-row items-center">
              <span className="pl-1" style={{ color: choice.color }}>
                {choice.title}
              </span>
              <span className="pl-1 bg-lightGray">{choice.hint}</span>
            </div>
          </Radio.Button>
        ))}
      </Radio.Group>
    </div>
  )
}

const ProjectActions: React.FunctionComponent<Props> = ({ issue }) => {
  let [setProjects, { data }] = useSetProjects()

  let choices = issue.repository.labels
    .filter(label => label.name.match(/^projects?\//))
    .map(label => ({
      value: label.id,
      title: stripLabelPrefix(label.name),
      color: label.color,
    }))

  return (
    <div className="flex-col p-4">
      <div className="font-medium">Projects</div>
      <Select
        className="w-64"
        mode="multiple"
        defaultValue={issue.stats.projects.map(label => label.id)}
        onChange={projects => setProjects({ issue, projects })}
      >
        {choices.map(choice => (
          <Select.Option key={choice.value} value={choice.value}>
            <Tag style={{ borderColor: `#${choice.color}` }}>{choice.title}</Tag>
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

const AssigneeActions: React.FunctionComponent<Props> = ({ issue }) => {
  let [setAssignees, { data }] = useSetAssignees()

  return (
    <div className="flex-col p-4">
      <div className="font-medium">Assignee</div>
      <Select
        className="w-64"
        mode="multiple"
        defaultValue={issue.stats.assignees.map(user => user.id)}
        onChange={assignees => setAssignees({ issue, assignees })}
      >
        {issue.repository.organization.members.map(member => (
          <Select.Option key={member.id} value={member.id}>
            <div className="flex flex-row items-center">
              <Avatar
                src={member.avatarUrl}
                alt={member.name || member.login}
                size="small"
              />
              <span className="pl-2">{member.login}</span>
            </div>
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}

const IssueActions: React.FunctionComponent<Props> = ({ issue }) => {
  return (
    <div className="w-full flex flex-col bg-gray-100">
      <div className="w-full flex flex-row flex-wrap leading-loose bg-gray-100">
        <SeverityActions issue={issue} />
        <PriorityActions issue={issue} />
      </div>
      <div className="w-full flex flex-row flex-wrap leading-loose bg-gray-100">
        <AssigneeActions issue={issue} />
        <ProjectActions issue={issue} />
      </div>
    </div>
  )
}

export default IssueActions
