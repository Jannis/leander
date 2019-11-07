import { Duration } from 'moment'

export interface User {
  login: string
  name?: string
  avatarUrl: string
}

export interface Organization {
  login: string
  name: string
  members: User[]
}

export interface Label {
  name: string
  color: string
}

export interface IssueStats {
  age: Duration
  updated: Duration
  status: 'open' | 'closed'
  severity: 'bug' | 'feature' | 'unknown'
  source: 'internal' | 'external'
  assigned: boolean
  assignees: User[]
  activity: number
  triaged: boolean
  phase?: string
  labels: Label[]
}

export interface Issue {
  id: string
  repositoryName: string
  number: number
  title: string
  stats: IssueStats
}
