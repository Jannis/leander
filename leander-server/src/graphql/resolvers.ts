import ApolloClient from 'apollo-client'
import { Resolvers, Organization, Repository, Issue } from '../generated/graphql/types'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag'
import { ApolloError, addResolveFunctionsToSchema } from 'apollo-server'
import { queryRepositoryIssues } from './issues'
import {
  UserStore,
  RepositoryEntity,
  IssueEntity,
  OrganizationEntity,
} from '../user-store'

interface ResolverContext {
  userStore: UserStore
}

const authorizedResolver = (resolver: any) => {
  return (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.userStore) {
      throw new ApolloError('Unauthorized')
    }
    return resolver(parent, args, ctx, info)
  }
}

const resolvers: Partial<Resolvers> = {
  Query: {
    user: authorizedResolver(async (_: any, { login }, { userStore }) =>
      login ? await userStore.getUser(login) : await userStore.getViewer(),
    ),

    organization: authorizedResolver(
      async (_: any, { login }, { userStore }) => await userStore.getOrganization(login),
    ),
  },

  Organization: {
    members: authorizedResolver(
      async (organization: OrganizationEntity, _, { userStore }) =>
        await Promise.all(
          organization.members.map(async login => await userStore.getUser(login)),
        ),
    ),

    repositories: authorizedResolver(
      async (organization: OrganizationEntity, { names }, { userStore }) =>
        await Promise.all(
          names.map(async name => await userStore.getRepository(organization, name)),
        ),
    ),
  },

  Repository: {
    organization: authorizedResolver(
      async (repository: RepositoryEntity, _, { userStore }) =>
        await userStore.getOrganization(repository.organization),
    ),

    issues: authorizedResolver(
      async (repository: RepositoryEntity, _, { userStore }) =>
        await userStore.getIssues(repository),
    ),
  },

  Issue: {
    assignees: authorizedResolver(
      async (issue: IssueEntity, _, { userStore }) =>
        await Promise.all(
          ((issue.assignees as unknown) as string[]).map(
            async login => await userStore.getUser(login),
          ),
        ),
    ),
  },
}

export default resolvers
