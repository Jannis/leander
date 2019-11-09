import { useQuery } from 'react-query'
import { useGitHubAccessToken, queryGitHub } from './github'
import { Issue, Organization, User, Repository, Label } from '../utils/types'
import moment from 'moment'

const parseSeverity = (labels: any): Issue['stats']['severity'] =>
  labels.find(label => label.name === 'bug')
    ? 'bug'
    : labels.find(label => label.name === 'enhancement')
    ? 'feature'
    : 'unknown'

const parseSource = (repository: Repository, assignees: User[]) =>
  assignees.find(assignee =>
    repository.organization.members.find(member => assignee.login === member.login),
  )
    ? 'internal'
    : 'external'

const parseSize = (labels: any): Issue['stats']['size'] => {
  let label = labels.find(label => label.name.match(/^size\//))
  try {
    return parseInt(label.name.replace(/^size\//, ''))
  } catch (e) {
    return undefined
  }
}

const parseUser = (node: any): User => ({
  login: node.login,
  name: node.name || undefined,
  avatarUrl: node.avatarUrl,
})

const parsePriority = (labels: any[]) =>
  labels.find(label => label.name === 'p0')
    ? 'p0'
    : labels.find(label => label.name === 'p1')
    ? 'p1'
    : labels.find(label => label.name === 'p2')
    ? 'p2'
    : labels.find(label => label.name === 'p3')
    ? 'p3'
    : undefined

const parseProjects = (labels: any[]) =>
  labels
    .filter(label => label.name.match(/^projects?\//))
    .map(label => ({ ...label, name: label.name.replace(/^projects?\//, '') }))

const parseIssue = (node: any, repository: Repository): Issue => ({
  id: node.id,
  number: node.number,
  title: node.title,
  repository: repository,
  stats: {
    age: moment.duration(moment().diff(moment(node.createdAt))),
    updated: moment.duration(moment().diff(moment(node.updatedAt))),
    status: node.state === 'CLOSED' ? 'closed' : 'open',
    severity: parseSeverity(node.labels.nodes),
    priority: parsePriority(node.labels.nodes),
    source: parseSource(repository, node.assignees.nodes),
    assigned: node.assignees.nodes.length > 0,
    assignees: node.assignees.nodes.map(parseUser),
    activity: node.comments.totalCount,
    triaged: node.labels.nodes.length > 0 && node.projectCards.nodes.length > 0,
    phase:
      node.projectCards.nodes.length > 0 && node.projectCards.nodes[0].column
        ? node.projectCards.nodes[0].column.name
        : undefined,
    labels: node.labels.nodes,
    projects: parseProjects(node.labels.nodes),
    size: parseSize(node.labels.nodes),
  },
})

export const queryIssuesForRepository = async (
  repository: Repository,
  accessToken: string,
): Promise<Issue[]> => {
  let pageInfo = { hasNextPage: true, endCursor: null }
  let result = []
  let counter = 0

  while (pageInfo.hasNextPage) {
    console.log(repository.name, counter, pageInfo)
    counter += 1

    let data = await queryGitHub({
      query: `
        query repository($owner: String!, $name: String!, $after: String) {
          repository(owner: $owner, name: $name) {
            issues(first: 100, after: $after, states: OPEN) {
              pageInfo {
                hasNextPage
                endCursor
              }
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
                    id
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
        }
      `,
      variables: {
        owner: repository.organization.login,
        name: repository.name,
        after: pageInfo.endCursor,
      },
      accessToken,
    })

    if (data) {
      result.push(
        ...data.repository.issues.nodes.map((node: any) => parseIssue(node, repository)),
      )

      pageInfo = data.repository.issues.pageInfo
    }
  }

  return result
}

export const useIssuesForRepositories = (
  repositories: Repository[],
): { data: Issue[] } => {
  let { data: accessToken } = useGitHubAccessToken()

  return useQuery(
    ['issues-for-repositories', { repositories }],
    async ({ repositories }) => {
      let issuesPerRepo = await Promise.all(
        repositories.map(repository => queryIssuesForRepository(repository, accessToken)),
      )

      return issuesPerRepo.reduce(
        (acc: Issue[], issues: Issue[]) => acc.concat(issues),
        [],
      )
    },
    {
      refetchInterval: 1000 * 120,
    },
  )
}

const addIssueLabelsMutation = ({
  issue,
  labels,
}: {
  issue: Issue
  labels: Label[]
}): string =>
  `
  addLabelsToLabelable(
    input: { labelableId: "${issue.id}",
    labelIds: [${labels.map(label => `"${label.id}"`).join(', ')}] })
  {
    clientMutationId
  }
  `

const removeIssueLabelsMutation = ({
  issue,
  labels,
}: {
  issue: Issue
  labels: Label[]
}): string =>
  `
  removeLabelsFromLabelable(input: {
    labelableId: "${issue.id}",
    labelIds: [${labels.map(label => `"${label.id}"`).join(', ')}] })
  {
    clientMutationId
  }
  `

export const setIssueSeverity = async ({
  issue,
  severity,
  accessToken,
}: {
  issue: Issue
  severity: Issue['stats']['severity']
  accessToken: string
}) => {
  console.log('Set severity', issue.id, severity)

  let labelNamesToRemove =
    severity === 'bug'
      ? ['enhancement']
      : severity === 'feature'
      ? ['bug']
      : ['bug', 'enhancement']

  let labelsToRemove = labelNamesToRemove
    .map(name => issue.repository.labels.find(label => label.name === name))
    .filter(label => label !== undefined)

  let mutations = []
  mutations.push(removeIssueLabelsMutation({ issue, labels: labelsToRemove }))

  let labelNameToAdd =
    severity === 'bug' ? 'bug' : severity === 'feature' ? 'enhancement' : undefined

  if (labelNameToAdd) {
    let labelToAdd = issue.repository.labels.find(label => label.name === labelNameToAdd)
    if (labelToAdd) {
      mutations.push(addIssueLabelsMutation({ issue, labels: [labelToAdd] }))
    }
  }

  let query = `mutation { ${mutations.join('\n')}}`
  return await queryGitHub({ query, variables: {}, accessToken })
}
