"""Page fetching with Playwright."""

import asyncio
from typing import Optional
from playwright.async_api import Browser, TimeoutError as PlaywrightTimeoutError
from doc_crawler.fetcher.browser_pool import BrowserPool
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class PageFetcher:
    """Fetch web pages using Playwright with retry logic."""
    
    def __init__(
        self,
        browser_pool: BrowserPool,
        timeout: int = 30000,
        max_retries: int = 3,
        rate_limit: float = 1.0
    ):
        """Initialize page fetcher.
        
        Args:
            browser_pool: Browser pool instance
            timeout: Page load timeout in milliseconds
            max_retries: Maximum number of retries
            rate_limit: Seconds to wait between requests
        """
        self._browser_pool = browser_pool
        self._timeout = timeout
        self._max_retries = max_retries
        self._rate_limit = rate_limit
        self._last_request_time = 0.0
    
    async def fetch(self, url: str) -> Optional[str]:
        """Fetch a page and return its HTML content.
        
        Args:
            url: URL to fetch
            
        Returns:
            HTML content or None if failed
        """
        for attempt in range(self._max_retries):
            try:
                # Rate limiting
                await self._apply_rate_limit()
                
                # Get browser and create page
                browser = await self._browser_pool.get_browser()
                page = await browser.new_page()
                
                try:
                    # Navigate to URL
                    response = await page.goto(url, timeout=self._timeout, wait_until='domcontentloaded')
                    
                    if response and response.status >= 400:
                        logger.warning(f"HTTP {response.status} for {url}")
                        if response.status >= 500 and attempt < self._max_retries - 1:
                            await asyncio.sleep(2 ** attempt)  # Exponential backoff
                            continue
                        return None
                    
                    # Get HTML content
                    html = await page.content()
                    logger.info(f"Fetched {url}")
                    return html
                    
                finally:
                    await page.close()
                    
            except PlaywrightTimeoutError:
                logger.warning(f"Timeout fetching {url} (attempt {attempt + 1}/{self._max_retries})")
                if attempt < self._max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
                if attempt < self._max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
        
        logger.error(f"Failed to fetch {url} after {self._max_retries} attempts")
        return None
    
    async def _apply_rate_limit(self) -> None:
        """Apply rate limiting between requests."""
        if self._rate_limit > 0:
            now = asyncio.get_event_loop().time()
            elapsed = now - self._last_request_time
            
            if elapsed < self._rate_limit:
                await asyncio.sleep(self._rate_limit - elapsed)
            
            self._last_request_time = asyncio.get_event_loop().time()
