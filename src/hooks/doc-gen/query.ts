import { useMutation } from '@tanstack/react-query'
import { apiRoutes } from '../routes'
import { queryKeys } from '../keys'
import { sitemapGeneratorInputSchema, docGenInputSchema } from './schema'

// Typy dla sitemap-gen
type SitemapGenInput = typeof sitemapGeneratorInputSchema._type

interface SitemapGenResponse {
  success: boolean
  message: string
  data: SitemapGenInput
}

interface SitemapGenMutationOptions {
  onSuccess?: (data: SitemapGenResponse) => void
  onError?: (error: Error) => void
}

// Typy dla doc-gen
type DocGenInput = typeof docGenInputSchema._type

interface DocGenResponse {
  success: boolean
  message: string
  data: DocGenInput
}

interface DocGenMutationOptions {
  onSuccess?: (data: DocGenResponse) => void
  onError?: (error: Error) => void
}

// Funkcja do generowania sitemap
const generateSitemap = async (data: SitemapGenInput): Promise<SitemapGenResponse> => {
  const response = await fetch(apiRoutes.docGen.sitemapGen, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Błąd podczas generowania sitemap')
  }

  return response.json()
}

// Hook do generowania sitemap
export function useSitemapGenMutation(options?: SitemapGenMutationOptions) {
  return useMutation({
    mutationKey: queryKeys.docGen.sitemapGen(),
    mutationFn: generateSitemap,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

// Funkcja do generowania dokumentacji
const generateDocumentation = async (data: DocGenInput): Promise<DocGenResponse> => {
  const response = await fetch(apiRoutes.docGen.docGen, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Błąd podczas generowania dokumentacji')
  }

  return response.json()
}

// Hook do generowania dokumentacji
export function useDocGenMutation(options?: DocGenMutationOptions) {
  return useMutation({
    mutationKey: queryKeys.docGen.docGen(),
    mutationFn: generateDocumentation,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
