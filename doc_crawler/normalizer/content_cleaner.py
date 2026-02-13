"""Clean and normalize markdown content."""

import re
from doc_crawler.utils.logger import setup_logger


logger = setup_logger(__name__)


class ContentCleaner:
    """Clean and normalize markdown content."""
    
    def clean(self, content: str) -> str:
        """Clean and normalize markdown content.
        
        Args:
            content: Raw markdown content
            
        Returns:
            Cleaned markdown content
        """
        if not content:
            return ""
        
        # Remove excessive blank lines (more than 2 consecutive)
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # Remove trailing whitespace from lines
        lines = [line.rstrip() for line in content.split('\n')]
        content = '\n'.join(lines)
        
        # Remove leading/trailing whitespace from document
        content = content.strip()
        
        # Normalize heading levels (ensure they start at h1)
        content = self._normalize_headings(content)
        
        # Remove empty sections (heading with no content)
        content = self._remove_empty_sections(content)
        
        return content
    
    def _normalize_headings(self, content: str) -> str:
        """Normalize heading levels.
        
        Args:
            content: Markdown content
            
        Returns:
            Content with normalized headings
        """
        # Find the minimum heading level used
        heading_pattern = r'^(#{1,6})\s'
        headings = re.findall(heading_pattern, content, re.MULTILINE)
        
        if not headings:
            return content
        
        min_level = min(len(h) for h in headings)
        
        # If minimum is already 1, no adjustment needed
        if min_level == 1:
            return content
        
        # Adjust all headings down by (min_level - 1)
        adjustment = min_level - 1
        
        def adjust_heading(match):
            hashes = match.group(1)
            new_level = max(1, len(hashes) - adjustment)
            return '#' * new_level + ' '
        
        content = re.sub(heading_pattern, adjust_heading, content, flags=re.MULTILINE)
        
        return content
    
    def _remove_empty_sections(self, content: str) -> str:
        """Remove sections that are just headings with no content.
        
        Args:
            content: Markdown content
            
        Returns:
            Content with empty sections removed
        """
        # Remove heading followed immediately by another heading
        content = re.sub(r'^(#{1,6}\s+.+)\n+(#{1,6}\s)', r'\2', content, flags=re.MULTILINE)
        
        return content
