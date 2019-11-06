import { useQuery } from 'react-query'
import { useGitHubQuery } from './github'

export const useOrganization = (name: string) => {
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
    result.data = result.data.organization
  }

  return result
}
