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
        <div key={page.route} className={page.route === query.page ? 'active' : null}>
          <Link href="[page]" as={page.route}>
            <a>{page.title}</a>
          </Link>
          <style jsx>{`
            a {
              color: black;
              text-decoration: none;
            }

            .active a {
              text-decoration: underline;
            }
          `}</style>
        </div>
      ))}
    </Section>
  )
}

export default Pages
