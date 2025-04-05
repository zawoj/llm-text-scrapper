'use client'

import { GenerateDocButton } from './GenerateDocButton'

interface SitemapStatusProps {
  isLoading: boolean
  isScanning: boolean
  progressMessages: string[]
  currentUrl: string | null
  sitemapCompleted: boolean
  foundSubpages: string[]
}

export function SitemapStatus({
  isLoading,
  isScanning,
  progressMessages,
  currentUrl,
  sitemapCompleted,
  foundSubpages,
}: SitemapStatusProps) {
  return (
    <div className="space-y-4">
      {/* Messages and spinner for sitemap generation */}
      {isLoading && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Status generowania:</h3>

          {/* Loader during scanning */}
          {isScanning && (
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
            </div>
          )}

          {/* Lista komunikatów */}
          <div className="max-h-40 space-y-1 overflow-y-auto rounded bg-gray-50 p-2 text-sm">
            {progressMessages.length > 0 ? (
              progressMessages.map((message, index) => (
                <div key={index} className="animate-fadeIn">
                  {message}
                </div>
              ))
            ) : (
              <div className="text-gray-400">Oczekiwanie na rozpoczęcie...</div>
            )}
          </div>
        </div>
      )}

      {/* List of found subpages */}
      {sitemapCompleted && foundSubpages.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">
            Znalezione podstrony ({foundSubpages.length}):
          </h3>
          <div className="max-h-60 overflow-y-auto rounded bg-gray-50 p-2 text-sm">
            <ul className="space-y-1">
              {foundSubpages.map((subpage, index) => (
                <li
                  key={index}
                  className="truncate hover:text-clip hover:whitespace-normal"
                >
                  {subpage}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Documentation generation button (visible only after sitemap generation is complete) */}
      {sitemapCompleted && !isLoading && <GenerateDocButton url={currentUrl} />}
    </div>
  )
}
