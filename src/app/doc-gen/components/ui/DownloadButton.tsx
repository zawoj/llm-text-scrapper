"use client"

import { useState } from 'react'
import { Button } from '@/components/elements/button'
import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'

// Definiujemy lepszy typ dla danych dokumentów
interface DocumentData {
  url: string;
  subpages?: string[];
  [key: string]: unknown; // dla innych dynamicznych właściwości
}

interface DownloadButtonProps {
  data?: DocumentData;
  type: 'sitemap' | 'doc';
  documentationUrl?: string;
  customLabel?: string;
}

export function DownloadButton({ data, type, documentationUrl, customLabel }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  // Funkcja do konwersji obiektu w tekst Markdown
  const convertToMarkdown = (obj: DocumentData): string => {
    if (!obj) return ''

    let markdown = `# Dokumentacja dla ${obj.url}\n\n`
    
    // Symulacja zawartości dokumentacji
    markdown += `## Struktura strony\n\n`
    
    const paths = [
      "",
      "/about",
      "/contact",
      "/products",
      "/products/category-1",
      "/products/category-2",
      "/blog",
      "/blog/post-1",
      "/blog/post-2",
      "/docs",
      "/docs/getting-started",
      "/docs/api-reference",
    ]
    
    // Lista stron
    paths.forEach(path => {
      markdown += `- ${obj.url}${path}\n`
    })
    
    // Dodaj więcej treści
    markdown += `\n## O stronie\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi.`
    
    return markdown
  }

  // Funkcja do generowania XML sitemap
  const generateSitemapXml = (obj: DocumentData): string => {
    if (!obj) return ''
    
    const baseUrl = obj.url
    const paths = [
      "",
      "/about",
      "/contact",
      "/products",
      "/products/category-1",
      "/products/category-2",
      "/blog",
      "/blog/post-1",
      "/blog/post-2",
      "/docs",
      "/docs/getting-started",
      "/docs/api-reference",
    ]
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    paths.forEach(path => {
      xml += '  <url>\n'
      xml += `    <loc>${baseUrl}${path}</loc>\n`
      xml += '    <changefreq>monthly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    })
    
    xml += '</urlset>'
    
    return xml
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      let content = ''
      let filename = ''
      let contentType = ''
      
      if (documentationUrl) {
        // Pobierz zawartość z URL
        const response = await fetch(documentationUrl)
        content = await response.text()
        filename = `dokumentacja-${Date.now()}.md`
        contentType = 'text/markdown;charset=utf-8'
      } else if (data) {
        // Używamy przekazanych danych
        if (type === 'doc') {
          content = convertToMarkdown(data)
          filename = `dokumentacja-${Date.now()}.md`
          contentType = 'text/markdown;charset=utf-8'
        } else {
          content = generateSitemapXml(data)
          filename = `sitemap-${Date.now()}.xml`
          contentType = 'application/xml;charset=utf-8'
        }
      }
      
      const blob = new Blob([content], { type: contentType })
      saveAs(blob, filename)
      
      setIsDownloading(false)
    } catch (error) {
      console.error('Błąd podczas pobierania:', error)
      alert('Wystąpił błąd podczas pobierania pliku.')
      setIsDownloading(false)
    }
  }

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isDownloading}
      className="mt-2"
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading 
        ? 'Pobieranie...' 
        : customLabel || (type === 'doc' 
          ? 'Pobierz dokumentację (.md)' 
          : 'Pobierz sitemap (.xml)')
      }
    </Button>
  )
}
