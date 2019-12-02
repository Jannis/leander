import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { QueryResult } from '@apollo/react-common'
import { User } from 'leander-server'

const USER_QUERY = gql`
  {
    user {
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
