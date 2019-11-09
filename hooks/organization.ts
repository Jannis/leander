import { useQuery } from 'react-query'
import { useGitHubAccessToken, queryGitHub } from './github'
import { User, Organization } from '../utils/types'

const parseOrganization = (node: any): Organization => ({
  login: node.login,
  name: node.name,
  members: node.membersWithRole.nodes.map((member: any) => ({
    login: member.login,
    name: member.name,
    avatarUrl: member.avatarUrl,
  })),
})

export const useOrganization = (name: string): { data: Organization } => {
  let { data: accessToken } = useGitHubAccessToken()

  return useQuery(
    ['organization', { name }],
    async ({ name }) => {
      let data = await queryGitHub({
        query: `
          query organization($login: String!) {
            organization(login: $login) {
              login
              name
              membersWithRole(first: 100) {
                nodes {
                  login
                  name
                  avatarUrl
                }
              }
            }
          }
        `,
        variables: { login: name },
        accessToken,
      })

      if (data) {
        data = parseOrganization(data.organization)
        data.members.sort((a: User, b: User) => a.login.localeCompare(b.login))
      }

      return data
    },
    { refetchInterval: 1000 * 120 },
  )
}
