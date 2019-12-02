"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const apollo_link_http_1 = require("apollo-link-http");
const apollo_client_1 = __importDefault(require("apollo-client"));
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const resolvers_1 = __importDefault(require("./resolvers"));
const user_store_1 = require("../user-store");
const typeDefs = graphql_tag_1.default `
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
`;
exports.installGraphQLServer = ({ app, path }, { userStores }) => {
    let server = express_1.Router();
    let apolloServer = new apollo_server_express_1.ApolloServer({
        typeDefs,
        resolvers: resolvers_1.default,
        introspection: true,
        playground: {
            settings: {
                'request.credentials': 'include',
            },
        },
        context: ({ req }) => {
            // Extract the user's access token from the request / session
            let { accessToken } = (req.user || {});
            // Look up or create store for this user
            let userStore = accessToken ? userStores.get(accessToken) : undefined;
            if (accessToken && userStore === undefined) {
                console.log('Create store for user');
                let client = new apollo_client_1.default({
                    link: new apollo_link_http_1.HttpLink({
                        uri: 'https://api.github.com/graphql',
                        fetch: cross_fetch_1.default,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }),
                    cache: new apollo_cache_inmemory_1.InMemoryCache(),
                });
                userStore = new user_store_1.UserStore(client);
                userStores.set(accessToken, userStore);
            }
            return {
                userStore: accessToken ? userStore : undefined,
            };
        },
    });
    apolloServer.applyMiddleware({
        app,
        path,
    });
    return server;
};
