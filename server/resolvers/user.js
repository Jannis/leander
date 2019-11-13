const gql = require('graphql-tag')

const USER_QUERY = gql`
  {
    user: viewer {
      id
      login
      name
      avatarUrl
    }
  }
`

const queryUser = async githubClient => {
  console.log('Query user')

  let { data, errors } = await githubClient.query({
    query: USER_QUERY,
  })

  if (errors) {
    throw new GraphQLError(errors)
  }

  if (data) {
    return data.user
  }
}

module.exports = {
  helpers: {
    queryUser,
  },
  resolvers: {
    user: async (parent, args, { githubClient }) => {
      if (!githubClient) {
        throw new GraphQLError('Unauthorized')
      }
      return await queryUser(githubClient)
    },
  },
}
