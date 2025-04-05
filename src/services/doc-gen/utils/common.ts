// Common types and utility functions

// Pomocnicza funkcja do symulacji opóźnienia
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Definicje typów
export type SitemapEntry = {
  id?: number
  url: string
  status: 'pending' | 'completed'
  subpages: string[]
  progress: number
  lastmod?: string
}

// Struktura danych dla URLi w sitemap
export interface UrlData {
  loc: string
  lastmod: string
  changefreq: string
  priority: string
}

// Wspólna struktura in-memory DB
export const inMemoryDb: {
  sitemaps: Record<string, SitemapEntry>
  docs: Record<
    string,
    {
      url: string
      content: string
      status: 'pending' | 'completed'
      htmlContent?: string
    }
  >
  files: Record<string, Uint8Array>
} = {
  sitemaps: {},
  docs: {},
  files: {},
}
