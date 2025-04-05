'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sitemapGeneratorInputSchema } from '@/hooks/doc-gen/schema'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/elements/form'
import { Input } from '@/components/elements/input'
import { Button } from '@/components/elements/button'

type FormData = z.infer<typeof sitemapGeneratorInputSchema>

interface SitemapFormProps {
  isLoading: boolean
  onSubmit: (data: FormData) => void
}

export function SitemapForm({ isLoading, onSubmit }: SitemapFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(sitemapGeneratorInputSchema),
    defaultValues: {
      url: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres URL strony</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Generowanie...' : 'Generuj sitemap'}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
