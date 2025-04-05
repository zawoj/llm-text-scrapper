import { z } from 'zod'

export const userFormSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  message: z.string().min(10, 'Wiadomość musi mieć minimum 10 znaków'),
})

export type UserFormData = z.infer<typeof userFormSchema>
