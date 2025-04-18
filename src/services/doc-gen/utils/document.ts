import { inMemoryDb } from './common'

// Helper function to extract semantic content from HTML
const extractSemanticContent = (html: string): string => {
  // Step 1: Remove DOCTYPE, html, head tags completely
  html = html
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<html[^>]*>|<\/html>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/i, '')

  // Step 2: Extract the body content with regex
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)
  let bodyContent = bodyMatch && bodyMatch[1] ? bodyMatch[1].trim() : html

  // Step 3: Clean the content
  bodyContent = bodyContent
    // Remove script tags completely (with their content)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove style tags
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Remove CSS classes and IDs
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/\s+id="[^"]*"/gi, '')
    // Remove data attributes
    .replace(/\s+data-[^=]*="[^"]*"/gi, '')
    // Remove inline styles
    .replace(/\s+style="[^"]*"/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\s+on\w+="[^"]*"/gi, '')
    // Remove aria attributes
    .replace(/\s+aria-[^=]*="[^"]*"/gi, '')
    // Remove role attributes
    .replace(/\s+role="[^"]*"/gi, '')
    // Remove iframe tags with content
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    // Remove empty tags except semantic ones
    .replace(
      /<(div|span|a|p|ul|ol|li|h[1-6]|section|article|header|footer|main|aside|nav|figure|figcaption|time|mark|table|tr|td|th|thead|tbody|tfoot)([^>]*)><\/\1>/gi,
      ''
    )
    // Remove other common non-semantic tags completely
    .replace(/<(svg)[\s\S]*?<\/\1>/gi, '')
    // Remove form tags
    .replace(
      /<(form|input|button|select|option|textarea|label|fieldset|legend)[\s\S]*?<\/\1>/gi,
      ''
    )
    .replace(
      /<(form|input|button|select|option|textarea|label|fieldset|legend)[^>]*\/?>/gi,
      ''
    )

  // Step 4: Remove navigation elements
  // First identify and remove navigation sections (common patterns in web frameworks)
  bodyContent = bodyContent
    // Remove navigation sections
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    // Remove sidebar elements
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<div[^>]*sidebar[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*navigation[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*menu[^>]*>[\s\S]*?<\/div>/gi, '')
    // Remove UI framework specific navigation patterns
    .replace(/<div[^>]*navbar[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<ul[^>]*menu[^>]*>[\s\S]*?<\/ul>/gi, '')
    .replace(/<div[^>]*nav[^>]*>[\s\S]*?<\/div>/gi, '')

    // Remove common class-named VuePress/VitePress navigation elements (like in your example)
    .replace(/<div[^>]*VPSidebar[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*VPNav[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<section[^>]*VPSidebarItem[^>]*>[\s\S]*?<\/section>/gi, '')
    .replace(/<div[^>]*items[^>]*>[\s\S]*?<\/div>/gi, '')

  // Step 5: Extract just text content from non-semantic tags but keep the semantic tags
  // First pass - remove all non-semantic opening tags except for specific semantic ones
  const semanticPattern =
    /<(?!h[1-6]|p|ul|ol|li|table|tr|td|th|thead|tbody|tfoot|article|section|main|blockquote|pre|code|strong|em|b|i|a|img|time|mark|dl|dt|dd)[a-zA-Z][^>]*>/g
  bodyContent = bodyContent.replace(semanticPattern, '')

  // Second pass - remove all non-semantic closing tags
  const closeTagPattern =
    /<\/(?!h[1-6]|p|ul|ol|li|table|tr|td|th|thead|tbody|tfoot|article|section|main|blockquote|pre|code|strong|em|b|i|a|img|time|mark|dl|dt|dd)[a-zA-Z][^>]*>/g
  bodyContent = bodyContent.replace(closeTagPattern, '')

  // Step 6: Clean up multiple line breaks and spaces
  bodyContent = bodyContent
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim()

  return bodyContent
}

// Helper function to extract just the plain text with minimal formatting
const extractPlainText = (html: string): string => {
  // Start with semantic extraction to remove unnecessary elements
  let content = extractSemanticContent(html)

  // Convert HTML elements to plain text with minimal formatting
  content = content
    // Format headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '$1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '$1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '$1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '$1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '$1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '$1\n\n')
    // Format paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Format lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<\/ul>|<\/ol>/gi, '\n')
    // Format links - just keep the text
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    // Format emphasis
    .replace(/<(b|strong)[^>]*>(.*?)<\/(b|strong)>/gi, '$2')
    .replace(/<(i|em)[^>]*>(.*?)<\/(i|em)>/gi, '$2')
    // Format code blocks
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '$1')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '$1\n\n')
    // Format line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove any remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Remove consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return content
}

export const documentUtils = {
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
      const html = await documentUtils.fetchHtmlContent(subpage)
      // Extract only semantic content
      const semanticContent = extractSemanticContent(html)
      allHtml += semanticContent
      allHtml += `\n<!-- END OF PAGE: ${subpage} -->\n`
    }

    return allHtml
  },

  // Save HTML content to a file and store in memory
  saveHtmlToFile: async (url: string, htmlContent: string): Promise<string> => {
    // Using Web Crypto API's randomUUID which is available in Edge Runtime
    const fileId = crypto.randomUUID()
    const fileName = `${encodeURIComponent(url.replace(/[^a-zA-Z0-9]/g, '_'))}_${fileId}.txt`

    // Extract only plain text content for saving to the file
    const pages = htmlContent
      .split(/<!-- START OF PAGE: [^>]+ -->/)
      .map((part) => {
        if (!part.trim()) return ''
        const endMarkerIndex = part.indexOf('<!-- END OF PAGE:')
        const pagePart =
          endMarkerIndex > -1
            ? part.substring(0, endMarkerIndex).trim()
            : part.trim()

        // Convert to plain text instead of keeping HTML
        return extractPlainText(pagePart)
      })
      .filter(Boolean)
      .join('\n\n--- New Page ---\n\n')

    // Store content in memory using TextEncoder for Edge compatibility
    const encoder = new TextEncoder()
    inMemoryDb.files[fileName] = encoder.encode(pages)

    return fileName
  },

  // Generowanie pełnej dokumentacji
  generateFullDoc: (url: string): string => {
    const sitemap = inMemoryDb.sitemaps[url]
    const doc = inMemoryDb.docs[url]

    if (!sitemap || !doc) return ''

    // Extract clean text content from HTML for markdown
    let contentText = ''

    if (doc.htmlContent) {
      // Process HTML content for markdown
      const cleanContent = doc.htmlContent
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
        .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
        .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '') // Remove any remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive newlines

      contentText = cleanContent
    }

    return `# Dokumentacja dla ${url}

Wygenerowano automatycznie.

## Struktura strony

${sitemap.subpages.map((page) => `- ${page}`).join('\n')}

${contentText || doc.content}

---
Wygenerowano: ${new Date().toLocaleString()}
`
  },

  // Aktualizacja zawartości dokumentacji
  updateDocContent: async (url: string, subpage: string, html?: string) => {
    try {
      const doc = inMemoryDb.docs[url]
      if (!doc) return

      doc.content += `\n\n## Dokumentacja dla ${subpage}\n\n`

      // If HTML content is provided, extract semantic content
      if (html) {
        const semanticContent = extractSemanticContent(html)

        // Create a summary from the content - use plain text for better readability
        let summary = extractPlainText(semanticContent).trim()

        // Limit summary to first 300 characters
        if (summary.length > 300) {
          summary = summary.substring(0, 300) + '...'
        }

        doc.content += summary
        doc.htmlContent = (doc.htmlContent || '') + semanticContent
      } else {
        doc.content += `Nie udało się pobrać treści dla tej strony.`
      }
    } catch (error) {
      console.error('Error in updateDocContent:', error)
    }
  },

  // Zakończenie generowania dokumentacji
  completeDoc: async (url: string) => {
    try {
      const doc = inMemoryDb.docs[url]
      if (doc) {
        doc.status = 'completed'
      }

      // Aktualizuj tylko w pamięci
      const sitemap = inMemoryDb.sitemaps[url]
      if (sitemap) {
        sitemap.lastmod = new Date().toISOString()
      }
    } catch (error) {
      console.error('Error in completeDoc:', error)
    }
  },
}
