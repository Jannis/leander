import { Organization, Repository } from '../utils/types'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { QueryResult } from '@apollo/react-common'

const REPOSITORIES_QUERY = gql`
  query repositories($owner: String!, $names: [String!]!) {
    repositories(owner: $owner, names: $names) {
      id
      name
      labels {
        id
        name
        color
      }
    }
  }
`

export const useRepositories = (
  {
    organization,
    names,
  }: {
    organization: Organization
    names: string[]
  },
  { skip }: { skip: boolean },
): QueryResult<{ repositories: Repository[] }> =>
  useQuery(REPOSITORIES_QUERY, {
    variables: { owner: organization && organization.login, names },
    pollInterval: 1000 * 30,
    skip,
  })
