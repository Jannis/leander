import { GroupedView } from '../../utils/config'
import { useConfig } from '../../hooks/config'
import { useOrganization } from '../../hooks/organization'
import { Issue, Organization, Repository } from '../../utils/types'
import IssueTable from '../issue-table'
import { useState } from 'react'

const searchjs = require('searchjs')

const deepGet = (x: any, path: string[]) => {
  if (path.length === 0) {
    return x
  }

  let [key, ...rest] = path

  if (key === '[]') {
    if (Array.isArray(x)) {
      return x.map(y => deepGet(y, rest))
    } else {
      return null
    }
  } else {
    if (typeof x === 'object') {
      return deepGet(x[key], rest)
    } else {
      return null
    }
  }
}

interface TabProps {
  title: string
  active: boolean
  activate: () => void
}

const Tab: React.FunctionComponent<TabProps> = ({ title, active, activate }) => (
  <a
    onClick={() => activate()}
    className={`py-4 mr-4 capitalize cursor-pointer hover:text-indigo-500 ${
      active ? 'border-b-4 border-indigo-500' : ''
    }`}
  >
    {title}
  </a>
)

interface Props {
  view: GroupedView
  issues: Issue[]
}

const View: React.FunctionComponent<Props> = ({ view, issues }) => {
  let matches = searchjs.matchArray(issues, view.filter || {})

  // Group issues
  let groupedMatches = matches.reduce((acc, issue) => {
    let groupKey = deepGet(issue, view.groupBy.split('.'))
    if (Array.isArray(groupKey)) {
      return groupKey.reduce((acc, key) => {
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(issue)
        return acc
      }, acc)
    } else {
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(issue)
      return acc
    }
  }, {})

  let sortedKeys = Object.keys(groupedMatches).sort()
  let [tab, setTab] = useState(0)

  return (
    <div>
      <div className="inline-flex">
        {sortedKeys.map((key, index) => (
          <Tab
            key={`${key}-${index}`}
            title={key}
            active={index === tab}
            activate={() => setTab(index)}
          ></Tab>
        ))}
      </div>
      {sortedKeys.map((key, index) => (
        <div
          key={`${key}-${index}`}
          style={{ display: index === tab ? 'block' : 'none' }}
        >
          <IssueTable
            pageSize={view.pageSize}
            columns={view.columns}
            issues={groupedMatches[sortedKeys[tab]]}
          />
        </div>
      ))}
    </div>
  )
}

export default View
