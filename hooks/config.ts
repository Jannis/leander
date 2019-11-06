import { useQuery } from 'react-query'
import { validateConfig } from '../utils/config'

export const useConfig = () =>
  useQuery('config', async () => {
    let result = await fetch('http://localhost:3000/leander.config.json')
    let config = await result.json()
    let errors = validateConfig(config)
    if (errors.length === 0) {
      return config
    } else {
      throw Error(JSON.stringify(errors, undefined, 2))
    }
  })
