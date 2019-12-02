import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'
import { Issue } from 'leander-server'

const UPDATE_ISSUE_LABELS_MUTATION = gql`
  mutation updateIssueLabels($issue: ID!, $labelsToRemove: [ID!]!, $labelsToAdd: [ID!]!) {
    updateIssueLabels(
      issue: $issue
      labelsToRemove: $labelsToRemove
      labelsToAdd: $labelsToAdd
    ) {
      id
      severity
      priority
      projects {
        id
        name
        color
      }
      labels {
        id
        name
        color
      }
    }
  }
`

const UPDATE_ASSIGNEES_MUTATION = gql`
  mutation updateAssignees(
    $issue: ID!
    $assigneesToRemove: [ID!]!
    $assigneesToAdd: [ID!]!
  ) {
    updateAssignees(
      issue: $issue
      assigneesToRemove: $assigneesToRemove
      assigneesToAdd: $assigneesToAdd
    ) {
      id
      assigned
      assignees {
        id
        login
        name
        avatarUrl
      }
    }
  }
`

/**
 * Severity
 */

export interface SetSeverityOptions {
  issue: Issue
  severity: Issue['severity']
}

export const useSetSeverity = (): any => {
  let [updateIssueLabels, result] = useMutation(UPDATE_ISSUE_LABELS_MUTATION)

  let wrappedMutation = ({ issue, severity }: SetSeverityOptions) => {
    let labelNamesToRemove =
      severity === 'bug'
        ? ['enhancement']
        : severity === 'feature'
        ? ['bug']
        : ['bug', 'enhancement']

    let labelsToRemove = labelNamesToRemove
      .map(name => issue.repository.labels.find(label => label.name === name))
      .filter(label => label !== undefined)
      .map(label => label.id)

    let labelsToAdd = []

    let labelNameToAdd =
      severity === 'bug' ? 'bug' : severity === 'feature' ? 'enhancement' : undefined

    if (labelNameToAdd) {
      let labelToAdd = issue.repository.labels.find(
        label => label.name === labelNameToAdd,
      )
      if (labelToAdd) {
        labelsToAdd.push(labelToAdd.id)
      }
    }

    updateIssueLabels({ variables: { issue: issue.id, labelsToRemove, labelsToAdd } })
  }

  return [wrappedMutation, result]
}

/**
 * Priority
 */

export interface SetPriorityOptions {
  issue: Issue
  priority: Issue['priority']
}

export const useSetPriority = (): any => {
  let [updateIssueLabels, result] = useMutation(UPDATE_ISSUE_LABELS_MUTATION)

  let wrappedMutation = ({ issue, priority }: SetPriorityOptions) => {
    let priorities = ['p0', 'p1', 'p2', 'p3']
    let labelNamesToRemove =
      priority === null ? priorities : priorities.filter(p => p !== priority)

    let labelsToRemove = labelNamesToRemove
      .map(name => issue.repository.labels.find(label => label.name === name))
      .filter(label => label !== undefined)
      .map(label => label.id)

    let labelsToAdd = []

    if (priority) {
      let labelToAdd = issue.repository.labels.find(label => label.name === priority)
      if (labelToAdd) {
        labelsToAdd.push(labelToAdd.id)
      }
    }

    updateIssueLabels({ variables: { issue: issue.id, labelsToRemove, labelsToAdd } })
  }

  return [wrappedMutation, result]
}

/**
 * Projects
 */

export interface SetProjectsOptions {
  issue: Issue
  projects: string[]
}

export const useSetProjects = (): any => {
  let [updateIssueLabels, result] = useMutation(UPDATE_ISSUE_LABELS_MUTATION)

  let wrappedMutation = ({ issue, projects }: SetProjectsOptions) => {
    let labelsToRemove = projects.filter(id =>
      issue.projects.find(label => label.id === id),
    )
    let labelsToAdd = projects.filter(
      id => issue.projects.find(label => label.id === id) === undefined,
    )
    updateIssueLabels({ variables: { issue: issue.id, labelsToRemove, labelsToAdd } })
  }

  return [wrappedMutation, result]
}

/**
 * Assignees
 */

export interface SetAssigneesOptions {
  issue: Issue
  assignees: string[]
}

export const useSetAssignees = (): any => {
  let [updateAssignees, result] = useMutation(UPDATE_ASSIGNEES_MUTATION)

  let wrappedMutation = ({ issue, assignees }: SetAssigneesOptions) => {
    let assigneesToRemove = issue.assignees
      .filter(
        existingAssignee =>
          !assignees.find(newAssigneeId => newAssigneeId === existingAssignee.id),
      )
      .map(user => user.id)

    let assigneesToAdd = assignees.filter(
      newAssigneeId =>
        !issue.assignees.find(existingAssignee => existingAssignee.id === newAssigneeId),
    )
    updateAssignees({ variables: { issue: issue.id, assigneesToRemove, assigneesToAdd } })
  }

  return [wrappedMutation, result]
}
