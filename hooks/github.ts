import { useQuery } from 'react-query'
import { GraphQLClient } from 'graphql-request'
import { useRouter } from 'next/router'

export const useGitHubAccessToken = () => {
  let { query } = useRouter()

  let result = useQuery(
    'github-access-token',
    async () => {
      let result = await fetch('/auth/github/access-token')
      try {
        let data = await result.json()
        return data.accessToken
      } catch (e) {
        return undefined
      }
    },
    {
      refetchInterval: false,
    },
  )

  if (!result.data) {
    if (query.config) {
      window.location.href = `/auth/github/?config=${query.config}`
    } else {
      window.location.href = '/auth/github'
    }
  }

  return result
}

export const queryGitHub = ({
  query,
  variables,
  accessToken,
}: {
  query: string
  variables: { [key: string]: any }
  accessToken: string
}) => {
  const client = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return client.request(query, variables)
}
