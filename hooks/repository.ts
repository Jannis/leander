import { Organization, Repository } from '../utils/types'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'

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
  organization: Organization,
  names: string[],
): Repository[] => {
  let { loading, error, data } = useQuery(REPOSITORIES_QUERY, {
    variables: { owner: organization.login, names },
    pollInterval: 1000 * 30,
  })

  if (data) {
    data = data.repositories
  }

  if (loading) {
    throw new Promise((resolve, reject) => {
      if (data) {
        resolve(data)
      } else if (error) {
        reject(error)
      }
    })
  }

  if (error) {
    throw error
  }

  return data
}
