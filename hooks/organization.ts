import { useQuery } from 'react-query'
import { useGitHubQuery } from './github'
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
  let result = useGitHubQuery(
    `query organization($login: String!) {
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
     }`,
    { login: name },
  )

  if (result.data) {
    result.data = parseOrganization(result.data.organization)
  }

  return result
}
