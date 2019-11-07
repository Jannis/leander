import { FlatView } from '../../utils/config'
import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import { useIssues } from '../../hooks/issues'
import { Issue } from '../../utils/types'

const View: React.FunctionComponent<{ view: FlatView }> = ({ view }) => {
  const { data: config } = useConfig()
  const { data: organization } = useOrganization(config.organization)

  let issues = config.repositories.reduce(
    (issues, repository) => {
      let { data: repoIssues } = useIssues(organization, repository)
      return issues.concat(repoIssues)
    },
    [] as Issue[],
  )

  return (
    <div>
      {issues.map(issue => (
        <ul key={issue.id}>
          <li>{issue.id}</li>
          <li>{issue.number}</li>
          <li>{issue.title}</li>
          <li>{issue.repositoryName}</li>
          <li>{issue.stats.age.humanize()}</li>
          <li>{issue.stats.updated.humanize()}</li>
          <li>{issue.stats.assigned}</li>
          <li>{JSON.stringify(issue.stats.assignees)}</li>
          <li>{JSON.stringify(issue.stats.labels)}</li>
          <li>{issue.stats.phase}</li>
          <li>{issue.stats.severity}</li>
          <li>{issue.stats.source}</li>
          <li>{issue.stats.status}</li>
          <li>{issue.stats.triaged}</li>
          <li>{issue.stats.activity}</li>
        </ul>
      ))}
    </div>
  )
}

export default View
