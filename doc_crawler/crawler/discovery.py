"""Discovery mechanisms for finding URLs to crawl."""

import asyncio
from typing import Set, Optional
from urllib.parse import urljoin
import xml.etree.ElementTree as ET
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class Discovery:
    """Discover URLs through various mechanisms."""
    
    @staticmethod
    async def discover_sitemap(base_url: str, fetch_func) -> Set[str]:
        """Discover URLs from sitemap.xml.
        
        Args:
            base_url: Base URL of the site
            fetch_func: Async function to fetch HTML content
            
        Returns:
            Set of discovered URLs
        """
        sitemap_url = urljoin(base_url, '/sitemap.xml')
        urls = set()
        
        try:
            logger.info(f"Checking for sitemap at {sitemap_url}")
            html = await fetch_func(sitemap_url)
            
            if not html:
                logger.info(f"No sitemap found at {sitemap_url}")
                return urls
            
            # Parse XML
            root = ET.fromstring(html)
            
            # Handle different sitemap namespaces
            namespaces = {
                'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9',
                'xhtml': 'http://www.w3.org/1999/xhtml'
            }
            
            # Find all <loc> tags
            for loc in root.findall('.//sm:loc', namespaces):
                if loc.text:
                    urls.add(loc.text.strip())
            
            # Also try without namespace (some sitemaps don't use it)
            if not urls:
                for loc in root.findall('.//loc'):
                    if loc.text:
                        urls.add(loc.text.strip())
            
            logger.info(f"Discovered {len(urls)} URLs from sitemap")
            
        except ET.ParseError as e:
            logger.warning(f"Failed to parse sitemap: {e}")
        except Exception as e:
            logger.error(f"Error discovering sitemap: {e}")
        
        return urls
    
    @staticmethod
    async def discover_robots_txt(base_url: str, fetch_func) -> Set[str]:
        """Discover sitemap URLs from robots.txt.
        
        Args:
            base_url: Base URL of the site
            fetch_func: Async function to fetch HTML content
            
        Returns:
            Set of sitemap URLs
        """
        robots_url = urljoin(base_url, '/robots.txt')
        sitemap_urls = set()
        
        try:
            logger.info(f"Checking robots.txt at {robots_url}")
            content = await fetch_func(robots_url)
            
            if not content:
                return sitemap_urls
            
            # Parse robots.txt for Sitemap entries
            for line in content.split('\n'):
                line = line.strip()
                if line.lower().startswith('sitemap:'):
                    sitemap_url = line.split(':', 1)[1].strip()
                    sitemap_urls.add(sitemap_url)
            
            if sitemap_urls:
                logger.info(f"Found {len(sitemap_urls)} sitemap(s) in robots.txt")
            
        except Exception as e:
            logger.error(f"Error reading robots.txt: {e}")
        
        return sitemap_urls
