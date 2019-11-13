import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { User } from '../utils/types'

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

export const useUser = (): User => {
  let { loading, error, data } = useQuery(USER_QUERY, {
    pollInterval: 1000 * 60,
  })

  if (data) {
    data = data.user
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
