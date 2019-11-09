const NavSection: React.FunctionComponent<{ title: string }> = ({ title, children }) => (
  <div className="mb-4">
    <h2 className="font-medium">{title}</h2>
    <div>{children}</div>
  </div>
)

export default NavSection
