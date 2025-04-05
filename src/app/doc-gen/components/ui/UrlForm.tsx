"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/elements/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/elements/form'
import { Input } from '@/components/elements/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSitemapGenMutation } from '@/hooks/doc-gen/query'
import { sitemapGeneratorInputSchema } from '@/hooks/doc-gen/schema'
import { z } from 'zod'
import { ProgressIndicator } from './ProgressIndicator'
import { SitemapModal } from './SitemapModal'
import { GenerateDocButton } from './GenerateDocButton'

export function UrlForm() {
  const [showModal, setShowModal] = useState(false)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const [progressValue, setProgressValue] = useState<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [foundSubpages, setFoundSubpages] = useState<string[]>([])
  const [sitemapCompleted, setSitemapCompleted] = useState(false)

  // Używamy tylko schematu dla sitemap
  const formSchema = sitemapGeneratorInputSchema
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
        
        // Zapisujemy znalezione podstrony
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
        
        // Oznacz, że generowanie sitemap zostało zakończone
        setSitemapCompleted(true);
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
  const startStreaming = (url: string) => {
    setIsStreaming(true);
    setProgressValue(null);
    setProgressMessages([`Inicjalizacja generowania sitemap...`]);
    
    // Tworzenie EventSource dla endpointu sitemap-progress
    const encodedUrl = encodeURIComponent(url);
    const endpoint = `/api/doc-gen/sitemap-progress/${encodedUrl}`;
    
    console.log(`Rozpoczęcie streamowania z ${endpoint}`);
    const eventSource = new EventSource(endpoint);
    
    eventSource.onmessage = handleSseEvent;
    
    eventSource.onerror = (event: Event) => {
      console.error('Błąd SSE:', event);
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
      cleanup = startStreaming(currentUrl);
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [isStreaming, currentUrl]);

  // Hook mutacji do generowania sitemap
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

  const isLoading = sitemapMutation.isPending || isStreaming;

  const onSubmit = (data: FormData) => {
    setFoundSubpages([]);
    setSitemapCompleted(false);
    sitemapMutation.mutate(data);
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
                    {isLoading ? 'Generowanie...' : 'Generuj sitemap'}
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

      {/* Przycisk generowania dokumentacji (widoczny tylko po zakończeniu generowania sitemap) */}
      {sitemapCompleted && !isLoading && progressValue === 100 && (
        <GenerateDocButton url={currentUrl} />
      )}

      {/* Modal z sitemap po zakończeniu generowania */}
      {showModal && foundSubpages.length > 0 && (
        <SitemapModal
          data={{ url: currentUrl, subpages: foundSubpages }}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
