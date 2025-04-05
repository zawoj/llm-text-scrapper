"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/elements/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/elements/form'
import { Input } from '@/components/elements/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSitemapGenMutation, useDocGenMutation } from '@/hooks/doc-gen/query'
import { sitemapGeneratorInputSchema, docGenInputSchema } from '@/hooks/doc-gen/schema'
import { z } from 'zod'
import { ProgressIndicator } from './ProgressIndicator'
import { SitemapModal } from './SitemapModal'
import { DownloadButton } from './DownloadButton'

type UrlFormProps = {
  type: 'sitemap' | 'doc'
}

export function UrlForm({ type }: UrlFormProps) {
  const [showModal, setShowModal] = useState(false)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const [progressValue, setProgressValue] = useState<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [foundSubpages, setFoundSubpages] = useState<string[]>([])
  const [documentationUrl, setDocumentationUrl] = useState<string | null>(null)
  const [htmlFileUrl, setHtmlFileUrl] = useState<string | null>(null)

  // Wybierz odpowiedni schemat w zależności od typu
  const formSchema = type === 'sitemap' ? sitemapGeneratorInputSchema : docGenInputSchema
  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  })

  // Funkcja do obsługi eventu SSE
  const handleSseEvent = (event: MessageEvent) => {
    try {
      const parsedData = JSON.parse(event.data);
      
      if (parsedData.event === 'update') {
        // Aktualizacja postępu
        setProgressValue(parsedData.data.progress);
        setProgressMessages(prev => [...prev, parsedData.data.message]);
        
        // Dla sitemap zapisujemy znalezione podstrony
        if (parsedData.data.subpages) {
          setFoundSubpages(parsedData.data.subpages);
        }
      } 
      else if (parsedData.event === 'complete') {
        // Zakończenie procesu
        setProgressValue(100);
        setProgressMessages(prev => [...prev, parsedData.data.message]);
        setIsStreaming(false);
        
        if (parsedData.data.subpages) {
          setFoundSubpages(parsedData.data.subpages);
          setShowModal(true);
        }
        
        if (parsedData.data.documentationUrl) {
          setDocumentationUrl(parsedData.data.documentationUrl);
        }

        if (parsedData.data.htmlFileUrl) {
          setHtmlFileUrl(parsedData.data.htmlFileUrl);
        }
      }
      else if (parsedData.event === 'error') {
        // Obsługa błędu
        setProgressMessages(prev => [...prev, `Błąd: ${parsedData.data.message}`]);
        setIsStreaming(false);
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania danych SSE:', error);
    }
  };

  // Funkcja do rozpoczęcia streamowania danych
  const startStreaming = (url: string, streamType: 'sitemap' | 'doc') => {
    setIsStreaming(true);
    setProgressValue(null);
    setProgressMessages([`Inicjalizacja ${streamType === 'sitemap' ? 'generowania sitemap' : 'generowania dokumentacji'}...`]);
    
    // Tworzenie EventSource dla odpowiedniego endpointu
    const encodedUrl = encodeURIComponent(url);
    const endpoint = streamType === 'sitemap' 
      ? `/api/doc-gen/sitemap-progress/${encodedUrl}`
      : `/api/doc-gen/doc-progress/${encodedUrl}`;
    
    console.log(`Rozpoczęcie streamowania z ${endpoint}`);
    const eventSource = new EventSource(endpoint);
    
    eventSource.onmessage = handleSseEvent;
    
    eventSource.onerror = (error) => {
      console.error('Błąd SSE:', error);
      setProgressMessages(prev => [...prev, 'Wystąpił błąd podczas komunikacji z serwerem']);
      setIsStreaming(false);
      eventSource.close();
    };
    
    // Funkcja czyszcząca
    return () => {
      eventSource.close();
    };
  };

  // Hook do zarządzania zasobami EventSource
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (isStreaming && currentUrl) {
      cleanup = startStreaming(currentUrl, type);
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [isStreaming, currentUrl, type]);

  // Hooki mutacji do inicjowania procesów
  const sitemapMutation = useSitemapGenMutation({
    onSuccess: (data) => {
      setCurrentUrl(data.data.url);
      // Rozpoczęcie streamowania po otrzymaniu potwierdzenia z serwera
      setIsStreaming(true);
    },
    onError: (error) => {
      alert(error.message);
      setProgressMessages([]);
      setProgressValue(null);
    },
  });

  const docMutation = useDocGenMutation({
    onSuccess: (data) => {
      setCurrentUrl(data.data.url);
      // Rozpoczęcie streamowania po otrzymaniu potwierdzenia z serwera
      setIsStreaming(true);
    },
    onError: (error) => {
      alert(error.message);
      setProgressMessages([]);
      setProgressValue(null);
    },
  });

  const mutation = type === 'sitemap' ? sitemapMutation : docMutation;
  const isLoading = mutation.isPending || isStreaming;

  const onSubmit = (data: FormData) => {
    setDocumentationUrl(null);
    setHtmlFileUrl(null);
    setFoundSubpages([]);
    mutation.mutate(data);
  };

  // Obsługa potwierdzenia z modalu sitemap
  const handleSitemapConfirm = () => {
    setShowModal(false);
    
    // Jeśli zaakceptowano sitemap, automatycznie rozpoczynamy generowanie dokumentacji
    if (currentUrl) {
      setProgressMessages([`Rozpoczęcie generowania dokumentacji dla ${currentUrl}...`]);
      docMutation.mutate({ url: currentUrl });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres URL strony</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Generowanie...' : type === 'sitemap' ? 'Generuj sitemap' : 'Generuj dokumentację'}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Wskaźnik postępu */}
      {(isLoading || progressValue === 100) && (
        <ProgressIndicator 
          messages={progressMessages}
          progressValue={progressValue}
        />
      )}

      {/* Przycisk pobierania dokumentacji (widoczny tylko po zakończeniu generowania dokumentacji) */}
      {documentationUrl && progressValue === 100 && (
        <div className="space-y-2">
          <DownloadButton 
            documentationUrl={documentationUrl} 
            type="doc"
          />
          {htmlFileUrl && (
            <DownloadButton 
              documentationUrl={htmlFileUrl} 
              type="doc"
              customLabel="Pobierz HTML (.txt)"
            />
          )}
        </div>
      )}

      {/* Modal z sitemap (tylko dla typu sitemap i po zakończeniu generowania) */}
      {showModal && foundSubpages.length > 0 && (
        <SitemapModal
          data={{ url: currentUrl, subpages: foundSubpages }}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleSitemapConfirm}
        />
      )}
    </div>
  )
}
