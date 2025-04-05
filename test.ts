// Deno imports
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import { ensureDir } from 'https://deno.land/std@0.208.0/fs/mod.ts';

interface UrlData {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

class SitemapGenerator {
  private baseUrl: string;
  private maxUrls: number;
  private urlsVisited: Set<string>;
  private urlsToVisit: string[];
  private excludedPaths: string[];
  private urlsData: UrlData[];

  constructor(baseUrl: string, excludedPaths: string[] = [], maxUrls: number = 5000) {
    this.baseUrl = baseUrl;
    this.maxUrls = maxUrls;
    this.urlsVisited = new Set();
    this.urlsToVisit = [baseUrl];
    this.excludedPaths = excludedPaths;
    this.urlsData = [];
  }

  private shouldCrawl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const baseHostname = new URL(this.baseUrl).hostname;

      // Sprawdź czy URL jest z tej samej domeny
      if (parsedUrl.hostname !== baseHostname) {
        return false;
      }

      // Sprawdź czy URL nie zawiera wykluczonych ścieżek
      if (this.excludedPaths.some(path => url.includes(path))) {
        return false;
      }

      // Sprawdź rozszerzenie pliku - pomijamy pliki statyczne
      const pathLower = parsedUrl.pathname.toLowerCase();
      const excludedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar'];
      if (excludedExtensions.some(ext => pathLower.endsWith(ext))) {
        return false;
      }

      return true;
    } catch (e) {
      console.error(`Błąd podczas przetwarzania URL: ${url}`, e);
      return false;
    }
  }

  private async extractLinks(url: string): Promise<string[]> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc) return [];
      
      const links: string[] = [];

      const anchors = doc.querySelectorAll('a[href]');
      anchors.forEach((element) => {
        const href = element.getAttribute('href');
        if (!href) return;

        try {
          // Przekształć względny URL do absolutnego
          let absoluteUrl = new URL(href, url).href;
          
          // Usuń fragmenty URL (#)
          absoluteUrl = absoluteUrl.split('#')[0];

          if (this.shouldCrawl(absoluteUrl) && !this.urlsVisited.has(absoluteUrl)) {
            links.push(absoluteUrl);
          }
        } catch (e) {
          console.error(`Nieprawidłowy URL: ${href}`, e);
        }
      });

      return links;
    } catch (e) {
      console.error(`Błąd podczas przetwarzania ${url}:`, e);
      return [];
    }
  }

  private async getLastModified(url: string): Promise<string> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000) 
      });
      const lastModified = response.headers.get('last-modified');
      if (lastModified) {
        return lastModified;
      }
    } catch (e) {
      // Cicha obsługa błędów
    }
    return new Date().toISOString().split('T')[0];
  }

  public async crawl(): Promise<void> {
    while (this.urlsToVisit.length > 0 && this.urlsVisited.size < this.maxUrls) {
      const currentUrl = this.urlsToVisit.shift();
      if (!currentUrl || this.urlsVisited.has(currentUrl)) {
        continue;
      }

      console.log(`Przetwarzanie: ${currentUrl}`);
      this.urlsVisited.add(currentUrl);

      // Dodaj informacje o URL do listy
      this.urlsData.push({
        loc: currentUrl,
        lastmod: await this.getLastModified(currentUrl),
        changefreq: 'weekly',
        priority: '0.7'
      });

      // Znajdź wszystkie linki na stronie
      const newLinks = await this.extractLinks(currentUrl);

      // Dodaj nowe linki do kolejki
      for (const link of newLinks) {
        if (!this.urlsVisited.has(link) && !this.urlsToVisit.includes(link)) {
          this.urlsToVisit.push(link);
        }
      }

      // Dodaj małe opóźnienie, aby nie przeciążać serwera
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  public async generateSitemap(filename: string = 'sitemap.xml'): Promise<void> {
    // Stwórz zawartość XML
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Dodaj każdy URL do pliku sitemap
    for (const urlData of this.urlsData) {
      xmlContent += '  <url>\n';
      xmlContent += `    <loc>${urlData.loc}</loc>\n`;
      xmlContent += `    <lastmod>${urlData.lastmod}</lastmod>\n`;
      xmlContent += `    <changefreq>${urlData.changefreq}</changefreq>\n`;
      xmlContent += `    <priority>${urlData.priority}</priority>\n`;
      xmlContent += '  </url>\n';
    }

    xmlContent += '</urlset>';

    // Ensure directory exists and save file
    const dir = filename.substring(0, filename.lastIndexOf('/'));
    if (dir) await ensureDir(dir);
    await Deno.writeTextFile(filename, xmlContent);
    console.log(`Wygenerowano sitemap z ${this.urlsData.length} URL-ami i zapisano jako ${filename}`);
  }
}

// Przykład użycia
async function main() {
  const baseUrl = "https://hono.dev";
  const excluded = ['/login', '/setup', '/admin', '/secure'];
  
  const generator = new SitemapGenerator(baseUrl, excluded);
  await generator.crawl();
  await generator.generateSitemap();
}

main().catch(console.error);