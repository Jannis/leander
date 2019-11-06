import { useQuery } from 'react-query'
import { useGitHubQuery } from './github'

export const useIssues = (owner: string, name: string) => {
  // TODO: Fetch all issues

  let result = useGitHubQuery(
    `query repository($owner: String!, $name: String!) {
       repository(owner: $owner, name: $name) {
         issues(first: 100) {
           nodes {
             number
             title
           }
         }
       }
     }`,
    { owner, name },
  )

  if (result.data) {
    result.data = result.data.repository.issues.nodes
  }

  return result
}
