import { Issue, Organization, User, Repository, Label } from '../utils/types'
import moment from 'moment'
import { useQuery, useMutation, MutationTuple } from '@apollo/react-hooks'
import { useEffect, useState } from 'react'
import gql from 'graphql-tag'
import { useAsync, AsyncState } from 'react-async'
import ApolloClient from 'apollo-client'
import { QueryResult } from '@apollo/react-common'

const ISSUES_QUERY = gql`
  query issues($owner: String!, $repositories: [String!]!) {
    issues(owner: $owner, repositories: $repositories) {
      id
      repository
      number
      title
      stats {
        age
        updated
        severity
        priority
        source
        assigned
        assignees {
          id
          login
          name
          avatarUrl
        }
        activity
        triaged
        phase
        labels {
          id
          name
          color
        }
        projects {
          id
          name
          color
        }
        size
      }
    }
  }
`

export const useIssues = (
  {
    organization,
    repositories,
  }: {
    organization: Organization
    repositories: Repository[]
  },
  { skip }: { skip: boolean },
): QueryResult<{ issues: Issue[] }> =>
  useQuery(ISSUES_QUERY, {
    variables: {
      owner: organization && organization.login,
      repositories: repositories && repositories.map(repo => repo.name),
    },
    skip,
    // TODO: pollInterval: 1000 * 30,
    // The problem is that it causes the table to jump back to the first page
  })
