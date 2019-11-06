import React, { Suspense } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useReactQueryConfig } from 'react-query'
import { useConfig } from '../hooks/config'

const Page = dynamic(() => import('../components/page'), { ssr: false })

useReactQueryConfig({
  suspense: true,
})

const PageTitle: React.FunctionComponent<{ title: string }> = ({ title }) => (
  <h2>{title}</h2>
)

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
