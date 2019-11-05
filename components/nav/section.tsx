const Section: React.FunctionComponent<{ title: string }> = ({ title, children }) => (
  <div className="root">
    <h2>{title}</h2>
    <div>{children}</div>
    <style jsx>{`
      .root {
        display: flex;
        flex-direction: column;
        margin-bottom: 8px;
      }
      h2 {
        font-size: 1.1rem;
      }
    `}</style>
  </div>
)

export default Section
