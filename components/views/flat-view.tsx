import { FlatView } from '../../utils/config'
import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import { useIssues } from '../../hooks/issues'

const View: React.FunctionComponent<{ view: FlatView }> = ({ view }) => {
  const { data: config } = useConfig()

  let issues = config.repositories.reduce((issues, repository) => {
    let { data: repoIssues } = useIssues(config.organization, repository)
    return issues.concat(repoIssues)
  }, [])

  return (
    <div>
      {issues.map(issue => (
        <div>
          {issue.number}: {issue.title}
        </div>
      ))}
    </div>
  )
}

export default View
