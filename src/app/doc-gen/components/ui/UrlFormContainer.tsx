'use client'

import { useSitemapStream } from './useSitemapStream'
import { SitemapForm } from './SitemapForm'
import { SitemapStatus } from './SitemapStatus'

export function UrlFormContainer() {
  const {
    isLoading,
    isScanning,
    progressMessages,
    currentUrl,
    foundSubpages,
    sitemapCompleted,
    submitUrl,
  } = useSitemapStream()

  return (
    <div className="space-y-6">
      <SitemapForm isLoading={isLoading} onSubmit={submitUrl} />

      <SitemapStatus
        isLoading={isLoading}
        isScanning={isScanning}
        progressMessages={progressMessages}
        currentUrl={currentUrl}
        sitemapCompleted={sitemapCompleted}
        foundSubpages={foundSubpages}
      />
    </div>
  )
}
