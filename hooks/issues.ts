import { useQuery } from 'react-query'
import { useGitHubQuery } from './github'
import { Issue, Organization, User } from '../utils/types'
import moment from 'moment'

const parseSeverity = (labels: any): Issue['stats']['severity'] =>
  labels.find(label => label.name === 'bug')
    ? 'bug'
    : labels.find(label => label.name === 'feature' || label.name === 'enhancement')
    ? 'feature'
    : 'unknown'

const parseSource = (organization: Organization, assignees: User[]) =>
  assignees.find(assignee =>
    organization.members.find(member => assignee.login === member.login),
  )
    ? 'internal'
    : 'external'

const parseUser = (node: any): User => ({
  login: node.login,
  name: node.name || undefined,
  avatarUrl: node.avatarUrl,
})

const parseIssue = (
  organization: Organization,
  repositoryName: string,
  node: any,
): Partial<Issue> => ({
  id: node.id,
  number: node.number,
  title: node.title,
  repositoryName: repositoryName,
  stats: {
    age: moment.duration(moment().diff(moment(node.createdAt))),
    updated: moment.duration(moment().diff(moment(node.updatedAt))),
    status: node.state === 'CLOSED' ? 'closed' : 'open',
    severity: parseSeverity(node.labels.nodes),
    source: parseSource(organization, node.assignees.nodes),
    assigned: node.assignees.nodes.length > 0,
    assignees: node.assignees.nodes.map(parseUser),
    activity: node.comments.totalCount,
    triaged: node.labels.nodes.length > 0 && node.projectCards.nodes.length > 0,
    phase:
      node.projectCards.nodes.length > 0
        ? node.projectCards.nodes[0].column.name
        : undefined,
    labels: node.labels.nodes,
  },
})

export const useIssues = (
  organization: Organization,
  name: string,
): { data: Issue[] } => {
  // TODO: Fetch all issues

  let result = useGitHubQuery(
    `query repository($owner: String!, $name: String!) {
       repository(owner: $owner, name: $name) {
         issues(first: 100) {
           nodes {
             id
             number
             title
             state
             createdAt
             updatedAt
             author {
               login
               avatarUrl
             }
             labels(first: 100) {
               nodes {
                 name
                 color
               }
             }
             assignees(first: 100) {
               nodes {
                 login
                 name
                 avatarUrl
               }
             }
             comments(first: 1) {
               totalCount
             }
             projectCards(first: 1) {
              nodes {
                column {
                  name
                }
              }
            }
           }
         }
       }
     }`,
    { owner: organization.login, name },
  )

  if (result.data) {
    result.data = result.data.repository.issues.nodes.map(node =>
      parseIssue(organization, name, node),
    )
  }

  return result
}
