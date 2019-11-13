import React, { Suspense } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useConfig } from '../hooks/config'
import { VIEWS } from '../components/views'
import { Config, Section } from '../utils/config'
import { Issue, Organization, Repository } from '../utils/types'
import { useOrganization } from '../hooks/organization'
import { useIssues } from '../hooks/issues'
import { useRepositories } from '../hooks/repository'

import '../styles/index.css'
import 'antd/dist/antd.css'

import { Spin, Icon } from 'antd'
import { useUser } from '../hooks/user'

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

const Page: React.FunctionComponent<{}> = props => {
  let router = useRouter()
  let config = useConfig()

  let page = config.pages.find(page => page.route === router.query.page)
  if (!page) {
    return <div>Unknown page "{router.query.page}"</div>
  }

  let user = useUser()
  let organization = useOrganization(config.organization)
  let repositories = useRepositories(organization, config.repositories)

  // Inject organization into repositories
  repositories.forEach(repository => {
    repository.organization = organization
  })

  // Inject repositories into issues
  let issues = useIssues(organization, repositories).map(issue => {
    if (typeof issue.repository === 'string') {
      issue.repository = repositories.find(
        repo => repo.name === (issue.repository as any),
      )
    }
    return issue
  })

  // If this is a user page, filter issues so only the ones assigned to this
  // user show up
  if (page.user) {
    issues = issues.filter(
      issue =>
        issue.stats.assignees.find(assignee => assignee.id === user.id) !== undefined,
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

export default () => (
  <DynamicPage>
    <Suspense
      fallback={
        <div className="w-full h-full flex justify-center items-center">
          <Spin
            indicator={
              <Icon type="smile" theme="twoTone" spin style={{ fontSize: 48 }} />
            }
          />
        </div>
      }
    >
      <Page />
    </Suspense>
  </DynamicPage>
)
