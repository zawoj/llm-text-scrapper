"""Extract main content from HTML and convert to Markdown."""

from bs4 import BeautifulSoup
from markdownify import markdownify as md
from typing import Optional
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class ContentExtractor:
    """Extract and convert documentation content from HTML to Markdown."""
    
    # Tags to remove completely
    REMOVE_TAGS = ['nav', 'footer', 'aside', 'script', 'style', 'iframe', 'noscript']
    
    # Selectors to try for main content (in order)
    CONTENT_SELECTORS = [
        'main',
        'article',
        '[role="main"]',
        '.documentation',
        '.docs-content',
        '.content',
        '#content',
        '.markdown-body',
    ]
    
    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract main content from HTML and convert to Markdown.
        
        Args:
            html: HTML content
            url: Source URL (for logging)
            
        Returns:
            Markdown content or None if extraction failed
        """
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Remove unwanted tags
            for tag in self.REMOVE_TAGS:
                for element in soup.find_all(tag):
                    element.decompose()
            
            # Try to find main content
            content = self._find_main_content(soup)
            
            if not content:
                logger.warning(f"Could not find main content for {url}, using body")
                content = soup.find('body')
            
            if not content:
                logger.error(f"No content found for {url}")
                return None
            
            # Convert to markdown
            markdown = md(
                str(content),
                heading_style="ATX",
                bullets="-",
                code_language="",
                escape_asterisks=False,
                escape_underscores=False,
            )
            
            return markdown.strip()
            
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {e}")
            return None
    
    def _find_main_content(self, soup: BeautifulSoup) -> Optional[BeautifulSoup]:
        """Find the main content element using various selectors.
        
        Args:
            soup: BeautifulSoup object
            
        Returns:
            Main content element or None
        """
        for selector in self.CONTENT_SELECTORS:
            content = soup.select_one(selector)
            if content:
                logger.debug(f"Found content using selector: {selector}")
                return content
        
        return None
