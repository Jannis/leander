import { Fragment, useState, useMemo } from 'react'
import { useTable, usePagination, useExpanded, useSortBy, Column } from 'react-table'
import { Icon, Avatar, Tag } from 'antd'
import moment from 'moment'
import { Issue } from 'leander-server'
import GitHubLink from './nav/github-link'
import IssueActions from './issue-actions'
import { stripLabelPrefix } from '../utils/labels'

const COLUMNS: { [key: string]: any } = {
  link: {
    Header: 'Issue',
    id: 'number',
    Cell: ({ row: { original: issue } }) => (
      <div className="truncate">
        <a
          className="text-black hover:text-pink-500"
          target="_blank"
          href={`https://github.com/${issue.repository.organization.login}/${issue.repository.name}/issues/${issue.number}`}
        >
          {issue.repository.name}#{issue.number}
        </a>
      </div>
    ),
    sortType: 'basic',
  },
  number: {
    Header: '#',
    accessor: 'number',
    sortType: 'basic',
  },
  title: {
    Header: 'Title',
    accessor: 'title',
    sortType: 'basic',
  },
  severity: {
    Header: 'Severity',
    accessor: 'severity',
    Cell: ({ row, cell: { value: severity } }) =>
      severity === 'bug' ? (
        <Icon type="bug" theme="twoTone" twoToneColor="red" />
      ) : severity === 'feature' ? (
        <Icon type="build" theme="twoTone" twoToneColor="limeGreen" />
      ) : (
        <Icon type="question-circle" theme="twoTone" twoToneColor="lightGray" />
      ),
    sortType: ({ original: a }, { original: b }) => {
      let aSeverity = a.severity
      let bSeverity = b.severity
      let severities = [null, 'feature', 'bug']
      return severities.indexOf(aSeverity) - severities.indexOf(bSeverity)
    },
  },
  age: {
    Header: 'Age',
    accessor: 'age',
    Cell: ({ cell: { value } }) => {
      let age = moment.duration(parseInt(value))
      return age.asDays() > 30 ? (
        <span color="red">{age.humanize()}</span>
      ) : (
        age.humanize()
      )
    },
    sortType: ({ original: a }, { original: b }) => {
      let aDuration = moment.duration(parseInt(a.age))
      let bDuration = moment.duration(parseInt(b.age))
      return aDuration.subtract(bDuration)
    },
  },
  updated: {
    Header: 'Updated',
    accessor: 'updated',
    Cell: ({ cell: { value } }) => {
      let updated = moment.duration(parseInt(value))
      return updated.asDays() > 7 ? (
        <span style={{ color: 'red' }}>{updated.humanize()}</span>
      ) : (
        updated.humanize()
      )
    },
    sortType: ({ original: a }, { original: b }) => {
      let aDuration = moment.duration(parseInt(a.updated))
      let bDuration = moment.duration(parseInt(b.updated))
      return aDuration.subtract(bDuration)
    },
  },
  assigned: {
    Header: 'Assigned',
    accessor: 'assigned',
    Cell: ({ row: { original: issue } }) =>
      issue.assignees.length > 0 ? (
        <div className="container flex-row align-center">
          {issue.assignees.map(assignee => (
            <Avatar
              key={assignee.login}
              src={assignee.avatarUrl}
              alt={assignee.name || assignee.login}
              size="small"
            />
          ))}
        </div>
      ) : (
        <Icon type="warning" theme="twoTone" twoToneColor="red" />
      ),
    sortType: 'basic',
  },
  phase: {
    Header: 'Phase',
    accessor: 'phase',
    sortType: 'basic',
  },
  source: {
    Header: 'Source',
    accessor: 'source',
    Cell: ({ cell: { value: source } }) => (source === 'internal' ? 'Team' : 'Community'),
    sortType: 'basic',
  },
  triaged: {
    Header: 'Triaged',
    accessor: 'triaged',
    Cell: ({ cell: { value: triaged } }) =>
      triaged ? (
        <Icon type="check-circle" theme="twoTone" twoToneColor="limeGreen" />
      ) : (
        <Icon type="warning" theme="twoTone" twoToneColor="red" />
      ),
    sortType: 'basic',
  },
  activity: {
    Header: 'Activity',
    accessor: 'activity',
    sortType: 'basic',
  },
  projects: {
    Header: 'Projects',
    accessor: 'projects',
    Cell: ({ cell: { value: projects } }) => (
      <>
        {projects.map(project => (
          <Tag key={project.id} style={{ borderColor: `#${project.color}` }}>
            {stripLabelPrefix(project.name)}
          </Tag>
        ))}
      </>
    ),
    sortType: 'basic',
  },
  priority: {
    Header: 'Priority',
    accessor: 'priority',
    Cell: ({ cell: { value: priority } }) => {
      let colors = {
        p0: 'red',
        p1: 'darkOrange',
        p2: 'purple',
        p3: 'darkGray',
        null: 'darkGrey',
      }

      return (
        <span style={{ fontWeight: 500, color: colors[priority] }}>
          {(priority || '').toUpperCase()}
        </span>
      )
    },
    sortType: ({ original: a }, { original: b }) => {
      let aPriority = a.priority
      let bPriority = b.priority
      let priorities = [null, 'p3', 'p2', 'p1', 'p0']
      return priorities.indexOf(aPriority) - priorities.indexOf(bPriority)
    },
  },
  size: {
    Header: 'Size',
    accessor: 'size',
    Cell: ({ cell: { value: size } }) => <span>{size === null ? '' : size}</span>,
    sortType: 'basci',
  },
}

interface TableProps {
  columns: Column[]
  issues: Issue[]
  pageSize: number
}

const Table: React.FunctionComponent<TableProps> = ({ columns, issues, pageSize }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    state: { pageIndex },
    page,
    pageCount,
    gotoPage,
  } = useTable(
    {
      columns,
      data: issues,
      disablePageResetOnDataChange: true,
      initialState: {
        pageSize,
        pageIndex: 0,
        sortBy: useMemo(
          () => [
            { id: 'priority', desc: true },
            { id: 'severity', desc: true },
            { id: 'updated', desc: true },
          ],
          [],
        ),
      },
    } as any,
    useExpanded,
    useSortBy,
    usePagination,
  ) as any

  return (
    <div className="w-full">
      <table
        {...getTableProps({ className: 'w-full border border-solid border-gray-200' })}
      >
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr key={`${index}`} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, index) => (
                <th
                  {...column.getHeaderProps(
                    column.getSortByToggleProps({
                      className: 'text-left font-medium p-2',
                    }),
                  )}
                >
                  <div className="flex flex-row items-center">
                    {column.render('Header')}
                    {column.isSorted ? (
                      column.isSortedDesc ? (
                        <Icon className="ml-1" type="caret-down" />
                      ) : (
                        <Icon className="ml-1" type="caret-up" />
                      )
                    ) : (
                      ''
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row)
            return (
              <Fragment key={`row-${i}`}>
                <tr
                  {...row.getRowProps({
                    className: 'border border-bottom border-gray-200',
                  })}
                  {...row.getExpandedToggleProps()}
                >
                  {row.cells.map(cell => {
                    return (
                      <td
                        {...cell.getCellProps({
                          className: 'p-2 truncate',
                          style: { maxWidth: '300px' },
                        })}
                      >
                        {cell.render('Cell')}
                      </td>
                    )
                  })}
                </tr>
                {row.isExpanded ? (
                  <tr key={`expanded-${i}`}>
                    <td colSpan={columns.length}>
                      <IssueActions issue={row.original} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      <div className="w-full text-right mt-2">
        <span>Pages:</span>
        <>
          {[...new Array(pageCount)].map((_, index) => (
            <a
              key={`page-${index}`}
              className={
                `ml-1 border inline-block w-8 text-center rounded ` +
                `text-gray-800 hover:text-gray-800 border-grey-100 ` +
                `hover:border-black cursor-pointer ${
                  index === pageIndex ? 'border-black' : ''
                }`
              }
              onClick={() => gotoPage(index)}
            >
              {index + 1}
            </a>
          ))}
        </>
      </div>
    </div>
  )
}

interface Props {
  columns: string[]
  issues: Issue[]
  pageSize: number
}

const IssueTable: React.FunctionComponent<Props> = ({ columns, issues, pageSize }) => {
  let columnsToUse = columns.map(name => {
    if (COLUMNS[name] === undefined) {
      throw new Error(`Unknown column: ${name}`)
    }
    return COLUMNS[name]
  })

  if (issues.length === 0) {
    return <div>No matches</div>
  }

  return <Table pageSize={pageSize} columns={columnsToUse} issues={issues} />
}

export default IssueTable
