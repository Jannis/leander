import SentimentSatisfiedTwoToneIcon from '@material-ui/icons/SentimentSatisfiedTwoTone'
import Project from './nav/project'
import { Suspense } from 'react'
import Repositories from './nav/repositories'
import Pages from './nav/pages'

const Logo: React.FunctionComponent<{}> = props => (
  <div className="logo">
    <SentimentSatisfiedTwoToneIcon fontSize="large" />
    <h1>Leander</h1>
    <style jsx>{`
      .logo {
        color: #1890ff;
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 16px;
      }
      h1 {
        font-size: 1.2rem;
        margin-left: 4px;
      }
    `}</style>
  </div>
)

const Nav: React.FunctionComponent<{}> = props => {
  return (
    <div className="nav">
      <Logo />
      <Suspense fallback={<div>Loading...</div>}>
        <>
          <Project />
          <Repositories />
          <Pages />
        </>
      </Suspense>
      <style jsx>{`
        .nav {
          display: flex;
          flex-grow: 0;
          flex-direction: column;
          padding: 16px;
          background: #eee;
        }
      `}</style>
    </div>
  )
}

export default Nav
