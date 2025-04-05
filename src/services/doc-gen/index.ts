import { delay } from './utils/common'
import { documentUtils } from './utils/document'
import { fileUtils } from './utils/file'
import { sitemapUtils } from './utils/sitemap'

// Eksportujemy delay dla zgodności z poprzednią wersją
export { delay }

// Serwisy dla doc-gen
export const docGenService = {
  // ==================== Sitemap Services ====================
  initSitemap: sitemapUtils.initSitemap,
  getSitemap: sitemapUtils.getSitemap,
  shouldCrawl: sitemapUtils.shouldCrawl,
  extractLinks: sitemapUtils.extractLinks,
  getLastModified: sitemapUtils.getLastModified,
  updateSitemapProgress: sitemapUtils.updateSitemapProgress,
  addSubpageToSitemap: sitemapUtils.addSubpageToSitemap,
  generateSitemapPaths: sitemapUtils.generateSitemapPaths,
  generateSitemapXml: sitemapUtils.generateSitemapXml,
  hasSitemapCompleted: sitemapUtils.hasSitemapCompleted,
  completeSitemap: sitemapUtils.completeSitemap,

  // ==================== Document Services ====================
  initDoc: documentUtils.initDoc,
  getDoc: documentUtils.getDoc,
  fetchHtmlContent: documentUtils.fetchHtmlContent,
  fetchAllSubpagesHtml: documentUtils.fetchAllSubpagesHtml,
  saveHtmlToFile: documentUtils.saveHtmlToFile,
  generateFullDoc: documentUtils.generateFullDoc,
  updateDocContent: documentUtils.updateDocContent,
  completeDoc: documentUtils.completeDoc,

  // ==================== File Services ====================
  getFileContent: fileUtils.getFileContent,
}
