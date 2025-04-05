'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/elements/button'
import { useDocGenMutation } from '@/hooks/doc-gen/query'
import { ProgressIndicator } from './ProgressIndicator'
import { DownloadButton } from './DownloadButton'

type GenerateDocButtonProps = {
  url: string | null
}

export function GenerateDocButton({ url }: GenerateDocButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const [progressValue, setProgressValue] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number | null>(null)
  const [documentationUrl, setDocumentationUrl] = useState<string | null>(null)
  const [htmlFileUrl, setHtmlFileUrl] = useState<string | null>(null)
  const [isStreamingDoc, setIsStreamingDoc] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const docCompletedRef = useRef(false)

  // Funkcja do obsługi eventu SSE dla dokumentacji
  const handleDocSseEvent = (event: MessageEvent) => {
    try {
      const parsedData = JSON.parse(event.data)

      if (parsedData.event === 'update') {
        // Aktualizacja postępu
        setProgressValue(parsedData.data.progress)
        if (parsedData.data.totalPages) {
          setTotalPages(parsedData.data.totalPages)
        }
        if (parsedData.data.currentPage) {
          setCurrentPage(parsedData.data.currentPage)
        }
        setProgressMessages((prev) => [...prev, parsedData.data.message])
      } else if (parsedData.event === 'complete') {
        // Zakończenie procesu
        setProgressValue(100)
        setCurrentPage(parsedData.data.totalPages)
        setProgressMessages((prev) => [...prev, parsedData.data.message])
        setIsStreamingDoc(false)
        docCompletedRef.current = true

        if (parsedData.data.documentationUrl) {
          setDocumentationUrl(parsedData.data.documentationUrl)
        }

        if (parsedData.data.htmlFileUrl) {
          setHtmlFileUrl(parsedData.data.htmlFileUrl)
        }

        // Close connection gracefully
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      } else if (parsedData.event === 'error') {
        // Obsługa błędu
        setProgressMessages((prev) => [
          ...prev,
          `Błąd: ${parsedData.data.message}`,
        ])
        setIsStreamingDoc(false)

        // Close connection on error
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }
    } catch (error) {
      console.error(
        'Błąd podczas przetwarzania danych SSE dokumentacji:',
        error
      )
    }
  }

  // Funkcja rozpoczynająca streamowanie danych dla dokumentacji
  const startDocStreaming = (url: string) => {
    // Close any existing connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsStreamingDoc(true)
    setProgressValue(null)
    setProgressMessages([`Inicjalizacja generowania dokumentacji...`])
    docCompletedRef.current = false

    // Tworzenie EventSource dla endpointu doc-progress
    const encodedUrl = encodeURIComponent(url)
    const endpoint = `/api/doc-gen/doc-progress/${encodedUrl}`

    console.log(`Rozpoczęcie streamowania dokumentacji z ${endpoint}`)
    const eventSource = new EventSource(endpoint)
    eventSourceRef.current = eventSource

    eventSource.onmessage = handleDocSseEvent

    eventSource.onerror = (event: Event) => {
      // Check if connection was closed after successful completion
      if (docCompletedRef.current) {
        console.log('SSE dokumentacji zakończone pomyślnie')
      } else {
        console.error('Błąd SSE dokumentacji:', event)
        setProgressMessages((prev) => [
          ...prev,
          'Wystąpił błąd podczas generowania dokumentacji',
        ])
        setIsStreamingDoc(false)
      }

      // Always close the connection on error
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  // Hook mutacji do generowania dokumentacji
  const docMutation = useDocGenMutation({
    onSuccess: () => {
      // Rozpoczęcie streamowania postępu generowania dokumentacji
      if (url) {
        startDocStreaming(url)
        setIsGenerating(true)
      }
    },
    onError: (error) => {
      alert(error.message)
      setProgressMessages([])
      setProgressValue(null)
      setIsGenerating(false)
    },
  })

  const handleGenerateDoc = () => {
    if (!url) return

    setProgressMessages([])
    setProgressValue(null)
    setDocumentationUrl(null)
    setHtmlFileUrl(null)

    docMutation.mutate({ url })
  }

  const isLoading = docMutation.isPending || isStreamingDoc

  return (
    <div className="mt-6 space-y-4">
      {!isGenerating ? (
        <Button
          onClick={handleGenerateDoc}
          disabled={isLoading || !url}
          size="lg"
          className="w-full"
        >
          {isLoading ? 'Generowanie...' : 'Wygeneruj dokumentację'}
        </Button>
      ) : (
        <div className="space-y-4">
          {/* Wskaźnik postępu dokumentacji */}
          {(isLoading || progressValue === 100) && (
            <ProgressIndicator
              messages={progressMessages}
              progressValue={progressValue}
              totalPages={totalPages}
              currentPage={currentPage}
            />
          )}

          {/* Przyciski pobierania */}
          {documentationUrl && progressValue === 100 && (
            <div className="space-y-2">
              <DownloadButton documentationUrl={documentationUrl} type="doc" />
              {htmlFileUrl && (
                <DownloadButton
                  documentationUrl={htmlFileUrl}
                  type="doc"
                  customLabel="Pobierz HTML (.txt)"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
