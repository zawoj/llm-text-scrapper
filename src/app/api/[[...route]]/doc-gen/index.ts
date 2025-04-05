// Import fetch for HTML fetching
// No need to import fetch - using native fetch API available in Edge Runtime

// No need to import crypto - using Web Crypto API available in Edge Runtime

// Definicje typów i baza danych w pamięci
type SitemapEntry = {
  url: string
  status: 'pending' | 'completed'
  subpages: string[]
  progress: number
}

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

// Pomocnicza funkcja do symulacji opóźnienia
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Serwisy dla doc-gen
export const docGenService = {
  // Inicjalizacja sitemap
  initSitemap: (url: string): SitemapEntry => {
    const sitemap: SitemapEntry = {
      url,
      status: 'pending',
      subpages: [],
      progress: 0,
    }
    inMemoryDb.sitemaps[url] = sitemap
    return sitemap
  },

  // Pobieranie sitemap
  getSitemap: (url: string): SitemapEntry | null => {
    return inMemoryDb.sitemaps[url] || null
  },

  // Symulacja odkrywania podstron
  generateSitemapPaths: (baseUrl: string): string[] => {
    const paths = [
      '',
      '/about',
      '/contact',
      '/products',
      '/products/category-1',
      '/products/category-2',
      '/blog',
      '/blog/post-1',
      '/blog/post-2',
      '/docs',
      '/docs/getting-started',
      '/docs/api-reference',
    ]

    return paths.map((path) => `${baseUrl}${path}`)
  },

  // Inicjalizacja dokumentacji
  initDoc: (url: string) => {
    const doc = {
      url,
      content: '',
      htmlContent: '',
      status: 'pending' as const,
    }
    inMemoryDb.docs[url] = doc
    return doc
  },

  // Pobieranie dokumentacji
  getDoc: (url: string) => {
    return inMemoryDb.docs[url] || null
  },

  // Fetch HTML content for a given URL
  fetchHtmlContent: async (url: string): Promise<string> => {
    try {
      // Using native fetch API instead of node-fetch
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`
        )
      }
      return await response.text()
    } catch (error) {
      console.error(`Error fetching HTML from ${url}:`, error)
      return `<!-- Error fetching content for ${url} -->`
    }
  },

  // Fetch HTML content for all subpages
  fetchAllSubpagesHtml: async (baseUrl: string): Promise<string> => {
    const sitemap = inMemoryDb.sitemaps[baseUrl]
    if (!sitemap) return ''

    let allHtml = ''

    for (const subpage of sitemap.subpages) {
      allHtml += `\n\n<!-- START OF PAGE: ${subpage} -->\n`
      const html = await docGenService.fetchHtmlContent(subpage)
      allHtml += html
      allHtml += `\n<!-- END OF PAGE: ${subpage} -->\n`
    }

    return allHtml
  },

  // Save HTML content to a file and store in memory
  saveHtmlToFile: async (url: string, htmlContent: string): Promise<string> => {
    // Using Web Crypto API's randomUUID which is available in Edge Runtime
    const fileId = crypto.randomUUID()
    const fileName = `${encodeURIComponent(url.replace(/[^a-zA-Z0-9]/g, '_'))}_${fileId}.txt`

    // Store content in memory using TextEncoder for Edge compatibility
    const encoder = new TextEncoder()
    inMemoryDb.files[fileName] = encoder.encode(htmlContent)

    return fileName
  },

  // Get file content by name
  getFileContent: (fileName: string): Uint8Array | null => {
    return inMemoryDb.files[fileName] || null
  },

  // Generowanie pełnej dokumentacji
  generateFullDoc: (url: string): string => {
    const sitemap = inMemoryDb.sitemaps[url]
    const doc = inMemoryDb.docs[url]

    if (!sitemap || !doc) return ''

    return `# Dokumentacja dla ${url}

Wygenerowano automatycznie.

## Struktura strony

${sitemap.subpages.map((page) => `- ${page}`).join('\n')}

${doc.content}

---
Wygenerowano: ${new Date().toLocaleString()}
`
  },

  // Sprawdzenie czy sitemap istnieje i jest ukończony
  hasSitemapCompleted: (url: string): boolean => {
    const sitemap = inMemoryDb.sitemaps[url]
    return !!sitemap && sitemap.status === 'completed'
  },

  // Aktualizacja postępu sitemap
  updateSitemapProgress: (url: string, progress: number, subpage: string) => {
    const sitemap = inMemoryDb.sitemaps[url]
    if (sitemap) {
      sitemap.subpages.push(subpage)
      sitemap.progress = progress
    }
  },

  // Zakończenie generowania sitemap
  completeSitemap: (url: string) => {
    const sitemap = inMemoryDb.sitemaps[url]
    if (sitemap) {
      sitemap.status = 'completed'
      sitemap.progress = 100
    }
  },

  // Aktualizacja zawartości dokumentacji
  updateDocContent: (url: string, subpage: string, html?: string) => {
    const doc = inMemoryDb.docs[url]
    if (doc) {
      doc.content += `\n\n## Dokumentacja dla ${subpage}\n\n`
      doc.content += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. 
Phasellus euismod, purus eget tristique tincidunt, sapien nunc pharetra nulla, eget rhoncus nisl diam eget nisi.`

      // If HTML content is provided, append it to htmlContent
      if (html) {
        doc.htmlContent =
          (doc.htmlContent || '') + `\n\n<!-- ${subpage} -->\n${html}`
      }
    }
  },

  // Zakończenie generowania dokumentacji
  completeDoc: (url: string) => {
    const doc = inMemoryDb.docs[url]
    if (doc) {
      doc.status = 'completed'
    }
  },
}
