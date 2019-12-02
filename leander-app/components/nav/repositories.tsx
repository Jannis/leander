import { useConfig } from '../../hooks/config'
import GitHubLink from './github-link'
import NavSection from './nav-section'

const Repositories: React.FunctionComponent<{}> = props => {
  const config = useConfig()

  config.repositories.sort()

  return (
    <NavSection title="Repositories">
      {config.repositories.map(repository => (
        <GitHubLink
          key={repository}
          url={`https://github.com/${config.organization}/${repository}`}
        >
          {repository}
        </GitHubLink>
      ))}
    </NavSection>
  )
}

export default Repositories
