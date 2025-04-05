import { inMemoryDb, SitemapEntry, delay, UrlData } from './common'

// Funkcje związane z sitemap
export const sitemapUtils = {
  // Inicjalizacja sitemap
  initSitemap: async (url: string): Promise<SitemapEntry> => {
    try {
      // Zamiast bazy danych, sprawdź tylko w pamięci
      const existingSitemap = inMemoryDb.sitemaps[url]

      if (existingSitemap && existingSitemap.lastmod) {
        const lastModDate = new Date(existingSitemap.lastmod)
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

        if (lastModDate > oneMonthAgo) {
          console.log(`Używam zapisanego sitemap dla ${url} z pamięci`)
          return existingSitemap
        }
      }

      // W przeciwnym przypadku utwórz nowy sitemap
      const sitemap: SitemapEntry = {
        id: Math.floor(Math.random() * 1000), // Fake ID
        url,
        status: 'pending',
        subpages: [],
        progress: 0,
      }
      inMemoryDb.sitemaps[url] = sitemap
      return sitemap
    } catch (error) {
      console.error('Error in initSitemap:', error)
      // Fallback do pamięci
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

          if (sitemapUtils.shouldCrawl(absoluteUrl, baseUrl, visitedUrls)) {
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

      // Dodaj tylko do lokalnej pamięci
      sitemap.subpages.push(subpage)

      // Ustaw ID jeśli nie jest ustawione
      if (!sitemap.id) {
        sitemap.id = Math.floor(Math.random() * 1000) // Fake ID
      }
    } catch (error) {
      console.error('Error in addSubpageToSitemap:', error)
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
          lastmod: await sitemapUtils.getLastModified(currentUrl),
          changefreq: 'weekly',
          priority: '0.7',
        })
      } else {
        // Jeśli strona już była odwiedzona, tylko aktualizuj UI
        updateProgress(currentUrl, false)
      }

      // Ekstrakcja nowych linków
      const newLinks = await sitemapUtils.extractLinks(
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

      // Aktualizacja statusu tylko w pamięci
      sitemap.status = 'completed'
      sitemap.progress = 100
      sitemap.lastmod = new Date().toISOString()
    } catch (error) {
      console.error('Error in completeSitemap:', error)
      // Aktualizacja tylko w pamięci
      const sitemap = inMemoryDb.sitemaps[url]
      if (sitemap) {
        sitemap.status = 'completed'
        sitemap.progress = 100
      }
    }
  },
}
