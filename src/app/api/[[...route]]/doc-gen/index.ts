// Import fetch for HTML fetching
// No need to import fetch - using native fetch API available in Edge Runtime

// No need to import crypto - using Web Crypto API available in Edge Runtime
import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { websites, websiteSubpages } from '@/hooks/doc-gen/schema'

// Definicje typów i baza danych w pamięci
type SitemapEntry = {
  id?: number
  url: string
  status: 'pending' | 'completed'
  subpages: string[]
  progress: number
  lastmod?: string
}

// Struktura danych dla URLi w sitemap
interface UrlData {
  loc: string
  lastmod: string
  changefreq: string
  priority: string
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
  initSitemap: async (url: string): Promise<SitemapEntry> => {
    try {
      // Sprawdź, czy mamy istniejący wpis dla tej strony w bazie
      const existingWebsite = await db.query.websites.findFirst({
        where: eq(websites.url, url),
      })

      // Jeśli istnieje i był aktualizowany w ciągu ostatniego miesiąca, użyj zapisanych danych
      if (existingWebsite && existingWebsite.lastmod) {
        const lastModDate = new Date(existingWebsite.lastmod)
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

        if (lastModDate > oneMonthAgo) {
          console.log(`Używam zapisanego sitemap dla ${url} z bazy danych`)

          // Pobierz wszystkie podstrony z bazy
          const subpages = await db.query.websiteSubpages.findMany({
            where: eq(websiteSubpages.website_id, existingWebsite.id),
          })

          const sitemapFromDb: SitemapEntry = {
            id: existingWebsite.id,
            url,
            status: 'completed',
            subpages: subpages.map((s) => s.url),
            progress: 100,
            lastmod: existingWebsite.lastmod.toISOString(),
          }

          inMemoryDb.sitemaps[url] = sitemapFromDb
          return sitemapFromDb
        }
      }

      // W przeciwnym przypadku utwórz nowy sitemap
      const sitemap: SitemapEntry = {
        url,
        status: 'pending',
        subpages: [],
        progress: 0,
      }
      inMemoryDb.sitemaps[url] = sitemap

      return sitemap
    } catch (error) {
      console.error('Database error in initSitemap:', error)
      // Fallback do pamięci, gdy baza jest niedostępna
      const sitemap: SitemapEntry = {
        url,
        status: 'pending',
        subpages: [],
        progress: 0,
      }
      inMemoryDb.sitemaps[url] = sitemap
      return sitemap
    }
  },

  // Pobieranie sitemap
  getSitemap: (url: string): SitemapEntry | null => {
    return inMemoryDb.sitemaps[url] || null
  },

  // Sprawdzenie czy powinien być przetwarzany URL
  shouldCrawl: (
    url: string,
    baseUrl: string,
    visitedUrls: Set<string>
  ): boolean => {
    try {
      const parsedUrl = new URL(url)
      const baseHostname = new URL(baseUrl).hostname

      // Sprawdź czy URL jest z tej samej domeny
      if (parsedUrl.hostname !== baseHostname) {
        return false
      }

      // Sprawdź czy URL już odwiedziliśmy
      if (visitedUrls.has(url)) {
        return false
      }

      // Sprawdź rozszerzenie pliku - pomijamy pliki statyczne
      const pathLower = parsedUrl.pathname.toLowerCase()
      const excludedExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.svg',
        '.webp',
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.zip',
        '.rar',
        '.tar',
        '.gz',
        '.7z',
        '.mp3',
        '.mp4',
        '.avi',
        '.mov',
        '.webm',
        '.css',
        '.js',
        '.json',
        '.xml',
        '.rss',
        '.atom',
      ]
      if (excludedExtensions.some((ext) => pathLower.endsWith(ext))) {
        return false
      }

      // Wykluczenie ścieżek administracyjnych
      const excludedPaths = [
        '/wp-admin',
        '/wp-login',
        '/admin',
        '/login',
        '/signin',
        '/cart',
        '/checkout',
      ]
      if (excludedPaths.some((path) => parsedUrl.pathname.includes(path))) {
        return false
      }

      return true
    } catch (e) {
      console.error(`Błąd podczas przetwarzania URL: ${url}`, e)
      return false
    }
  },

  // Wyciąganie linków ze strony HTML
  extractLinks: async (
    url: string,
    baseUrl: string,
    visitedUrls: Set<string>
  ): Promise<string[]> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 sekund timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SitemapGenerator/1.0)',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return []
      }

      const html = await response.text()
      const links: string[] = []

      // Proste parsowanie linków za pomocą wyrażeń regularnych
      // Nie jest to idealne rozwiązanie, ale działa w środowisku Edge Runtime
      const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
      let match

      while ((match = hrefRegex.exec(html)) !== null) {
        try {
          const href = match[1]
          if (!href) continue

          // Przekształć względny URL do absolutnego
          let absoluteUrl = new URL(href, url).href

          // Usuń fragmenty URL (#)
          absoluteUrl = absoluteUrl.split('#')[0]

          if (docGenService.shouldCrawl(absoluteUrl, baseUrl, visitedUrls)) {
            links.push(absoluteUrl)
          }
          // eslint-disable-next-line no-empty
        } catch {
          // Ignoruj niepoprawne URLe
        }
      }

      return [...new Set(links)] // Usuń duplikaty
    } catch (error) {
      console.error(`Błąd podczas przetwarzania ${url}:`, error)
      return []
    }
  },

  // Pobranie daty ostatniej modyfikacji
  getLastModified: async (url: string): Promise<string> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 sekund timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const lastModified = response.headers.get('last-modified')
      if (lastModified) {
        return new Date(lastModified).toISOString().split('T')[0]
      }
      // eslint-disable-next-line no-empty
    } catch {
      // Cicha obsługa błędów
    }
    return new Date().toISOString().split('T')[0]
  },

  // Aktualizacja postępu sitemap
  updateSitemapProgress: (url: string, progress: number, subpage: string) => {
    const sitemap = inMemoryDb.sitemaps[url]
    if (sitemap) {
      sitemap.subpages.push(subpage)
      sitemap.progress = progress
    }
  },

  // Dodaj podstronę do sitemap
  addSubpageToSitemap: async (url: string, subpage: string) => {
    try {
      const sitemap = inMemoryDb.sitemaps[url]
      if (!sitemap) return

      // Jeśli podstrona już istnieje, nie dodawaj ponownie
      if (sitemap.subpages.includes(subpage)) return

      // Dodaj do lokalnej pamięci
      sitemap.subpages.push(subpage)

      // Sprawdź czy mamy już website_id dla tego URL
      if (!sitemap.id) {
        // Znajdź lub utwórz wpis w tabeli websites
        const existingWebsite = await db.query.websites.findFirst({
          where: eq(websites.url, url),
        })

        if (existingWebsite) {
          sitemap.id = existingWebsite.id
        } else {
          const currentDate = new Date()
          const [newWebsite] = await db
            .insert(websites)
            .values({
              url,
              lastmod: currentDate,
              changefreq: 'weekly',
              priority: '0.7',
            })
            .returning({ id: websites.id })

          if (newWebsite && newWebsite.id) {
            sitemap.id = newWebsite.id
          }
        }
      }

      // Jeśli mamy website_id, dodaj podstronę do bazy
      if (sitemap.id) {
        // Sprawdź czy podstrona już istnieje w bazie
        const existingSubpage = await db.query.websiteSubpages.findFirst({
          where: and(
            eq(websiteSubpages.website_id, sitemap.id),
            eq(websiteSubpages.url, subpage)
          ),
        })

        if (!existingSubpage) {
          // Dodaj nową podstronę do bazy
          await db.insert(websiteSubpages).values({
            website_id: sitemap.id,
            url: subpage,
            changefreq: 'weekly',
            priority: '0.7',
          })
        }
      }
    } catch (error) {
      console.error('Database error in addSubpageToSitemap:', error)
      // Kontynuuj pracę w pamięci w przypadku błędu bazy danych
    }
  },

  // Generowanie rzeczywistych ścieżek sitemap przez crawlowanie
  generateSitemapPaths: async (
    baseUrl: string,
    updateProgress: (subpage: string, isNewPage: boolean) => void
  ): Promise<string[]> => {
    const visitedUrls = new Set<string>()
    const urlsToVisit = [baseUrl]
    const urlsData: UrlData[] = []

    while (urlsToVisit.length > 0) {
      const currentUrl = urlsToVisit.shift()
      if (!currentUrl) continue

      const isNewPage = !visitedUrls.has(currentUrl)
      if (isNewPage) {
        visitedUrls.add(currentUrl)

        // Aktualizuj postęp z nową stroną
        updateProgress(currentUrl, isNewPage)

        // Dodaj URL do listy danych
        urlsData.push({
          loc: currentUrl,
          lastmod: await docGenService.getLastModified(currentUrl),
          changefreq: 'weekly',
          priority: '0.7',
        })
      } else {
        // Jeśli strona już była odwiedzona, tylko aktualizuj UI
        updateProgress(currentUrl, false)
      }

      // Ekstrakcja nowych linków
      const newLinks = await docGenService.extractLinks(
        currentUrl,
        baseUrl,
        visitedUrls
      )

      // Dodaj nowe linki do kolejki
      for (const link of newLinks) {
        if (!visitedUrls.has(link) && !urlsToVisit.includes(link)) {
          urlsToVisit.push(link)
        }
      }

      // Małe opóźnienie aby nie obciążać serwera
      await delay(500)
    }

    return Array.from(visitedUrls)
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 sekund timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DocGenerator/1.0)',
        },
      })

      clearTimeout(timeoutId)

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

  // Generate sitemap XML content
  generateSitemapXml: (url: string): string => {
    const sitemap = inMemoryDb.sitemaps[url]
    if (!sitemap) return ''

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xmlContent +=
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for (const subpage of sitemap.subpages) {
      xmlContent += '  <url>\n'
      xmlContent += `    <loc>${subpage}</loc>\n`
      xmlContent += '    <changefreq>weekly</changefreq>\n'
      xmlContent += '    <priority>0.7</priority>\n'
      xmlContent += '  </url>\n'
    }

    xmlContent += '</urlset>'
    return xmlContent
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

  // Zakończenie generowania sitemap
  completeSitemap: async (url: string) => {
    try {
      const sitemap = inMemoryDb.sitemaps[url]
      if (!sitemap) return

      // Aktualizacja statusu w pamięci
      sitemap.status = 'completed'
      sitemap.progress = 100

      // Aktualizacja lastmod w bazie danych
      if (sitemap.id) {
        await db
          .update(websites)
          .set({
            lastmod: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(websites.id, sitemap.id))
      }
    } catch (error) {
      console.error('Database error in completeSitemap:', error)
      // Kontynuuj pracę w pamięci w przypadku błędu bazy danych
      const sitemap = inMemoryDb.sitemaps[url]
      if (sitemap) {
        sitemap.status = 'completed'
        sitemap.progress = 100
      }
    }
  },

  // Aktualizacja zawartości dokumentacji
  updateDocContent: async (url: string, subpage: string, html?: string) => {
    try {
      const doc = inMemoryDb.docs[url]
      if (doc) {
        doc.content += `\n\n## Dokumentacja dla ${subpage}\n\n`
        doc.content += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. 
Phasellus euismod, purus eget tristique tincidunt, sapien nunc pharetra nulla, eget rhoncus nisl diam eget nisi.`

        // If HTML content is provided, append it to htmlContent
        if (html) {
          doc.htmlContent = (doc.htmlContent || '') + html
        }
      }

      // Aktualizuj doc_url w tabeli websites po zakończeniu generowania dokumentacji
      const sitemap = inMemoryDb.sitemaps[url]
      if (sitemap && sitemap.id) {
        // Nie aktualizujemy doc_url tutaj, tylko przy zakończeniu generowania dokumentacji
      }
    } catch (error) {
      console.error('Database error in updateDocContent:', error)
    }
  },

  // Zakończenie generowania dokumentacji
  completeDoc: async (url: string) => {
    try {
      const doc = inMemoryDb.docs[url]
      if (doc) {
        doc.status = 'completed'
      }

      // Aktualizuj doc_url w tabeli websites
      const sitemap = inMemoryDb.sitemaps[url]
      if (sitemap && sitemap.id) {
        await db
          .update(websites)
          .set({
            doc_url: `/api/doc-gen/doc/${encodeURIComponent(url)}`,
            updatedAt: new Date(),
          })
          .where(eq(websites.id, sitemap.id))
      }
    } catch (error) {
      console.error('Database error in completeDoc:', error)
    }
  },
}
