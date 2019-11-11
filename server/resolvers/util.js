const fixDelegatedScalarSelectionSet = subquery => ({
  transformRequest: request => {
    // Identify the selection for the root field (e.g. `subgraph(...) {}`)
    let rootFieldSelection = request.document.definitions[0].selectionSet.selections[0]

    // Add a selection set under that selection (making it e.g.
    // `subgraph(...) { entityCount })`), because graphql-tools
    // somehow doesn't do that when delegating scalar fields...
    rootFieldSelection.selectionSet = subquery.definitions[0].selectionSet

    return request
  },
})

// Helper to create delegated field resolvers with less boilerplate.
const delegatedResolver = (
  schema,
  rootField,
  argsFromParent,
  parentFragment,
  subquery,
  resultTransform,
) => {
  return {
    fragment: parentFragment,
    resolve: async (parent, args, context, info) => {
      let computedArgs = argsFromParent(parent, args, context, info)
      let options = {
        schema,
        operation: 'query',
        fieldName: rootField,
        args: computedArgs,
        context,
        info,
        transforms: [fixDelegatedScalarSelectionSet(subquery)],
      }
      let result = await info.mergeInfo.delegateToSchema(options)

      if (!result) {
        throw new Error('Failed to get data from GitHub schema')
      }

      if (typeof resultTransform === 'string') {
        return result[resultTransform]
      } else {
        return resultTransform(result)
      }
    },
  }
}

module.exports = {
  delegatedResolver,
}
