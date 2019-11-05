import { useQuery } from 'react-query'

export const useConfig = () =>
  useQuery('config', async () => {
    let result = await fetch('http://localhost:3000/leander.config.json')
    return result.json()
  })
