import { useRouter } from 'next/router'
const usePromise = require('react-promise-suspense')
import { validateConfig, Config } from '../utils/config'

export const useConfig = (): Config => {
  let router = useRouter()
  let { config: url } = router.query

  if (!url) {
    throw Error('No ?config URL provided')
  }

  return usePromise(async () => {
    let result = await fetch(url as string)
    let config = await result.json()
    let errors = validateConfig(config)
    if (errors.length === 0) {
      return config
    } else {
      throw Error(JSON.stringify(errors, undefined, 2))
    }
  }, [])
}
