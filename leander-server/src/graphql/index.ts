import { Router, Application } from 'express'
import { ApolloServer, ApolloError } from 'apollo-server-express'
import gql from 'graphql-tag'
import LRUCache = require('lru-cache')
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import ApolloClient from 'apollo-client'
import fetch from 'cross-fetch'

import resolvers from './resolvers'
import { UserStore } from '../user-store'

const typeDefs = gql`
  type User {
    id: ID!
    login: String!
    name: String
    avatarUrl: String!
  }

  type Organization {
    id: ID!
    login: String!
    name: String
    members: [User!]!

    repositories(names: [String!]!): [Repository!]!
  }

  type Repository {
    id: ID!
    organization: Organization!
    name: String!
    labels: [Label!]!

    issues: [Issue!]!
  }

  type Label {
    id: ID!
    name: String!
    color: String!
  }

  type Issue {
    id: ID!
    repository: Repository!
    number: Int!
    title: String!

    # Leander-specific fields
    age: String!
    updated: String!
    status: IssueStatus!
    severity: IssueSeverity
    priority: IssuePriority
    source: IssueSource!
    assigned: Boolean!
    assignees: [User!]!
    activity: Int!
    triaged: Boolean!
    stage: String
    labels: [Label!]!
    projects: [Label!]!
    size: Int
  }

  enum IssueStatus {
    open
    closed
  }

  enum IssueSeverity {
    bug
    feature
  }

  enum IssuePriority {
    p0
    p1
    p2
    p3
  }

  enum IssueSource {
    internal
    external
  }

  type Query {
    user(login: String): User
    organization(login: String!): Organization
  }
`

interface GraphQLServerOptions {
  userStores: LRUCache<string, UserStore>
}

export const installGraphQLServer = (
  { app, path }: { app: Application; path: string },
  { userStores }: GraphQLServerOptions,
): Router => {
  let server = Router()

  let apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: {
      settings: {
        'request.credentials': 'include',
      },
    },
    context: ({ req }) => {
      // Extract the user's access token from the request / session
      let { accessToken } = (req.user || {}) as any

      // Look up or create store for this user
      let userStore = accessToken ? userStores.get(accessToken) : undefined
      if (accessToken && userStore === undefined) {
        console.log('Create store for user')

        let client = new ApolloClient({
          link: new HttpLink({
            uri: 'https://api.github.com/graphql',
            fetch,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          cache: new InMemoryCache(),
        })

        userStore = new UserStore(client)
        userStores.set(accessToken, userStore)
      }

      return {
        userStore: accessToken ? userStore : undefined,
      }
    },
  })

  apolloServer.applyMiddleware({
    app,
    path,
  })

  return server
}
