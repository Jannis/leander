const { fetch } = require('cross-fetch')
const gql = require('graphql-tag')
const { ApolloServer } = require('apollo-server-express')
const { InMemoryCache } = require('apollo-cache-inmemory')
const { ApolloClient } = require('apollo-client')
const { HttpLink } = require('apollo-link-http')

const Organization = require('./resolvers/organization')
const Repository = require('./resolvers/repository')
const Issue = require('./resolvers/issue')
const Viewer = require('./resolvers/viewer')

const typeDefs = gql`
  type User {
    id: String!
    login: String!
    name: String
    avatarUrl: String!
  }

  type Organization {
    id: String!
    login: String!
    name: String!
    members: [User!]!
  }

  type Label {
    id: ID!
    name: String!
    color: String!
  }

  type Repository {
    id: ID!
    name: String!
    organization: String!
    labels: [Label!]!
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

  type IssueStats {
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
    phase: String
    labels: [Label!]!
    projects: [Label!]!
    size: Int
  }

  type Issue {
    id: ID!
    repository: String!
    number: Int
    title: String!
    stats: IssueStats!
  }

  type Query {
    viewer: User!
    organization(login: String!): Organization!
    repositories(owner: String!, names: [String!]!): [Repository!]!
    issues(owner: String!, repositories: [String!]!): [Issue!]!
  }

  type Mutation {
    updateIssueLabels(issue: ID!, labelsToRemove: [ID!]!, labelsToAdd: [ID!]!): Issue!
    updateAssignees(issue: ID!, assigneesToRemove: [ID!]!, assigneesToAdd: [ID!]!): Issue!
  }
`

const createGithubClient = ({ cache, accessToken }) =>
  new ApolloClient({
    link: new HttpLink({
      uri: 'https://api.github.com/graphql',
      fetch,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    cache,
    defaultOptions: {
      query: {
        fetch: 'network-only',
      },
    },
  })

const installGraphQLServer = async ({ app, path }) => {
  let cache = new InMemoryCache()

  let apolloServer = new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        ...Organization.resolvers,
        ...Repository.resolvers,
        ...Issue.resolvers,
        ...Viewer.resolvers,
      },
      Mutation: {
        ...Issue.mutations,
      },
    },
    debug: true,
    introspection: true,
    cors: {
      credentials: true,
      origin: '*',
    },
    playground: {
      settings: {
        'request.credentials': 'include',
      },
    },
    context: ({ req }) => ({
      githubClient: req.cookies['leander-access-token']
        ? createGithubClient({
            cache,
            accessToken: req.cookies['leander-access-token'],
          })
        : undefined,
    }),
  })

  apolloServer.applyMiddleware({
    app,
    path,
    cors: {
      origin: '*',
      credentials: true,
    },
  })
}

module.exports = {
  installGraphQLServer,
}
