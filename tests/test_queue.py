"""Tests for queue manager."""

import pytest
from doc_crawler.crawler.queue import QueueManager


@pytest.mark.asyncio
class TestQueueManager:
    """Test queue management."""
    
    async def test_add_url(self):
        """Test adding a URL."""
        queue = QueueManager()
        result = await queue.add("https://example.com")
        assert result is True
        assert await queue.size() == 1
    
    async def test_add_duplicate_url(self):
        """Test that duplicate URLs are not added."""
        queue = QueueManager()
        await queue.add("https://example.com")
        result = await queue.add("https://example.com")
        assert result is False
        assert await queue.size() == 1
    
    async def test_pop_url(self):
        """Test popping a URL."""
        queue = QueueManager()
        url = "https://example.com"
        await queue.add(url)
        popped = await queue.pop()
        assert popped == url
        assert await queue.size() == 0
    
    async def test_pop_empty_queue(self):
        """Test popping from empty queue."""
        queue = QueueManager()
        popped = await queue.pop()
        assert popped is None
    
    async def test_max_pages_limit(self):
        """Test max pages limit."""
        queue = QueueManager(max_pages=2)
        await queue.add("https://example.com/1")
        await queue.add("https://example.com/2")
        result = await queue.add("https://example.com/3")
        assert result is False
        assert await queue.total_seen() == 2
    
    async def test_is_seen(self):
        """Test is_seen method."""
        queue = QueueManager()
        url = "https://example.com"
        await queue.add(url)
        assert await queue.is_seen(url) is True
        assert await queue.is_seen("https://other.com") is False
    
    async def test_pop_batch(self):
        """Test popping multiple URLs."""
        queue = QueueManager()
        urls = [f"https://example.com/{i}" for i in range(5)]
        for url in urls:
            await queue.add(url)
        
        batch = await queue.pop_batch(3)
        assert len(batch) == 3
        assert await queue.size() == 2
    
    async def test_add_batch(self):
        """Test adding multiple URLs."""
        queue = QueueManager()
        urls = [f"https://example.com/{i}" for i in range(5)]
        count = await queue.add_batch(urls)
        assert count == 5
        assert await queue.size() == 5
