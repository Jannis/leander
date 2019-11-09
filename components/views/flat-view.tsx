import { FlatView } from '../../utils/config'
import { Issue, Organization, Repository } from '../../utils/types'
import IssueTable from '../issue-table'

const searchjs = require('searchjs')

interface Props {
  view: FlatView
  issues: Issue[]
}

const View: React.FunctionComponent<Props> = ({ view, issues }) => {
  let matches = searchjs.matchArray(issues, view.filter || {})
  return <IssueTable pageSize={view.pageSize} columns={view.columns} issues={matches} />
}

export default View
