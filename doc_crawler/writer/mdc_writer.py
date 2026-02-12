"""Write MDC files with frontmatter."""

import aiofiles
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
from typing import Optional
from doc_crawler.utils.logger import setup_logger
from doc_crawler.utils.hashing import hash_content


logger = setup_logger(__name__)


class MDCWriter:
    """Write content to MDC (Markdown with frontmatter) files."""
    
    def __init__(self, output_dir: str):
        """Initialize MDC writer.
        
        Args:
            output_dir: Root directory for output files
        """
        self._output_dir = Path(output_dir)
    
    def _url_to_path(self, url: str) -> Path:
        """Convert URL to file path.
        
        Args:
            url: Source URL
            
        Returns:
            Path object for the MDC file
        """
        parsed = urlparse(url)
        
        # Replace dots with underscores in domain
        domain = parsed.netloc.replace('.', '_')
        
        # Get path and ensure it doesn't start with /
        path = parsed.path.lstrip('/')
        
        # If path is empty, use index.md
        if not path:
            path = 'index'
        
        # If path ends with /, append index
        if path.endswith('/'):
            path += 'index'
        
        # Ensure .md extension
        if not path.endswith('.md'):
            path += '.md'
        
        # Combine into full path
        full_path = self._output_dir / domain / path
        
        return full_path
    
    def _create_frontmatter(self, url: str, content_hash: str) -> str:
        """Create YAML frontmatter for MDC file.
        
        Args:
            url: Source URL
            content_hash: Hash of the content
            
        Returns:
            Frontmatter string
        """
        domain = urlparse(url).netloc
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        frontmatter = f"""---
source: {url}
provider: {domain}
crawled_at: {timestamp}
content_hash: {content_hash}
---

"""
        return frontmatter
    
    async def write(self, url: str, content: str, force: bool = False) -> bool:
        """Write content to MDC file.
        
        Args:
            url: Source URL
            content: Markdown content
            force: Force write even if content hash matches
            
        Returns:
            True if file was written, False if skipped
        """
        try:
            file_path = self._url_to_path(url)
            content_hash = hash_content(content)
            
            # Check if file exists and content is unchanged
            if not force and file_path.exists():
                existing_hash = await self._get_existing_hash(file_path)
                if existing_hash == content_hash:
                    logger.debug(f"Skipping {url} (content unchanged)")
                    return False
            
            # Create frontmatter
            frontmatter = self._create_frontmatter(url, content_hash)
            
            # Combine frontmatter and content
            full_content = frontmatter + content
            
            # Ensure directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file atomically
            temp_path = file_path.with_suffix('.tmp')
            async with aiofiles.open(temp_path, 'w', encoding='utf-8') as f:
                await f.write(full_content)
            
            # Rename to final path (atomic on POSIX systems)
            temp_path.replace(file_path)
            
            logger.info(f"Wrote {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error writing {url} to file: {e}")
            return False
    
    async def _get_existing_hash(self, file_path: Path) -> Optional[str]:
        """Extract content hash from existing file's frontmatter.
        
        Args:
            file_path: Path to existing file
            
        Returns:
            Content hash or None if not found
        """
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
            
            # Extract frontmatter
            if content.startswith('---\n'):
                end = content.find('\n---\n', 4)
                if end > 0:
                    frontmatter = content[4:end]
                    for line in frontmatter.split('\n'):
                        if line.startswith('content_hash:'):
                            return line.split(':', 1)[1].strip()
            
            return None
            
        except Exception as e:
            logger.error(f"Error reading existing file {file_path}: {e}")
            return None
