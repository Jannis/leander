import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { User } from '../utils/types'
import { QueryResult } from '@apollo/react-common'

const USER_QUERY = gql`
  {
    user: viewer {
      id
      login
      name
      avatarUrl
    }
  }
`

export const useUser = (): QueryResult<{ user: User }> =>
  useQuery(USER_QUERY, {
    fetchPolicy: 'no-cache',
  })
