import { useQuery } from 'react-query'
import { validateConfig } from '../utils/config'
import { useRouter } from 'next/router'

export const useConfig = () => {
  let router = useRouter()
  let { config: configUrl } = router.query

  if (!configUrl) {
    throw Error('No ?config URL provided')
  }

  return useQuery('config', async () => {
    let result = await fetch(configUrl as string)
    let config = await result.json()
    let errors = validateConfig(config)
    if (errors.length === 0) {
      return config
    } else {
      throw Error(JSON.stringify(errors, undefined, 2))
    }
  })
}
