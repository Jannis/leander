import Head from 'next/head'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider } from '@apollo/react-hooks'
import ApolloClient from 'apollo-client'
import { useCookies } from 'react-cookie'

import Nav from './nav'

let client = new ApolloClient({
  link: new HttpLink({
    uri: `${window.location.protocol}//${window.location.host}/graphql`,
  }),
  cache: new InMemoryCache(),
})

const DynamicPage: React.FunctionComponent<{}> = props => {
  let [cookies] = useCookies(['leander-access-token'])

  if (!cookies['leander-access-token']) {
    window.location.href = `/login?returnTo=${window.location.href}`
    return <div />
  }

  return (
    <ApolloProvider client={client}>
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
        <div className="page font-sans font-normal text-sm leading-normal">
          <Nav />
          <div className="w-full flex p-4">{props.children}</div>
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
    </ApolloProvider>
  )
}

export default DynamicPage
