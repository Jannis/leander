const gql = require('graphql-tag')
const { GraphQLError } = require('graphql')

const ORGANIZATION_QUERY = gql`
  query organization($login: String!) {
    organization(login: $login) {
      id
      login
      name
      membersWithRole(first: 100) {
        nodes {
          id
          login
          name
          avatarUrl
        }
      }
    }
  }
`

const parseOrganization = node => ({
  id: node.id,
  login: node.login,
  name: node.name,
  members: node.membersWithRole.nodes.map(member => ({
    id: member.id,
    login: member.login,
    name: member.name,
    avatarUrl: member.avatarUrl,
  })),
})

const queryOrganization = async (githubClient, login) => {
  console.log('Query organization', login)

  let { data, errors } = await githubClient.query({
    query: ORGANIZATION_QUERY,
    variables: { login },
  })

  if (errors) {
    throw new GraphQLError(errors)
  }

  if (data) {
    return parseOrganization(data.organization)
  }
}

module.exports = {
  helpers: {
    queryOrganization,
  },
  resolvers: {
    organization: async (parent, { login }, { githubClient }) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }

      return await queryOrganization(githubClient, login)
    },
  },
}
