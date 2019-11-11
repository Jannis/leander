import { Duration } from 'moment'

export interface User {
  id: string
  login: string
  name?: string
  avatarUrl: string
}

export interface Repository {
  id: string
  organization: Organization
  name: string
  labels: Label[]
}

export interface Organization {
  login: string
  name: string
  members: User[]
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface IssueStats {
  age: Duration
  updated: Duration
  status: 'open' | 'closed'
  severity?: 'bug' | 'feature'
  priority?: 'p0' | 'p1' | 'p2' | 'p3'
  source: 'internal' | 'external'
  assigned: boolean
  assignees: User[]
  activity: number
  triaged: boolean
  phase?: string
  labels: Label[]
  projects: Label[]
  size?: number
}

export interface Issue {
  id: string
  repository: Repository
  number: number
  title: string
  stats: IssueStats
}
