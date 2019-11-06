import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import NavSection from './nav-section'

const Repositories: React.FunctionComponent<{}> = props => {
  const { data: config } = useConfig()
  const { data: organization } = useOrganization(config.organization)

  return (
    <NavSection title="Repositories">
      {config.repositories.map(repository => (
        <GitHubLink
          key={repository}
          url={`https://github.com/${organization.login}/${repository}`}
        >
          {repository}
        </GitHubLink>
      ))}
    </NavSection>
  )
}

export default Repositories
