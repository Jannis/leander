import { GroupedView } from '../../utils/config'
import { Issue } from 'leander-server'
import IssueTable from '../issue-table'
import { useState } from 'react'
import { stripLabelPrefix } from '../../utils/labels'

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
    className={`py-4 mr-4 border-b-4 cursor-pointer text-black hover:text-pink-500 ${
      active ? 'border-pink-500' : 'border-white'
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

  let sortedKeys = [...Object.keys(groupedMatches)]
  sortedKeys.sort((a, b) => a.localeCompare(b))

  let [tab, setTab] = useState(0)

  return (
    <div>
      <div className="inline-flex">
        {sortedKeys.map((key, index) => (
          <Tab
            key={`${key}-${index}`}
            title={key === 'null' ? '-' : stripLabelPrefix(key)}
            active={index === tab}
            activate={() => setTab(index)}
          ></Tab>
        ))}
      </div>
      <div key={sortedKeys[tab]} style={{ display: 'block' }}>
        <IssueTable
          pageSize={view.pageSize}
          columns={view.columns}
          issues={groupedMatches[sortedKeys[tab]]}
        />
      </div>
    </div>
  )
}

export default View
