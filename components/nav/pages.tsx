import Link from 'next/link'
import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import Section from './nav-section'
import { useRouter } from 'next/router'

const Pages: React.FunctionComponent<{}> = props => {
  const { query } = useRouter()
  const { data: config } = useConfig()

  return (
    <Section title="Views">
      {config.pages.map(page => (
        <div
          key={page.route}
          className={page.route === query.page ? 'text-indigo-500 font-normal' : null}
        >
          <Link
            href={{ pathname: '[page]', query: { config: query.config } }}
            as={{ pathname: page.route, query: { config: query.config } }}
          >
            <a className="hover:text-indigo-500">{page.title}</a>
          </Link>
        </div>
      ))}
    </Section>
  )
}

export default Pages
