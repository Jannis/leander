import Link from 'next/link'
import { ParsedUrlQuery } from 'querystring'
import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import GitHubLink from './github-link'
import Section from './nav-section'
import { useRouter } from 'next/router'
import { Page } from '../../utils/config'

const PageLink: React.FunctionComponent<{ query: ParsedUrlQuery; page: Page }> = ({
  query,
  page,
}) => (
  <div>
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
)

const Pages: React.FunctionComponent<{}> = props => {
  const { query } = useRouter()
  const config = useConfig()

  let generalPages = config.pages.filter(page => !page.user)
  let userPages = config.pages.filter(page => page.user)

  return (
    <>
      <Section title="Views">
        {generalPages.map(page => (
          <PageLink key={page.route} page={page} query={query} />
        ))}
      </Section>
      <Section title="User">
        {userPages.length === 0 ? (
          <div>No user pages</div>
        ) : (
          userPages.map(page => <PageLink key={page.route} page={page} query={query} />)
        )}
      </Section>
    </>
  )
}

export default Pages
