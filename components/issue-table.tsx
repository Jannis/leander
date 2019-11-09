import { useTable, usePagination, useExpanded, Column } from 'react-table'
import BugReportOutlinedIcon from '@material-ui/icons/BugReportOutlined'
import BuildOutlinedIcon from '@material-ui/icons/BuildOutlined'
import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined'
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined'
import CheckCircleOutlineOutlinedIcon from '@material-ui/icons/CheckCircleOutlineOutlined'
import CheckBoxOutlineBlankOutlinedIcon from '@material-ui/icons/CheckBoxOutlineBlankOutlined'
import { Issue, Organization, Repository } from '../utils/types'
import GitHubLink from './nav/github-link'
import { Avatar, Chip, Paper, Link, Grid } from '@material-ui/core'
import IssueDetails from './issue-details'
import { Fragment } from 'react'

const COLUMNS: { [key: string]: any } = {
  link: {
    Header: 'Issue',
    id: 'number',
    Cell: ({ row: { original: issue } }) => (
      <div className="truncate">
        <Link
          target="_blank"
          href={`https://github.com/${issue.repository.organization.login}/${issue.repository.name}/issues/${issue.number}`}
        >
          {issue.repository.name}#{issue.number}
        </Link>
      </div>
    ),
  },
  number: {
    Header: '#',
    accessor: 'number',
  },
  title: {
    Header: 'Title',
    accessor: 'title',
  },
  severity: {
    Header: 'Severity',
    accessor: 'stats.severity',
    Cell: ({ row, cell: { value: severity } }) =>
      severity === 'bug' ? (
        <BugReportOutlinedIcon color="error" />
      ) : severity === 'feature' ? (
        <BuildOutlinedIcon color="primary" />
      ) : (
        <HelpOutlineOutlinedIcon color="disabled" />
      ),
  },
  age: {
    Header: 'Age',
    accessor: 'stats.age',
    Cell: ({ cell: { value: age } }) =>
      age.asDays() > 30 ? <span color="red">{age.humanize()}</span> : age.humanize(),
  },
  updated: {
    Header: 'Updated',
    accessor: 'stats.updated',
    Cell: ({ cell: { value: updated } }) =>
      updated.asDays() > 7 ? (
        <span style={{ color: 'red' }}>{updated.humanize()}</span>
      ) : (
        updated.humanize()
      ),
  },
  assigned: {
    Header: 'Assigned',
    accessor: 'stats.assigned',
    Cell: ({ row: { original: issue } }) =>
      issue.stats.assignees.length > 0 ? (
        <Grid container direction="row" alignItems="center">
          {issue.stats.assignees.map(assignee => (
            <Avatar
              key={assignee.login}
              alt={assignee.name || assignee.login}
              src={assignee.avatarUrl}
              style={{
                width: '24px',
                height: '24px',
                marginRight: '1px',
              }}
            />
          ))}
        </Grid>
      ) : (
        <ErrorOutlineOutlinedIcon color="error" />
      ),
  },
  phase: {
    Header: 'Phase',
    accessor: 'stats.phase',
  },
  source: {
    Header: 'Source',
    accessor: 'stats.source',
    Cell: ({ cell: { value: source } }) => (source === 'internal' ? 'Team' : 'Community'),
  },
  status: {
    Header: 'Status',
    accessor: 'stats.status',
    Cell: ({ cell: { value: status } }) => (status === 'open' ? 'Open' : 'Closed'),
  },
  triaged: {
    Header: 'Triaged',
    accessor: 'stats.triaged',
    Cell: ({ cell: { value: triaged } }) =>
      triaged ? (
        <CheckCircleOutlineOutlinedIcon />
      ) : (
        <ErrorOutlineOutlinedIcon color="error" />
      ),
  },
  activity: {
    Header: 'Activity',
    accessor: 'stats.activity',
  },
  projects: {
    Header: 'Projects',
    accessor: 'stats.projects',
    Cell: ({ cell: { value: projects } }) => (
      <>
        {projects.map(project => (
          <Chip
            key={project.name}
            size="small"
            label={project.name}
            className="project"
            style={{
              borderColor: `#${project.color}`,
              backgroundColor: `#${project.color}`,
              marginRight: '1px',
            }}
          />
        ))}
      </>
    ),
  },
  priority: {
    Header: 'Priority',
    accessor: 'stats.priority',
    Cell: ({ cell: { value: priority } }) => {
      let colors = {
        p0: 'red',
        p1: 'darkOrange',
        p2: 'orange',
        p3: 'darkYellow',
        undefined: 'darkGrey',
      }

      return (
        <span style={{ fontWeight: 500, color: colors[priority] }}>
          {(priority || '').toUpperCase()}
        </span>
      )
    },
  },
  size: {
    Header: 'Size',
    accessor: 'stats.size',
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
      initialState: {
        pageIndex: 0,
        pageSize,
      },
    },
    useExpanded,
    usePagination,
  ) as any

  return (
    <div className="w-full">
      <table
        {...getTableProps({ className: 'w-full border border-solid border-gray-200' })}
      >
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, index) => (
                <th
                  {...column.getHeaderProps({ className: 'text-left font-medium p-2' })}
                >
                  {column.render('Header')}
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
                      <IssueDetails issue={row.original} />
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
              className={`ml-1 border inline-block w-8 text-center rounded border-grey-100 hover:border-indigo-500 cursor-pointer ${
                index === pageIndex ? 'border-indigo-500' : ''
              }`}
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

  return <Table pageSize={pageSize} columns={columnsToUse} issues={issues} />
}

export default IssueTable
