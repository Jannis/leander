import React, { Suspense } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useConfig } from '../hooks/config'
import { VIEWS } from '../components/views'
import { Config, Section } from '../utils/config'
import { Grid, CircularProgress } from '@material-ui/core'
import { Issue, Organization, Repository } from '../utils/types'
import { useOrganization } from '../hooks/organization'
import { useIssuesForRepositories } from '../hooks/issues'
import { useRepositories } from '../hooks/repositories'

import '../styles/index.css'

const Page = dynamic(() => import('../components/page'), { ssr: false })

interface Props {
  section: Section
  organization: Organization
  repositories: Repository[]
  issues: Issue[]
}

const PageSection: React.FunctionComponent<Props> = ({
  section,
  organization,
  repositories,
  issues,
}) => {
  if (Object.keys(section).length === 0) {
    throw new Error(`Section is missing a view: ${JSON.stringify(section)}`)
  }

  let viewType = Object.keys(section).pop()
  let ViewComponent = VIEWS[viewType]

  if (ViewComponent === undefined) {
    throw new Error(`Unsupported view type "${viewType}"`)
  }

  return (
    <div className="mb-8">
      {section.title ? (
        <>
          <h3 className="font-bold">{section.title}</h3>
          <ViewComponent
            view={section[viewType]}
            organization={organization}
            repositories={repositories}
            issues={issues}
          />
        </>
      ) : (
        <ViewComponent
          view={section[viewType]}
          organization={organization}
          repositories={repositories}
          issues={issues}
        />
      )}
    </div>
  )
}

const CustomPage: React.FunctionComponent<{}> = props => {
  let router = useRouter()
  let { page: route } = router.query
  let { data: config } = useConfig()

  let page = config.pages.find(page => page.route === route)
  if (!page) {
    return <div>Unknown page "{route}"</div>
  }

  const { data: organization } = useOrganization(config.organization)
  const { data: repositories } = useRepositories(organization, config.repositories)
  const { data: issues } = useIssuesForRepositories(repositories)

  return (
    <Grid container direction="column" style={{ width: '100%' }}>
      <h2 className="text-2xl font-bold mb-4">{page.title}</h2>
      <div>
        {page.sections.map((section, index) => (
          <PageSection
            key={`${index}`}
            section={section}
            organization={organization}
            repositories={repositories}
            issues={issues}
          />
        ))}
      </div>
    </Grid>
  )
}

export default () => (
  <Page>
    <Suspense
      fallback={
        <div className="w-full h-full flex justify-center items-center">
          <CircularProgress />
        </div>
      }
    >
      <CustomPage />
    </Suspense>
  </Page>
)
