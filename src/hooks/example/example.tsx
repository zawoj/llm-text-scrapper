import { useQuery } from '@tanstack/react-query'
import { apiRoutes } from '../routes'
import { queryKeys } from '../keys'

interface HelloResponse {
  message: string
}

const fetchHello = async (): Promise<HelloResponse> => {
  const response = await fetch(apiRoutes.hello.base)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

export function useHello() {
  return useQuery({
    queryKey: queryKeys.hello.all,
    queryFn: fetchHello,
  })
}