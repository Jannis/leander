import { Issue, Organization, User, Repository, Label } from '../utils/types'
import moment from 'moment'
import { useQuery, useMutation, MutationTuple } from '@apollo/react-hooks'
import { useEffect, useState } from 'react'
import gql from 'graphql-tag'
import { useAsync, AsyncState } from 'react-async'
import ApolloClient from 'apollo-client'

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
  organization: Organization,
  repositories: Repository[],
): Issue[] => {
  let { loading, error, data } = useQuery(ISSUES_QUERY, {
    variables: {
      owner: organization.login,
      repositories: repositories.map(repo => repo.name),
    },
    // TODO: pollInterval: 1000 * 30,
    // The problem is that it causes the table to jump back to the first page
  })

  if (data) {
    data = data.issues
  }

  if (loading) {
    throw new Promise((resolve, reject) => {
      if (data) {
        resolve(data)
      } else if (error) {
        reject(error)
      }
    })
  }

  if (error) {
    throw error
  }

  return data
}
