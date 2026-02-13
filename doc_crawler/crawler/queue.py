"""Queue management for URL crawling."""

import asyncio
from typing import Optional, Set
from collections import deque


class QueueManager:
    """Thread-safe queue for managing URLs to crawl."""
    
    def __init__(self, max_pages: Optional[int] = None):
        """Initialize queue manager.
        
        Args:
            max_pages: Maximum number of pages to crawl (None for unlimited)
        """
        self._queue: deque[str] = deque()
        self._seen: Set[str] = set()
        self._lock = asyncio.Lock()
        self._max_pages = max_pages
        self._processed_count = 0
    
    async def add(self, url: str) -> bool:
        """Add a URL to the queue if not already seen.
        
        Args:
            url: URL to add
            
        Returns:
            True if added, False if already seen or max pages reached
        """
        async with self._lock:
            if url in self._seen:
                return False
            
            if self._max_pages and len(self._seen) >= self._max_pages:
                return False
            
            self._seen.add(url)
            self._queue.append(url)
            return True
    
    async def add_batch(self, urls: list[str]) -> int:
        """Add multiple URLs to the queue.
        
        Args:
            urls: List of URLs to add
            
        Returns:
            Number of URLs actually added
        """
        count = 0
        for url in urls:
            if await self.add(url):
                count += 1
        return count
    
    async def pop(self) -> Optional[str]:
        """Remove and return the next URL from the queue.
        
        Returns:
            Next URL or None if queue is empty
        """
        async with self._lock:
            if not self._queue:
                return None
            url = self._queue.popleft()
            self._processed_count += 1
            return url
    
    async def pop_batch(self, n: int) -> list[str]:
        """Remove and return multiple URLs from the queue.
        
        Args:
            n: Number of URLs to pop
            
        Returns:
            List of URLs (may be less than n if queue is smaller)
        """
        urls = []
        for _ in range(n):
            url = await self.pop()
            if url is None:
                break
            urls.append(url)
        return urls
    
    async def size(self) -> int:
        """Get current queue size.
        
        Returns:
            Number of URLs in queue
        """
        async with self._lock:
            return len(self._queue)
    
    async def is_empty(self) -> bool:
        """Check if queue is empty.
        
        Returns:
            True if empty, False otherwise
        """
        async with self._lock:
            return len(self._queue) == 0
    
    async def total_seen(self) -> int:
        """Get total number of unique URLs seen.
        
        Returns:
            Number of unique URLs
        """
        async with self._lock:
            return len(self._seen)
    
    async def processed_count(self) -> int:
        """Get number of URLs processed.
        
        Returns:
            Number of processed URLs
        """
        async with self._lock:
            return self._processed_count
    
    async def is_seen(self, url: str) -> bool:
        """Check if URL has been seen before.
        
        Args:
            url: URL to check
            
        Returns:
            True if seen, False otherwise
        """
        async with self._lock:
            return url in self._seen
