import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { zValidator } from '@hono/zod-validator'
import { userFormSchema } from '@/hooks/users/schema'
import {
  sitemapGeneratorInputSchema,
  docGenInputSchema,
} from '@/hooks/doc-gen/schema'
import { docGenService, delay } from './doc-gen'

// Explicitly set the runtime to edge
export const runtime = 'edge'

export const app = new Hono().basePath('/api')

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

// =============== Doc-Gen Endpoints ===============

// Endpoint do streamowania postępu generowania sitemap
app.get('/doc-gen/sitemap-progress/:url', async (c) => {
  const encoder = new TextEncoder()
  const url = decodeURIComponent(c.req.param('url'))

  // Ustawienie nagłówków dla SSE
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Inicjalizacja sitemap jeśli nie istnieje
  if (!docGenService.getSitemap(url)) {
    await docGenService.initSitemap(url)
  }

  // Funkcja do aktualizacji postępu i wysyłania informacji do klienta
  const updateProgressAndSendUpdate = async (
    subpage: string,
    isNewPage: boolean
  ) => {
    // Aktualizacja stanu tylko jeśli to nowa strona
    if (isNewPage) {
      await docGenService.addSubpageToSitemap(url, subpage)
    }

    // Wysłanie aktualizacji do klienta
    const sitemap = docGenService.getSitemap(url)
    const update = {
      event: 'update',
      data: {
        isScanning: true,
        message: `Znaleziono: ${subpage}`,
        subpages: sitemap?.subpages || [],
      },
    }

    await writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`))
  }

  // Funkcja aktualizująca postęp
  const updateProgress = async () => {
    try {
      // Crawlowanie strony bez ograniczeń na liczbę URL-i
      await docGenService.generateSitemapPaths(url, updateProgressAndSendUpdate)

      // Zakończenie generowania sitemap
      await docGenService.completeSitemap(url)

      const sitemap = docGenService.getSitemap(url)

      const finalUpdate = {
        event: 'complete',
        data: {
          isScanning: false,
          message: `Generowanie sitemap zakończone! Znaleziono ${sitemap?.subpages.length || 0} podstron.`,
          subpages: sitemap?.subpages || [],
        },
      }

      await writer.write(
        encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`)
      )
      await writer.close()
    } catch (error) {
      console.error('Błąd podczas generowania sitemap:', error)

      const errorUpdate = {
        event: 'error',
        data: {
          message: 'Wystąpił błąd podczas generowania sitemap',
        },
      }

      await writer.write(
        encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`)
      )
      await writer.close()
    }
  }

  // Uruchomienie asynchronicznego aktualizowania postępu
  updateProgress()

  return c.body(stream.readable)
})

// Endpoint do pobierania całego sitemap
app.get('/doc-gen/sitemap/:url', async (c) => {
  const url = decodeURIComponent(c.req.param('url'))

  const sitemap = docGenService.getSitemap(url)
  if (!sitemap) {
    return c.json(
      {
        success: false,
        message: 'Sitemap nie został wygenerowany',
      },
      404
    )
  }

  return c.json({
    success: true,
    data: sitemap,
  })
})

// Endpoint do rozpoczęcia generowania sitemap
app.post(
  '/doc-gen/sitemap-gen',
  zValidator('json', sitemapGeneratorInputSchema),
  async (c) => {
    const { url } = c.req.valid('json')

    // Inicjalizacja nowego sitemap
    await docGenService.initSitemap(url)

    return c.json({
      success: true,
      message: 'Rozpoczęto generowanie sitemap',
      data: { url },
    })
  }
)

// Endpoint do streamowania postępu generowania dokumentacji
app.get('/doc-gen/doc-progress/:url', async (c) => {
  const encoder = new TextEncoder()
  const url = decodeURIComponent(c.req.param('url'))

  // Ustawienie nagłówków dla SSE
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Sprawdzenie czy sitemap istnieje
  if (!docGenService.hasSitemapCompleted(url)) {
    const error = {
      event: 'error',
      data: {
        message: 'Najpierw musisz wygenerować sitemap',
      },
    }

    await writer.write(encoder.encode(`data: ${JSON.stringify(error)}\n\n`))
    await writer.close()
    return c.body(stream.readable)
  }

  // Inicjalizacja dokumentu
  docGenService.initDoc(url)

  // Funkcja aktualizująca postęp
  const generateDoc = async () => {
    const sitemap = docGenService.getSitemap(url)
    if (!sitemap) return

    const subpages = sitemap.subpages
    const totalPages = subpages.length
    let fileName = ''
    let allHtml = ''

    // Scrapowanie każdej podstrony
    for (let i = 0; i < subpages.length; i++) {
      const progress = Math.round((i / totalPages) * 100)
      const subpage = subpages[i]

      // Faktyczne pobieranie HTML z podstrony
      try {
        const html = await docGenService.fetchHtmlContent(subpage)
        allHtml += `\n\n<!-- START OF PAGE: ${subpage} -->\n${html}\n<!-- END OF PAGE: ${subpage} -->\n`

        // Aktualizacja zawartości dokumentu z pobranym HTML
        await docGenService.updateDocContent(url, subpage, html)
      } catch (error) {
        console.error(`Error fetching HTML from ${subpage}:`, error)
      }

      // Wysłanie aktualizacji do klienta
      const update = {
        event: 'update',
        data: {
          progress,
          totalPages,
          currentPage: i + 1,
          message: `Scrapowanie (${i + 1}/${totalPages}): ${subpage}`,
        },
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`))

      // Symulacja czasu potrzebnego na scrapowanie strony
      await delay(1500)
    }

    // Zapisz cały HTML do pliku
    try {
      fileName = await docGenService.saveHtmlToFile(url, allHtml)
    } catch (error) {
      console.error('Error saving HTML to file:', error)
    }

    // Zakończenie generowania dokumentacji
    await docGenService.completeDoc(url)

    const finalUpdate = {
      event: 'complete',
      data: {
        progress: 100,
        totalPages,
        message: `Generowanie dokumentacji zakończone! Przetworzono ${totalPages} podstron.`,
        documentationUrl: `/api/doc-gen/doc/${encodeURIComponent(url)}`,
        htmlFileUrl: fileName ? `/api/doc-gen/html-file/${fileName}` : null,
      },
    }

    await writer.write(
      encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`)
    )
    await writer.close()
  }

  // Uruchomienie asynchronicznego generowania dokumentacji
  generateDoc()

  return c.body(stream.readable)
})

// Endpoint do pobierania wygenerowanej dokumentacji
app.get('/doc-gen/doc/:url', async (c) => {
  const url = decodeURIComponent(c.req.param('url'))

  const doc = docGenService.getDoc(url)
  if (!doc || doc.status !== 'completed') {
    return c.json(
      {
        success: false,
        message: 'Dokumentacja nie została wygenerowana',
      },
      404
    )
  }

  // Generowanie pełnego dokumentu Markdown
  const fullDoc = docGenService.generateFullDoc(url)

  // Zwrócenie dokumentu jako plaintext z odpowiednimi nagłówkami
  c.header('Content-Type', 'text/markdown')
  c.header(
    'Content-Disposition',
    `attachment; filename="dokumentacja-${encodeURIComponent(url)}.md"`
  )

  return c.body(fullDoc)
})

// Endpoint do pobierania pliku HTML
app.get('/doc-gen/html-file/:filename', async (c) => {
  const filename = c.req.param('filename')

  const fileContent = docGenService.getFileContent(filename)
  if (!fileContent) {
    return c.json(
      {
        success: false,
        message: 'Plik nie został znaleziony',
      },
      404
    )
  }

  // Zwrócenie pliku HTML jako plaintext z odpowiednimi nagłówkami
  c.header('Content-Type', 'text/plain')
  c.header('Content-Disposition', `attachment; filename="${filename}"`)

  // Return the Uint8Array directly - Hono/Edge runtime will handle it correctly
  return c.body(fileContent)
})

// Endpoint do rozpoczęcia generowania dokumentacji
app.post(
  '/doc-gen/doc-gen',
  zValidator('json', docGenInputSchema),
  async (c) => {
    const { url } = c.req.valid('json')

    // Sprawdzenie czy sitemap istnieje i jest ukończony
    if (!docGenService.hasSitemapCompleted(url)) {
      return c.json(
        {
          success: false,
          message: 'Najpierw musisz wygenerować sitemap',
        },
        400
      )
    }

    return c.json({
      success: true,
      message: 'Rozpoczęto generowanie dokumentacji',
      data: { url },
    })
  }
)

export const GET = handle(app)
export const POST = handle(app)
