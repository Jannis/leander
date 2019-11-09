import { useQuery } from 'react-query'
import { queryGitHub, useGitHubAccessToken } from './github'
import { Organization, Repository } from '../utils/types'

const parseRepository = (node: any, organization: Organization): Repository => ({
  id: node.id,
  name: node.name,
  organization,
  labels: node.labels.nodes.map((label: any) => ({
    id: label.id,
    name: label.name,
    color: label.color,
  })),
})

export const queryRepository = async (
  organization: Organization,
  name: string,
  accessToken: string,
): Promise<Repository> => {
  let data = await queryGitHub({
    query: `
      query repository($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
          name
          labels(first: 100) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    `,
    variables: { owner: organization.login, name },
    accessToken,
  })

  return parseRepository(data.repository, organization)
}

export const useRepositories = (
  organization: Organization,
  names: string[],
): { data: Repository[] } => {
  let { data: accessToken } = useGitHubAccessToken()

  return useQuery(
    ['repositories', { organization, names }],
    async ({ organization, names }) =>
      await Promise.all(
        names.map(name => queryRepository(organization, name, accessToken)),
      ),
    {
      refetchInterval: 1000 * 120,
    },
  )
}
