"use client"

import { Button } from '@/components/elements/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/elements/dialog'

type SitemapModalProps = {
  data: {
    url?: string | null;
    subpages?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SitemapModal({ data, isOpen, onClose, onConfirm }: SitemapModalProps) {
  // Funkcja do formatowania sitemapy w bardziej czytelny sposób
  const formatSitemap = (data: SitemapModalProps['data']): string => {
    if (!data || !data.url || !data.subpages || data.subpages.length === 0) {
      return "Nie znaleziono żadnych stron.";
    }
    
    // Sortuj podstrony według długości ścieżki (najpierw główna strona, potem podstrony)
    const sortedSubpages = [...data.subpages].sort((a, b) => {
      const aDepth = (a.match(/\//g) || []).length;
      const bDepth = (b.match(/\//g) || []).length;
      return aDepth - bDepth || a.localeCompare(b);
    });
    
    return sortedSubpages.join('\n');
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wygenerowany Sitemap</DialogTitle>
          <DialogDescription>
            Poniżej znajduje się wygenerowany sitemap dla strony {data?.url}. 
            Znaleziono {data?.subpages?.length || 0} stron.
            Czy chcesz kontynuować i wygenerować dokumentację na podstawie znalezionych stron?
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 max-h-96 overflow-y-auto rounded-md bg-gray-50 p-4">
          <pre className="whitespace-pre-wrap text-sm">
            {formatSitemap(data)}
          </pre>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={onConfirm}>
            Generuj dokumentację
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
