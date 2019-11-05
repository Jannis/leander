import { useQuery } from 'react-query'
import { GraphQLClient } from 'graphql-request'

export const useGitHubAccessToken = () => {
  let result = useQuery('github-access-token', async () => {
    let result = await fetch('/auth/github/access-token')
    try {
      let data = await result.json()
      return data.accessToken
    } catch (e) {
      return undefined
    }
  })

  if (!result.data) {
    window.location.href = '/auth/github'
  }

  return result
}

export const useGitHubQuery = (query: string, variables: { [key: string]: any }) => {
  const { data: accessToken } = useGitHubAccessToken()

  return useQuery(
    ['github-graphql', { query, variables }],
    async ({ query, variables }) => {
      const client = new GraphQLClient('https://api.github.com/graphql', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return client.request(query, variables)
    },
  )
}
