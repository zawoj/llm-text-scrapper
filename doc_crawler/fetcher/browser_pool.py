"""Browser pool management for Playwright."""

import asyncio
from typing import Optional
from playwright.async_api import async_playwright, Browser, Playwright
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class BrowserPool:
    """Manage browser instances with automatic restart."""
    
    def __init__(self, restart_every: int = 50):
        """Initialize browser pool.
        
        Args:
            restart_every: Restart browser after this many pages
        """
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._restart_every = restart_every
        self._page_count = 0
        self._lock = asyncio.Lock()
    
    async def start(self) -> None:
        """Start the browser pool."""
        async with self._lock:
            if self._playwright is None:
                self._playwright = await async_playwright().start()
                logger.info("Playwright started")
            
            if self._browser is None:
                await self._start_browser()
    
    async def _start_browser(self) -> None:
        """Start a new browser instance."""
        if self._browser:
            await self._browser.close()
        
        self._browser = await self._playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        self._page_count = 0
        logger.info("Browser started")
    
    async def get_browser(self) -> Browser:
        """Get the current browser instance.
        
        Returns:
            Browser instance
        """
        async with self._lock:
            if self._browser is None:
                await self._start_browser()
            
            # Check if we need to restart
            if self._page_count >= self._restart_every:
                logger.info(f"Restarting browser after {self._page_count} pages")
                await self._start_browser()
            
            self._page_count += 1
            return self._browser
    
    async def close(self) -> None:
        """Close the browser pool."""
        async with self._lock:
            if self._browser:
                await self._browser.close()
                self._browser = None
                logger.info("Browser closed")
            
            if self._playwright:
                await self._playwright.stop()
                self._playwright = None
                logger.info("Playwright stopped")
