import Head from 'next/head'
import { useCookies } from 'react-cookie'

import Nav from './nav'
import Content from './content'
import { useGitHubAccessToken } from '../hooks/github'

const Page: React.FunctionComponent<{}> = props => {
  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
        />
      </Head>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: sans-serif;
          line-height: 1.5rem;
        }
      `}</style>
      <div className="page">
        <Nav />
        <Content>{props.children}</Content>
      </div>
      <style jsx>{`
        .page {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
          min-width: 100vw;
        }
      `}</style>
    </div>
  )
}

export default Page
