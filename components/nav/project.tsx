import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import NavSection from './nav-section'

const Project: React.FunctionComponent<{}> = props => {
  const { data: config } = useConfig()
  const { data: organization } = useOrganization(config.organization)

  return (
    <NavSection title="Project">
      <GitHubLink url={`https://github.com/${organization.login}`}>
        {organization.name}
      </GitHubLink>
    </NavSection>
  )
}

export default Project
