import ApolloClient from 'apollo-client'
import gql from 'graphql-tag'
import {
  Organization,
  Repository,
  Issue,
  User,
  Label,
  IssueStatus,
  IssueSeverity,
  IssueSource,
  IssuePriority,
} from './generated/graphql/types'
import { queryRepositoryIssues } from './graphql/issues'
import moment = require('moment')

export type UserEntity = User
export type OrganizationEntity = Omit<Organization, 'members' | 'repositories'> & {
  members: string[]
}
export type RepositoryEntity = Omit<Repository, 'organization' | 'issues'> & {
  organization: string
}
export type IssueEntity = Omit<Issue, 'repository' | 'assignees'> & {
  assignees: string[]
}

const USER_QUERY = gql`
  query user($login: String!) {
    user(login: $login) {
      id
      login
      name
      avatarUrl
    }
  }
`

const VIEWER_QUERY = gql`
  {
    viewer {
      id
      login
      name
      avatarUrl
    }
  }
`

const ORGANIZATION_QUERY = gql`
  query organization($login: String!) {
    organization(login: $login) {
      id
      login
      name
      membersWithRole(first: 100) {
        nodes {
          id
          login
          name
          avatarUrl
        }
      }
    }
  }
`

const REPOSITORY_QUERY = gql`
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
`

export const parseUser = (node: any): UserEntity => ({
  id: node.id,
  login: node.login,
  name: node.name || undefined,
  avatarUrl: node.avatarUrl,
})

export const parseOrganization = (
  node: any,
): { organization: OrganizationEntity; users: UserEntity[] } => {
  let members = node.membersWithRole.nodes.map(parseUser)

  let organization = {
    id: node.id,
    login: node.login,
    name: node.name,
    members: members.map(member => member.login),
  }

  return { organization, users: members }
}

export const parseRepository = ({
  node,
  organization,
}: {
  node: any
  organization: OrganizationEntity
}): RepositoryEntity => ({
  id: node.id,
  name: node.name,
  labels: node.labels.nodes,
  organization: organization.login,
})

const hasLabel = (labels: Label[], name: string) =>
  labels.find(label => label.name === name) !== undefined

const matchingLabel = (labels: Label[], prefix: RegExp) =>
  labels.find(label => label.name.match(prefix))

const matchingLabels = (labels: Label[], prefix: RegExp) =>
  labels.filter(label => label.name.match(prefix))

const parseSeverity = (labels: Label[]) =>
  hasLabel(labels, 'bug')
    ? IssueSeverity.Bug
    : hasLabel(labels, 'enhancement')
    ? IssueSeverity.Feature
    : null

const parseSource = (members: User[], author: User) =>
  members.find(member => author.login === member.login)
    ? IssueSource.Internal
    : IssueSource.External

const parseSize = (labels: Label[]) => {
  let prefix = /^size\//
  let label = matchingLabel(labels, prefix)
  if (label) {
    try {
      return parseInt(label.name.replace(prefix, ''))
    } catch {
      return null
    }
  } else {
    return null
  }
}

const parseStage = (labels: Label[]) => {
  let prefix = /^stage\//
  let label = matchingLabel(labels, prefix)
  if (label) {
    try {
      return label.name.replace(prefix, '')
    } catch {
      return null
    }
  } else {
    return null
  }
}

const parsePriority = (labels: Label[]) =>
  hasLabel(labels, 'p0')
    ? IssuePriority.P0
    : hasLabel(labels, 'p1')
    ? IssuePriority.P1
    : hasLabel(labels, 'p2')
    ? IssuePriority.P2
    : hasLabel(labels, 'p3')
    ? IssuePriority.P3
    : null

const parseProjects = (labels: Label[]) => matchingLabels(labels, /^projects?\//)

export const parseIssue = ({
  node,
  organizationMembers,
  repository,
}: {
  node: any
  organizationMembers: UserEntity[]
  repository: RepositoryEntity
}): { issue: IssueEntity; users: UserEntity[] } => {
  let author: User = parseUser(node.author)
  let assignees: User[] = node.assignees.nodes.map(parseUser)
  let labels = node.labels.nodes

  let issue = {
    id: node.id,
    number: node.number,
    title: node.title,
    age: moment()
      .diff(moment(node.createdAt))
      .toString(),
    updated: moment()
      .diff(moment(node.updatedAt))
      .toString(),
    status: node.state === 'CLOSED' ? IssueStatus.Closed : IssueStatus.Open,
    assigned: assignees.length > 0,
    assignees: assignees.map(assignee => assignee.login),
    activity: node.comments.totalCount,
    triaged: labels.length > 0,
    labels,
    severity: parseSeverity(labels),
    priority: parsePriority(labels),
    source: parseSource(organizationMembers, author),
    phase: parseStage(labels),
    projects: parseProjects(labels),
    size: parseSize(labels),
  }

  // Don't include the author as authors don't have an ID
  return { issue, users: assignees }
}

const parseUserFromWebhook = (node: any) => ({
  id: node.node_id,
  login: node.login,
  name: node.name || undefined,
  avatarUrl: node.avatar_url,
})

const parseLabelFromWebhook = (label: any) => ({
  id: label.node_id,
  name: label.name,
  color: label.color,
})

export const parseIssueFromWebhook = ({
  data,
  organizationMembers,
  repository,
}: {
  data: any
  organizationMembers: UserEntity[]
  repository: RepositoryEntity
}): { issue: IssueEntity; users: UserEntity[] } => {
  let author: User = parseUserFromWebhook(data.user)
  let assignees: User[] = data.assignees.map(parseUserFromWebhook)
  let labels = data.labels.map(parseLabelFromWebhook)

  let issue = {
    id: data.node_id,
    number: data.number,
    title: data.title,
    age: moment()
      .diff(moment(data.created_at))
      .toString(),
    updated: moment()
      .diff(moment(data.updated_at))
      .toString(),
    status: data.state === 'closed' ? IssueStatus.Closed : IssueStatus.Open,
    assigned: assignees.length > 0,
    assignees: assignees.map(assignee => assignee.login),
    activity: data.comments,
    triaged: labels.length > 0,
    labels,
    severity: parseSeverity(labels),
    priority: parsePriority(labels),
    source: parseSource(organizationMembers, author),
    phase: parseStage(labels),
    projects: parseProjects(labels),
    size: parseSize(labels),
  }

  // Don't include the author because in webhooks they don't include their name
  return { issue, users: assignees }
}

export class UserStore {
  viewer: User | undefined
  users: Map<string, UserEntity>
  organizations: Map<string, OrganizationEntity>
  repositories: Map<string, RepositoryEntity>
  issues: Map<string, IssueEntity[]>
  githubClient: ApolloClient<any>

  constructor(githubClient: ApolloClient<any>) {
    this.githubClient = githubClient
    this.users = new Map()
    this.organizations = new Map()
    this.repositories = new Map()
    this.issues = new Map()
  }

  static repositoryKey(owner: string, name: string) {
    return `${owner}:${name}`
  }

  async getUser(login: string): Promise<UserEntity> {
    if (!this.users.has(login)) {
      let { errors, data } = await this.githubClient.query({
        query: USER_QUERY,
        variables: { login },
      })
      if (errors) {
        throw errors
      }
      this.users.set(login, parseUser(data.user))
    }
    return this.users.get(login)
  }

  async getViewer(): Promise<UserEntity> {
    if (!this.viewer) {
      let { errors, data } = await this.githubClient.query({ query: VIEWER_QUERY })
      if (errors) {
        throw errors
      }
      this.viewer = parseUser(data.viewer)
    }
    return this.viewer
  }

  async getOrganization(login: string): Promise<OrganizationEntity> {
    if (!this.organizations.has(login)) {
      let { errors, data } = await this.githubClient.query({
        query: ORGANIZATION_QUERY,
        variables: { login },
      })
      if (errors) {
        throw errors
      }
      let { organization, users } = parseOrganization(data.organization)
      for (let user of users) {
        this.updateOrAddUser(user)
      }
      this.organizations.set(login, organization)
    }
    return this.organizations.get(login)
  }

  async getRepository(
    organization: OrganizationEntity,
    name: string,
  ): Promise<RepositoryEntity> {
    let key = UserStore.repositoryKey(organization.login, name)

    if (!this.repositories.has(key)) {
      let { errors, data } = await this.githubClient.query({
        query: REPOSITORY_QUERY,
        variables: { owner: organization.login, name },
      })
      if (errors) {
        throw errors
      }
      let repository = parseRepository({ node: data.repository, organization })
      this.repositories.set(key, repository)
    }

    return this.repositories.get(key)
  }

  async getIssues(repository: RepositoryEntity) {
    let organization = await this.getOrganization(repository.organization)
    let organizationMembers = await Promise.all(
      organization.members.map(async login => await this.getUser(login)),
    )

    let key = UserStore.repositoryKey(organization.login, repository.name)

    if (!this.issues.has(key)) {
      let issueNodes = await queryRepositoryIssues({
        organization,
        repository,
        githubClient: this.githubClient,
      })

      let issues = []
      for (let node of issueNodes) {
        let { issue, users } = parseIssue({ node, organizationMembers, repository })

        // Save all users
        for (let user of users) {
          await this.updateOrAddUser(user)
        }

        issues.push(issue)
      }

      // Save all issues
      this.issues.set(key, issues)
    }

    // Inject the repository into the issues
    return this.issues.get(key)
  }

  async updateOrAddUser(user: UserEntity) {
    if (this.users.has(user.login)) {
      let existing = this.users.get(user.login)
      this.users.set(user.login, { ...existing, ...user })
    } else {
      this.users.set(user.login, user)
    }
  }

  async removeOrganization(organizationLogin: string) {
    // Drop organization from the store
    this.organizations.delete(organizationLogin)

    // Collect repositories for this organization
    let repositories = [...this.repositories].filter(kv => {
      let [_, repository] = kv
      return repository.organization === organizationLogin
    })

    // Delete these repositories
    for (let [key, repository] of repositories) {
      // Delete the repository itself
      this.repositories.delete(key)

      // Delete issues from this repository
      let repositoryKey = UserStore.repositoryKey(organizationLogin, repository.name)
      this.issues.delete(repositoryKey)
    }
  }

  async renameOrganization(organizationId: string, newLogin: string) {
    // Find the organization in the store
    let result = [...this.organizations].find(kv => {
      let [key, org] = kv
      return org.id === organizationId
    })

    if (result === undefined) {
      console.warn(`Organization to be renamed (${organizationId}) not found`)
    }

    let [key, _] = result

    // Remove the organization
    this.organizations.delete(key)

    // Fetch the renamed organization
    let _organization = this.getOrganization(newLogin)

    // Update all matching repositorie to point to the new organization
    for (let repo of this.repositories.values()) {
      repo.organization = newLogin
    }
  }

  async addMember(organizationLogin: string, userLogin: string) {
    // Make sure we have the new member
    let user = await this.getUser(userLogin)

    // Add them to the organization (if they aren't already a member)
    let organization = this.organizations.get(organizationLogin)
    if (organization.members.find(member => member === user.login) === undefined) {
      organization.members = [...organization.members, user.login]
    }
  }

  async removeMember(organizationLogin: string, userLogin: string) {
    let organization = this.organizations.get(organizationLogin)
    organization.members = organization.members.filter(member => member !== userLogin)
  }

  async removeLabel(organizationLogin: string, repositoryName: string, data: any) {
    let organization = await this.getOrganization(organizationLogin)
    let repository = await this.getRepository(organization, repositoryName)
    repository.labels = repository.labels.filter(
      existingLabel => existingLabel.id !== data.node_id,
    )
  }

  async updateOrAddLabel(organizationLogin: string, repositoryName: string, data: any) {
    let organization = await this.getOrganization(organizationLogin)
    let repository = await this.getRepository(organization, repositoryName)
    repository.labels = repository.labels.map(existingLabel =>
      existingLabel.id === data.node_id
        ? { ...existingLabel, ...parseLabelFromWebhook(data) }
        : existingLabel,
    )
  }

  async removeIssue(organizationLogin: string, repositoryName: string, data: any) {
    let key = UserStore.repositoryKey(organizationLogin, repositoryName)
    let issues = this.issues.get(key)
    this.issues.set(
      key,
      issues.filter(existingIssue => existingIssue.id !== data.node_id),
    )
  }

  async updateOrAddIssue(organizationLogin: string, repositoryName: string, data: any) {
    let organization = await this.getOrganization(organizationLogin)
    let organizationMembers = await Promise.all(
      organization.members.map(async login => await this.getUser(login)),
    )
    let repository = await this.getRepository(organization, repositoryName)
    let key = UserStore.repositoryKey(organizationLogin, repositoryName)
    let issues = this.issues.get(key)
    let existingIssue = issues.find(existingIssue => existingIssue.id === data.node_id)

    // Parse incoming issue data
    let { issue, users } = parseIssueFromWebhook({
      data,
      organizationMembers,
      repository,
    })

    // Update the users involved in the issue
    for (let user of users) {
      await this.updateOrAddUser(user)
    }

    if (existingIssue !== undefined) {
      // Merge data into the existing issue
      let updatedIssue = { ...existingIssue, ...issue }

      // Replace the existing issue
      this.issues.set(
        key,
        issues.map(issue => (issue.id === updatedIssue.id ? updatedIssue : issue)),
      )
    } else {
      issues.push(issue)
    }
  }
}
