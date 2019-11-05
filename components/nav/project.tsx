import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import Section from './section'

const Project: React.FunctionComponent<{}> = props => {
  const { data: config } = useConfig()
  const { data: organization } = useOrganization(config.organization)

  return (
    <Section title="Project">
      <GitHubLink url={`https://github.com/${organization.login}`}>
        {organization.name}
      </GitHubLink>
    </Section>
  )
}

export default Project
