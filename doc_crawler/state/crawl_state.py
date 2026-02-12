"""Manage crawl state for incremental crawling."""

import json
import aiofiles
from pathlib import Path
from datetime import datetime
from typing import Dict, Set
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class CrawlState:
    """Manage state for incremental crawling."""
    
    def __init__(self, state_dir: str):
        """Initialize crawl state.
        
        Args:
            state_dir: Directory to store state files
        """
        self._state_dir = Path(state_dir)
        self._state_file = self._state_dir / 'crawl_state.json'
        self._visited_urls: Set[str] = set()
        self._content_hashes: Dict[str, str] = {}
        self._crawl_timestamp: str = datetime.utcnow().isoformat() + 'Z'
    
    async def load(self) -> None:
        """Load state from file."""
        try:
            if not self._state_file.exists():
                logger.info("No existing state file found, starting fresh")
                return
            
            async with aiofiles.open(self._state_file, 'r') as f:
                content = await f.read()
                data = json.loads(content)
            
            self._visited_urls = set(data.get('visited_urls', []))
            self._content_hashes = data.get('content_hashes', {})
            
            logger.info(f"Loaded state with {len(self._visited_urls)} visited URLs")
            
        except Exception as e:
            logger.error(f"Error loading state: {e}")
    
    async def save(self) -> None:
        """Save state to file."""
        try:
            # Ensure directory exists
            self._state_dir.mkdir(parents=True, exist_ok=True)
            
            data = {
                'visited_urls': list(self._visited_urls),
                'content_hashes': self._content_hashes,
                'crawl_timestamp': self._crawl_timestamp,
            }
            
            # Write to temp file first
            temp_file = self._state_file.with_suffix('.tmp')
            async with aiofiles.open(temp_file, 'w') as f:
                await f.write(json.dumps(data, indent=2))
            
            # Atomic rename
            temp_file.replace(self._state_file)
            
            logger.info(f"Saved state with {len(self._visited_urls)} visited URLs")
            
        except Exception as e:
            logger.error(f"Error saving state: {e}")
    
    def mark_visited(self, url: str, content_hash: str = None) -> None:
        """Mark a URL as visited.
        
        Args:
            url: URL that was visited
            content_hash: Hash of the content (optional)
        """
        self._visited_urls.add(url)
        if content_hash:
            self._content_hashes[url] = content_hash
    
    def is_visited(self, url: str) -> bool:
        """Check if a URL has been visited.
        
        Args:
            url: URL to check
            
        Returns:
            True if visited, False otherwise
        """
        return url in self._visited_urls
    
    def get_content_hash(self, url: str) -> str:
        """Get content hash for a URL.
        
        Args:
            url: URL to get hash for
            
        Returns:
            Content hash or None
        """
        return self._content_hashes.get(url)
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about the crawl state.
        
        Returns:
            Dictionary with stats
        """
        return {
            'visited_urls': len(self._visited_urls),
            'content_hashes': len(self._content_hashes),
        }
