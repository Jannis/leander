import GitHubIcon from '@material-ui/icons/GitHub'

const GitHubLink: React.FunctionComponent<{ url: string }> = ({ url, ...props }) => (
  <a href={url}>
    <GitHubIcon fontSize="small" />
    <span>{props.children}</span>
    <style jsx>{`
      a,
      a:link,
      a:visited {
        display: flex;
        flex-direction: row;
        align-items: center;
        color: black;
        text-decoration: none;
      }

      span {
        margin-left: 4px;
      }
    `}</style>
  </a>
)

export default GitHubLink
