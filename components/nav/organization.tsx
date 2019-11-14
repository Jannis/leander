import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import NavSection from './nav-section'
import Spinner from '../spinner'
import { InlineError } from '../errors'

const Organization: React.FunctionComponent<{}> = props => {
  const config = useConfig()

  const { loading, error, data } = useOrganization(
    { login: config.organization },
    { skip: false },
  )

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <InlineError error={error} />
  }

  let organization = data && data.organization

  return (
    <NavSection title="Organization">
      <GitHubLink url={`https://github.com/${organization.login}`}>
        {organization.name}
      </GitHubLink>
    </NavSection>
  )
}

export default Organization
