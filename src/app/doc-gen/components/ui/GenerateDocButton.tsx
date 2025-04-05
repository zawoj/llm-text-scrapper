"use client"

import { useState } from 'react'
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
  const [documentationUrl, setDocumentationUrl] = useState<string | null>(null)
  const [htmlFileUrl, setHtmlFileUrl] = useState<string | null>(null)
  const [isStreamingDoc, setIsStreamingDoc] = useState(false)

  // Funkcja do obsługi eventu SSE dla dokumentacji
  const handleDocSseEvent = (event: MessageEvent) => {
    try {
      const parsedData = JSON.parse(event.data);
      
      if (parsedData.event === 'update') {
        // Aktualizacja postępu
        setProgressValue(parsedData.data.progress);
        setProgressMessages(prev => [...prev, parsedData.data.message]);
      } 
      else if (parsedData.event === 'complete') {
        // Zakończenie procesu
        setProgressValue(100);
        setProgressMessages(prev => [...prev, parsedData.data.message]);
        setIsStreamingDoc(false);
        
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
        setIsStreamingDoc(false);
      }
    } catch (error) {
      console.error('Błąd podczas przetwarzania danych SSE dokumentacji:', error);
    }
  };

  // Funkcja rozpoczynająca streamowanie danych dla dokumentacji
  const startDocStreaming = (url: string) => {
    setIsStreamingDoc(true);
    setProgressValue(null);
    setProgressMessages([`Inicjalizacja generowania dokumentacji...`]);
    
    // Tworzenie EventSource dla endpointu doc-progress
    const encodedUrl = encodeURIComponent(url);
    const endpoint = `/api/doc-gen/doc-progress/${encodedUrl}`;
    
    console.log(`Rozpoczęcie streamowania dokumentacji z ${endpoint}`);
    const eventSource = new EventSource(endpoint);
    
    eventSource.onmessage = handleDocSseEvent;
    
    eventSource.onerror = (event: Event) => {
      console.error('Błąd SSE dokumentacji:', event);
      setProgressMessages(prev => [...prev, 'Wystąpił błąd podczas generowania dokumentacji']);
      setIsStreamingDoc(false);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  };

  // Hook mutacji do generowania dokumentacji
  const docMutation = useDocGenMutation({
    onSuccess: () => {
      // Rozpoczęcie streamowania postępu generowania dokumentacji
      if (url) {
        const cleanup = startDocStreaming(url);
        setIsGenerating(true);
        
        // Zwracamy funkcję czyszczącą
        return () => cleanup();
      }
    },
    onError: (error) => {
      alert(error.message);
      setProgressMessages([]);
      setProgressValue(null);
      setIsGenerating(false);
    },
  });

  const handleGenerateDoc = () => {
    if (!url) return;
    
    setProgressMessages([]);
    setProgressValue(null);
    setDocumentationUrl(null);
    setHtmlFileUrl(null);
    
    docMutation.mutate({ url });
  };

  const isLoading = docMutation.isPending || isStreamingDoc;

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
            />
          )}
          
          {/* Przyciski pobierania */}
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
        </div>
      )}
    </div>
  )
} 