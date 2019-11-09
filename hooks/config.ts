import { useQuery } from 'react-query'
import { validateConfig, Config } from '../utils/config'
import { useRouter } from 'next/router'

export const useConfig = (): { data: Config } => {
  let router = useRouter()
  let { config: url } = router.query

  if (!url) {
    throw Error('No ?config URL provided')
  }

  return useQuery(
    'config',
    async () => {
      let result = await fetch(url as string)
      let config = await result.json()
      let errors = validateConfig(config)
      if (errors.length === 0) {
        return config
      } else {
        throw Error(JSON.stringify(errors, undefined, 2))
      }
    },
    {
      retry: false,
      refetchInterval: false,
      cacheTime: 1000 * 86400,
    },
  )
}
