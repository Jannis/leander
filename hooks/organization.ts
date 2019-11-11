import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { User, Organization } from '../utils/types'

const ORGANIZATION_QUERY = gql`
  query organization($login: String!) {
    organization(login: $login) {
      login
      name
      members {
        id
        login
        name
        avatarUrl
      }
    }
  }
`

export const useOrganization = (name: string): Organization => {
  let { loading, error, data } = useQuery(ORGANIZATION_QUERY, {
    variables: { login: name },
    pollInterval: 1000 * 60,
  })

  if (data) {
    data = data.organization
    data.members.sort((a: User, b: User) => a.login.localeCompare(b.login))
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
