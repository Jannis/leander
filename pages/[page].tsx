import React, { Suspense } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useReactQueryConfig } from 'react-query'
import { useConfig } from '../hooks/config'
import { VIEWS } from '../components/views'
import { Config, Section } from '../utils/config'

const Page = dynamic(() => import('../components/page'), { ssr: false })

useReactQueryConfig({
  suspense: true,
})

const PageTitle: React.FunctionComponent<{ title: string }> = ({ title }) => (
  <h2>{title}</h2>
)

const SectionTitle: React.FunctionComponent<{ title: string }> = ({ title }) => (
  <h3>{title}</h3>
)

const PageSection: React.FunctionComponent<{ section: Section }> = ({ section }) => {
  if (Object.keys(section).length === 0) {
    throw new Error(`Section is missing a view: ${JSON.stringify(section)}`)
  }

  let viewType = Object.keys(section).pop()
  let ViewComponent = VIEWS[viewType]

  if (ViewComponent === undefined) {
    throw new Error(`Unsupported view type "{viewType}"`)
  }

  return section.title ? (
    <div>
      <SectionTitle title={section.title} />
      <ViewComponent view={section[viewType]} />
    </div>
  ) : (
    <div>
      <ViewComponent view={section[viewType]} />
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

  return (
    <div>
      <PageTitle title={page.title} />
      <div>
        {page.sections.map((section, index) => (
          <PageSection key={`${index}`} section={section} />
        ))}
      </div>
    </div>
  )
}

export default () => (
  <Page>
    <Suspense fallback={<div>Loading...</div>}>
      <CustomPage />
    </Suspense>
  </Page>
)
