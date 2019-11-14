const gql = require('graphql-tag')
const moment = require('moment')
const {
  helpers: { queryOrganization },
} = require('./organization')
const { GraphQLError } = require('graphql')

const parseSeverity = labels =>
  labels.find(label => label.name === 'bug')
    ? 'bug'
    : labels.find(label => label.name === 'enhancement')
    ? 'feature'
    : null

const parseSource = (organization, assignees) =>
  assignees.find(assignee =>
    organization.members.find(member => assignee.login === member.login),
  )
    ? 'internal'
    : 'external'

const parseSize = labels => {
  let label = labels.find(label => label.name.match(/^size\//))
  try {
    return parseInt(label.name.replace(/^size\//, ''))
  } catch (e) {
    return undefined
  }
}

const parseUser = node => ({
  id: node.id,
  login: node.login,
  name: node.name || undefined,
  avatarUrl: node.avatarUrl,
})

const parsePriority = labels =>
  labels.find(label => label.name === 'p0')
    ? 'p0'
    : labels.find(label => label.name === 'p1')
    ? 'p1'
    : labels.find(label => label.name === 'p2')
    ? 'p2'
    : labels.find(label => label.name === 'p3')
    ? 'p3'
    : null

const parseProjects = labels => labels.filter(label => label.name.match(/^projects?\//))

const parseIssue = (node, organization, repository) => ({
  id: node.id,
  repository: repository,
  number: node.number,
  title: node.title,
  stats: {
    age: moment()
      .diff(moment(node.createdAt))
      .toString(),
    updated: moment()
      .diff(moment(node.updatedAt))
      .toString(),
    status: node.state === 'CLOSED' ? 'closed' : 'open',
    severity: parseSeverity(node.labels.nodes),
    priority: parsePriority(node.labels.nodes),
    source: parseSource(organization, node.assignees.nodes),
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

const REPOSITORY_ISSUES_QUERY = gql`
  query repository($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      id
      issues(first: 100, after: $after, states: [OPEN]) {
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
              id
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
              id
              column {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`

const queryIssues = async (githubClient, organization, repository) => {
  let pageInfo = { hasNextPage: true, endCursor: null }
  let issues = []
  let counter = 0

  while (pageInfo.hasNextPage) {
    console.log('Query issues', organization.login, repository, 'page', counter)
    counter += 1

    let { errors, data } = await githubClient.query({
      query: REPOSITORY_ISSUES_QUERY,
      variables: {
        owner: organization.login,
        name: repository,
        after: pageInfo.endCursor,
      },
      fetchPolicy: 'no-cache',
    })

    if (errors) {
      throw new GraphQLError(errors)
    }

    if (data) {
      issues.push(...data.repository.issues.nodes)
    }

    pageInfo = data.repository.issues.pageInfo
  }

  return issues.map(issue => parseIssue(issue, organization, repository))
}

const UPDATE_LABELS_MUTATION = gql`
  mutation updateLabels($labelable: ID!, $labelsToAdd: [ID!]!, $labelsToRemove: [ID!]!) {
    removeLabelsFromLabelable(
      input: { labelableId: $labelable, labelIds: $labelsToRemove }
    ) {
      clientMutationId
    }

    addLabelsToLabelable(input: { labelableId: $labelable, labelIds: $labelsToAdd }) {
      labelable {
        labels(first: 100) {
          nodes {
            id
            name
            color
          }
        }
      }
    }
  }
`

const UPDATE_ASSIGNEES_MUTATION = gql`
  mutation updateAssignees(
    $assignable: ID!
    $assigneesToAdd: [ID!]!
    $assigneesToRemove: [ID!]!
  ) {
    removeAssigneesFromAssignable(
      input: { assignableId: $assignable, assigneeIds: $assigneesToRemove }
    ) {
      clientMutationId
    }

    addAssigneesToAssignable(
      input: { assignableId: $assignable, assigneeIds: $assigneesToAdd }
    ) {
      assignable {
        assignees(first: 100) {
          nodes {
            id
            name
            login
            avatarUrl
          }
        }
      }
    }
  }
`

module.exports = {
  resolvers: {
    issues: async (parent, { owner, repositories }, { githubClient }) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }

      let organization = await queryOrganization(githubClient, owner)
      let issuesByRepository = await Promise.all(
        repositories.map(repository =>
          queryIssues(githubClient, organization, repository),
        ),
      )
      return issuesByRepository.reduce((acc, issues) => acc.concat(issues), [])
    },
  },
  mutations: {
    updateIssueLabels: async (
      parent,
      { issue, labelsToAdd, labelsToRemove },
      { githubClient },
    ) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }

      let { errors, data } = await githubClient.mutate({
        mutation: UPDATE_LABELS_MUTATION,
        variables: {
          labelable: issue,
          labelsToAdd,
          labelsToRemove,
        },
      })

      if (errors) {
        throw new GraphQLError(errors)
      }

      if (data) {
        let labels = data.addLabelsToLabelable.labelable.labels.nodes
        let result = {
          id: issue,
          stats: {
            severity: parseSeverity(labels),
            priority: parsePriority(labels),
            projects: parseProjects(labels),
            labels: labels,
          },
        }
        return result
      } else {
        return null
      }
    },

    updateAssignees: async (
      parent,
      { issue, assigneesToAdd, assigneesToRemove },
      { githubClient },
    ) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }

      let { errors, data } = await githubClient.mutate({
        mutation: UPDATE_ASSIGNEES_MUTATION,
        variables: {
          assignable: issue,
          assigneesToAdd,
          assigneesToRemove,
        },
      })

      if (errors) {
        throw new GraphQLError(errors)
      }

      if (data) {
        let assignees = data.addAssigneesToAssignable.assignable.assignees.nodes
        let result = {
          id: issue,
          stats: {
            assigned: assignees.length > 0,
            assignees: assignees.map(parseUser),
          },
        }
        console.log('RESULT:', result)
        return result
      } else {
        return null
      }
    },
  },
}
