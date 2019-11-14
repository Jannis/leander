const gql = require('graphql-tag')
const { GraphQLError } = require('graphql')

const REPOSITORY_QUERY = gql`
  query repository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      name
      labels(first: 100) {
        nodes {
          id
          name
          color
        }
      }
    }
  }
`

const parseRepository = (node, organization) => ({
  id: node.id,
  name: node.name,
  organization,
  labels: node.labels.nodes.map(label => ({
    id: label.id,
    name: label.name,
    color: label.color,
  })),
})

module.exports = {
  resolvers: {
    repositories: async (parent, { owner, names }, { githubClient }) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }

      let repositories = await Promise.all(
        names.map(async name => {
          console.log('Query repository', owner, name)

          let { data, errors } = await githubClient.query({
            query: REPOSITORY_QUERY,
            variables: { owner, name },
            fetchPolicy: 'no-cache',
          })

          if (errors) {
            throw new GraphQLError(errors)
          }

          return data.repository
        }),
      )

      return repositories.map(repo => parseRepository(repo, owner))
    },
  },
}
