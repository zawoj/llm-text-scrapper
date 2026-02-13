"""Extract links from HTML content."""

from bs4 import BeautifulSoup
from typing import Set
from doc_crawler.normalizer.url_normalizer import URLNormalizer
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class LinkExtractor:
    """Extract internal links from HTML content."""
    
    def __init__(self, normalizer: URLNormalizer, ignore_paths: list[str]):
        """Initialize link extractor.
        
        Args:
            normalizer: URL normalizer instance
            ignore_paths: List of path patterns to ignore
        """
        self._normalizer = normalizer
        self._ignore_paths = ignore_paths
    
    def extract(self, html: str, base_url: str) -> Set[str]:
        """Extract internal links from HTML.
        
        Args:
            html: HTML content
            base_url: Base URL for resolving relative links
            
        Returns:
            Set of normalized internal URLs
        """
        try:
            soup = BeautifulSoup(html, 'lxml')
            links = set()
            
            # Find all anchor tags
            for anchor in soup.find_all('a', href=True):
                href = anchor['href']
                
                # Skip empty or fragment-only links
                if not href or href.startswith('#'):
                    continue
                
                # Skip mailto and tel links
                if href.startswith(('mailto:', 'tel:', 'javascript:')):
                    continue
                
                # Resolve relative URLs
                absolute_url = self._normalizer.resolve_url(base_url, href)
                
                # Check if same domain
                if not self._normalizer.is_same_domain(base_url, absolute_url):
                    continue
                
                # Normalize URL
                normalized_url = self._normalizer.normalize(absolute_url)
                
                # Check if should ignore
                if self._normalizer.should_ignore(normalized_url, self._ignore_paths):
                    continue
                
                links.add(normalized_url)
            
            logger.debug(f"Extracted {len(links)} internal links from {base_url}")
            return links
            
        except Exception as e:
            logger.error(f"Error extracting links from {base_url}: {e}")
            return set()
