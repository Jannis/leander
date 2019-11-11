import Link from 'next/link'
import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import Section from './nav-section'
import { useRouter } from 'next/router'

const Pages: React.FunctionComponent<{}> = props => {
  const { query } = useRouter()
  const config = useConfig()

  return (
    <Section title="Views">
      {config.pages.map(page => (
        <div key={page.route}>
          <Link
            href={{ pathname: '[page]', query: { config: query.config } }}
            as={{ pathname: page.route, query: { config: query.config } }}
          >
            <a
              className={`text-black hover:text-blue-500 ${
                page.route === query.page ? 'font-medium text-blue-500' : ''
              }`}
            >
              {page.title}
            </a>
          </Link>
        </div>
      ))}
    </Section>
  )
}

export default Pages
