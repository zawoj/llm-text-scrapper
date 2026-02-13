"""Main crawler orchestrator."""

import asyncio
import signal
from typing import Optional
from doc_crawler.config.config_loader import CrawlerConfig
from doc_crawler.crawler.queue import QueueManager
from doc_crawler.crawler.discovery import Discovery
from doc_crawler.fetcher.browser_pool import BrowserPool
from doc_crawler.fetcher.page_fetcher import PageFetcher
from doc_crawler.extractor.content_extractor import ContentExtractor
from doc_crawler.extractor.link_extractor import LinkExtractor
from doc_crawler.normalizer.url_normalizer import URLNormalizer
from doc_crawler.normalizer.content_cleaner import ContentCleaner
from doc_crawler.writer.mdc_writer import MDCWriter
from doc_crawler.state.crawl_state import CrawlState
from doc_crawler.utils.logger import setup_logger
from doc_crawler.utils.hashing import hash_content


logger = setup_logger(__name__)


class CrawlerOrchestrator:
    """Orchestrate the entire crawling process."""
    
    def __init__(self, config: CrawlerConfig):
        """Initialize orchestrator.
        
        Args:
            config: Crawler configuration
        """
        self.config = config
        self._shutdown_requested = False
        
        # Initialize components
        self.queue = QueueManager(max_pages=config.max_pages)
        self.normalizer = URLNormalizer()
        self.browser_pool = BrowserPool(restart_every=config.restart_browser_every)
        self.fetcher = PageFetcher(
            browser_pool=self.browser_pool,
            timeout=config.page_timeout,
            max_retries=config.max_retries,
            rate_limit=config.rate_limit_seconds
        )
        self.content_extractor = ContentExtractor()
        self.link_extractor = LinkExtractor(self.normalizer, config.ignore_paths)
        self.content_cleaner = ContentCleaner()
        self.writer = MDCWriter(config.output_dir)
        self.state = CrawlState(config.state_dir)
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        logger.info("Shutdown signal received, finishing current tasks...")
        self._shutdown_requested = True
    
    async def crawl(self) -> None:
        """Run the crawl process."""
        try:
            # Load state
            await self.state.load()
            
            # Start browser pool
            await self.browser_pool.start()
            
            # Add seed URLs
            await self._add_seeds()
            
            # Process queue
            await self._process_queue()
            
        finally:
            # Save state
            await self.state.save()
            
            # Close browser
            await self.browser_pool.close()
            
            # Print stats
            self._print_stats()
    
    async def _add_seeds(self) -> None:
        """Add seed URLs to the queue."""
        logger.info(f"Adding {len(self.config.seeds)} seed URL(s)")
        
        for seed_url in self.config.seeds:
            # Normalize seed URL
            normalized_url = self.normalizer.normalize(seed_url)
            
            # Add to queue
            await self.queue.add(normalized_url)
            
            # Try to discover sitemap
            sitemap_urls = await Discovery.discover_sitemap(
                normalized_url,
                self.fetcher.fetch
            )
            
            if sitemap_urls:
                # Normalize and add sitemap URLs
                for url in sitemap_urls:
                    normalized = self.normalizer.normalize(url)
                    if not self.normalizer.should_ignore(normalized, self.config.ignore_paths):
                        await self.queue.add(normalized)
        
        queue_size = await self.queue.size()
        logger.info(f"Queue initialized with {queue_size} URLs")
    
    async def _process_queue(self) -> None:
        """Process URLs from the queue."""
        processed = 0
        
        while not self._shutdown_requested:
            # Get next URL
            url = await self.queue.pop()
            
            if url is None:
                logger.info("Queue empty, crawl complete")
                break
            
            # Skip if already visited (for incremental crawling)
            if self.state.is_visited(url):
                logger.debug(f"Skipping already visited URL: {url}")
                continue
            
            # Process the page
            await self._process_page(url)
            
            processed += 1
            
            if processed % 10 == 0:
                queue_size = await self.queue.size()
                logger.info(f"Progress: {processed} pages processed, {queue_size} in queue")
        
        if self._shutdown_requested:
            logger.info("Crawl interrupted by user")
    
    async def _process_page(self, url: str) -> None:
        """Process a single page.
        
        Args:
            url: URL to process
        """
        try:
            logger.info(f"Processing: {url}")
            
            # Fetch HTML
            html = await self.fetcher.fetch(url)
            
            if not html:
                logger.warning(f"Failed to fetch {url}")
                self.state.mark_visited(url)
                return
            
            # Extract content
            markdown = self.content_extractor.extract(html, url)
            
            if not markdown:
                logger.warning(f"No content extracted from {url}")
                self.state.mark_visited(url)
                return
            
            # Clean content
            cleaned_content = self.content_cleaner.clean(markdown)
            
            # Write to file
            content_hash = hash_content(cleaned_content)
            written = await self.writer.write(url, cleaned_content)
            
            # Mark as visited
            self.state.mark_visited(url, content_hash)
            
            # Extract and add new links
            links = self.link_extractor.extract(html, url)
            added = await self.queue.add_batch(list(links))
            
            if added > 0:
                logger.debug(f"Added {added} new URLs to queue from {url}")
            
        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
    
    def _print_stats(self) -> None:
        """Print crawl statistics."""
        stats = self.state.get_stats()
        logger.info("=" * 50)
        logger.info("Crawl Statistics:")
        logger.info(f"  URLs visited: {stats['visited_urls']}")
        logger.info(f"  Files written: {stats['content_hashes']}")
        logger.info("=" * 50)
