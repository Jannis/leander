import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { User, Organization } from '../utils/types'
import { QueryResult } from '@apollo/react-common'

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

export const useOrganization = (
  { login }: { login: string },
  { skip }: { skip: boolean } = { skip: false },
): QueryResult<{ organization: Organization }> =>
  useQuery(ORGANIZATION_QUERY, {
    variables: { login },
    pollInterval: 1000 * 60,
    skip,
  })
