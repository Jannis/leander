import { ApolloError } from 'apollo-client'

interface Props {
  error: ApolloError
}

export const InlineError: React.FunctionComponent<Props> = ({ error }) => (
  <ul className="list-none">
    {error.graphQLErrors.map((error, index) => (
      <li key={`${index}`} className="text-red-500">
        {error.message}
      </li>
    ))}
  </ul>
)

export const ErrorSection: React.FunctionComponent<Props> = ({ error }) => (
  <div className="flex flex-col w-full pt-6 mt-1">
    <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
    <InlineError error={error} />
  </div>
)
