'use client'

import { useState, useEffect, useRef } from 'react'
import { useSitemapGenMutation } from '@/hooks/doc-gen/query'
import { z } from 'zod'
import { sitemapGeneratorInputSchema } from '@/hooks/doc-gen/schema'

type FormData = z.infer<typeof sitemapGeneratorInputSchema>

export function useSitemapStream() {
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [foundSubpages, setFoundSubpages] = useState<string[]>([])
  const [sitemapCompleted, setSitemapCompleted] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Function to handle SSE events
  const handleSseEvent = (event: MessageEvent) => {
    try {
      const parsedData = JSON.parse(event.data)

      if (parsedData.event === 'update') {
        // Update scanning status
        setIsScanning(parsedData.data.isScanning)
        setProgressMessages((prev) => [...prev, parsedData.data.message])

        // Save found subpages
        if (parsedData.data.subpages) {
          setFoundSubpages(parsedData.data.subpages)
        }
      } else if (parsedData.event === 'complete') {
        // Process completion
        setIsScanning(false)
        setProgressMessages((prev) => [...prev, parsedData.data.message])
        setIsStreaming(false)

        if (parsedData.data.subpages) {
          setFoundSubpages(parsedData.data.subpages)
        }

        // Mark sitemap generation as completed
        setSitemapCompleted(true)

        // Close connection gracefully
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      } else if (parsedData.event === 'error') {
        // Error handling
        setProgressMessages((prev) => [
          ...prev,
          `Błąd: ${parsedData.data.message}`,
        ])
        setIsStreaming(false)
        setIsScanning(false)

        // Close connection on error
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania danych SSE:', error)
    }
  }

  // Function to start data streaming
  const startStreaming = (url: string) => {
    // If there's an existing connection, close it
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsStreaming(true)
    setIsScanning(true)
    setProgressMessages([`Inicjalizacja generowania sitemap...`])

    // Create EventSource for sitemap-progress endpoint
    const encodedUrl = encodeURIComponent(url)
    const endpoint = `/api/doc-gen/sitemap-progress/${encodedUrl}`

    console.log(`Rozpoczęcie streamowania z ${endpoint}`)
    const eventSource = new EventSource(endpoint)
    eventSourceRef.current = eventSource

    eventSource.onmessage = handleSseEvent

    eventSource.onerror = (event: Event) => {
      // Check if the connection was closed normally (after completion)
      if (sitemapCompleted) {
        // This is a normal closure after successful completion, no need for error message
        console.log('SSE connection closed after completion')
      } else {
        console.error('Błąd SSE:', event)
        setProgressMessages((prev) => [
          ...prev,
          'Wystąpił błąd podczas komunikacji z serwerem',
        ])
        setIsStreaming(false)
        setIsScanning(false)
      }

      // Always close the connection on error
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  // Hook to manage EventSource resources
  useEffect(() => {
    if (isStreaming && currentUrl) {
      startStreaming(currentUrl)
    }
  }, [isStreaming, currentUrl])

  // Sitemap mutation hook
  const sitemapMutation = useSitemapGenMutation({
    onSuccess: (data) => {
      setCurrentUrl(data.data.url)
      // Start streaming after receiving confirmation from the server
      setIsStreaming(true)
    },
    onError: (error) => {
      alert(error.message)
      setProgressMessages([])
      setIsScanning(false)
    },
  })

  const resetState = () => {
    setFoundSubpages([])
    setSitemapCompleted(false)
  }

  const submitUrl = (data: FormData) => {
    resetState()
    sitemapMutation.mutate(data)
  }

  const isLoading = sitemapMutation.isPending || isStreaming

  return {
    isLoading,
    isScanning,
    progressMessages,
    currentUrl,
    foundSubpages,
    sitemapCompleted,
    submitUrl,
  }
}
