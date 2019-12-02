import gql from 'graphql-tag'
import { Issue } from '../generated/graphql/types'
import ApolloClient from 'apollo-client'
import { RepositoryEntity, OrganizationEntity } from '../user-store'

const ISSUES_QUERY = gql`
  query repository($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      id
      issues(first: 100, after: $after, states: [OPEN]) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          state
          createdAt
          updatedAt
          author {
            login
            avatarUrl
          }
          labels(first: 100) {
            nodes {
              id
              name
              color
            }
          }
          assignees(first: 100) {
            nodes {
              id
              login
              name
              avatarUrl
            }
          }
          comments(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`

export const queryRepositoryIssues = async ({
  githubClient,
  organization,
  repository,
}: {
  githubClient: ApolloClient<any>
  organization: OrganizationEntity
  repository: RepositoryEntity
}): Promise<any[]> => {
  let pageInfo = { hasNextPage: true, endCursor: null }
  let issues: Issue[] = []
  let counter = 0

  while (pageInfo.hasNextPage) {
    console.log('Query issues', organization.login, repository.name, 'page', counter)
    counter += 1

    let { errors, data } = await githubClient.query({
      query: ISSUES_QUERY,
      variables: {
        owner: organization.login,
        name: repository.name,
        after: pageInfo.endCursor,
      },
    })

    if (errors) {
      throw errors
    }

    if (data) {
      issues.push(...data.repository.issues.nodes)
    }

    pageInfo = data.repository.issues.pageInfo
  }

  return issues
}
