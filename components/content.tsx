import { Grid } from '@material-ui/core'

const Content: React.FunctionComponent<{}> = props => (
  <div className="content">
    {props.children}
    <style jsx>{`
      .content {
        display: flex;
        flex-grow: 1;
        padding: 16px;
      }
    `}</style>
  </div>
)

export default Content
