import React, { Suspense } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import '../styles/index.css'
import 'antd/dist/antd.css'

import { Organization, Repository, Issue, User } from 'leander-server'
import { VIEWS } from '../components/views'
import Spinner from '../components/spinner'
import { ErrorSection } from '../components/errors'
import { useConfig } from '../hooks/config'
import { useUser } from '../hooks/user'
import { useData } from '../hooks/data'
import { Config, Section, Page } from '../utils/config'

const DynamicPage = dynamic(() => import('../components/dynamic-page'), { ssr: false })

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

interface PageWithUserProps {
  config: Config
  page: Page
  user: User
}

const PageWithUser: React.FunctionComponent<PageWithUserProps> = ({
  config,
  page,
  user,
}) => {
  let { loading, error, data } = useData(config)
  if (loading) {
    return <Spinner />
  }
  if (error) {
    return <ErrorSection error={error} />
  }

  let organization = data.organization
  let repositories = organization.repositories

  // Combine issues from all repositories, inject the repositories
  // into the issues on the way
  let issues = repositories.reduce(
    (issues, repository) => [
      ...issues,
      ...repository.issues.map(issue => ({ ...issue, repository })),
    ],
    [],
  )

  // If this is a user page, filter issues so only the ones assigned to this
  // user show up
  if (page.user && issues) {
    issues = issues.filter(
      issue => issue.assignees.find(assignee => assignee.id === user.id) !== undefined,
    )
  }

  return (
    <div className="flex flex-col w-full pt-6 mt-1">
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
    </div>
  )
}

const InnerPage: React.FunctionComponent<{}> = props => {
  let router = useRouter()
  let config = useConfig()

  let page = config.pages.find(page => page.route === router.query.page)
  if (!page) {
    return <div>Unknown page "{router.query.page}"</div>
  }

  let { loading, error, data } = useUser()
  if (loading) {
    return <Spinner />
  }
  if (error) {
    return <ErrorSection error={error} />
  }
  let user = data && data.user

  return <PageWithUser config={config} page={page} user={user} />
}

export default () => (
  <DynamicPage>
    <Suspense fallback={<Spinner />}>
      <InnerPage />
    </Suspense>
  </DynamicPage>
)
