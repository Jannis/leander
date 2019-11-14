const gql = require('graphql-tag')
const { GraphQLError } = require('graphql')

const VIEWER_QUERY = gql`
  {
    viewer {
      id
      login
      name
      avatarUrl
    }
  }
`

const queryViewer = async githubClient => {
  console.log('Query viewer')

  let { data, errors } = await githubClient.query({
    query: VIEWER_QUERY,
  })

  if (errors) {
    throw new GraphQLError(errors)
  }

  if (data) {
    return data.viewer
  }
}

module.exports = {
  helpers: {
    queryViewer,
  },
  resolvers: {
    viewer: async (parent, args, { githubClient }) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }
      return await queryViewer(githubClient)
    },
  },
}
