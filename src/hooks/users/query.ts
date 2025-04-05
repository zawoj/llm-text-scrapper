import { useMutation } from '@tanstack/react-query'
import { apiRoutes } from '../routes'
import { queryKeys } from '../keys'
import { UserFormData } from './schema'

interface UserResponse {
  success: boolean
  message: string
  data: UserFormData
}

interface UserMutationOptions {
  onSuccess?: (data: UserResponse) => void
  onError?: (error: Error) => void
}

const submitUserForm = async (data: UserFormData): Promise<UserResponse> => {
  const response = await fetch(apiRoutes.users.create, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Błąd podczas wysyłania formularza')
  }

  return response.json()
}

export function useUserFormMutation(options?: UserMutationOptions) {
  return useMutation({
    mutationKey: queryKeys.users.create(),
    mutationFn: submitUserForm,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
