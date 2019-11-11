import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import NavSection from './nav-section'

const Organization: React.FunctionComponent<{}> = props => {
  const config = useConfig()
  const organization = useOrganization(config.organization)

  return (
    <NavSection title="Organization">
      <GitHubLink url={`https://github.com/${organization.login}`}>
        {organization.name}
      </GitHubLink>
    </NavSection>
  )
}

export default Organization
