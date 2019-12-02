import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { QueryResult } from '@apollo/react-common'
import { Config } from '../utils/config'
import { Organization } from 'leander-server'

const DATA_QUERY = gql`
  query data($organization: String!, $repositories: [String!]!) {
    organization(login: $organization) {
      id
      login
      name
      members {
        id
        login
        name
        avatarUrl
      }
      repositories(names: $repositories) {
        id
        name
        labels {
          id
          name
          color
        }
        organization {
          id
          login
          name
          members {
            id
            login
            name
            avatarUrl
          }
        }
        issues {
          id
          number
          title
          age
          updated
          status
          severity
          priority
          source
          assigned
          assignees {
            id
            login
            name
            avatarUrl
          }
          activity
          triaged
          stage
          labels {
            id
            name
            color
          }
          projects {
            id
            name
            color
          }
          size
        }
      }
    }
  }
`

export const useData = (config: Config): QueryResult<{ organization: Organization }> =>
  useQuery(DATA_QUERY, {
    variables: { organization: config.organization, repositories: config.repositories },
    pollInterval: 1000 * 10,
  })
