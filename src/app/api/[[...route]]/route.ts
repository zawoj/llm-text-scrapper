import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { zValidator } from '@hono/zod-validator'
import { userFormSchema } from '@/hooks/users/schema'

export const runtime = 'edge'

const app = new Hono().basePath('/api')

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello Next.js!',
  })
})

app.post('/user', zValidator('json', userFormSchema), async (c) => {
  const data = c.req.valid('json')

  // Tutaj możesz dodać logikę przetwarzania danych
  // np. zapis do bazy danych
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return c.json({
    success: true,
    message: 'Dane zostały pomyślnie zapisane',
    data,
  })
})

export const GET = handle(app)
export const POST = handle(app)