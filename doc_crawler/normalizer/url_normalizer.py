"""URL normalization utilities."""

from urllib.parse import urlparse, urlunparse, urljoin
from typing import Optional


class URLNormalizer:
    """Normalize and validate URLs for crawling."""
    
    @staticmethod
    def normalize(url: str) -> str:
        """Normalize a URL by removing fragments, query params, and trailing slashes.
        
        Args:
            url: URL to normalize
            
        Returns:
            Normalized URL string
        """
        parsed = urlparse(url)
        
        # Enforce HTTPS
        scheme = 'https' if parsed.scheme in ('http', 'https') else parsed.scheme
        
        # Remove fragments and query parameters
        normalized = urlunparse((
            scheme,
            parsed.netloc,
            parsed.path.rstrip('/') if parsed.path != '/' else '/',
            '',  # params
            '',  # query
            ''   # fragment
        ))
        
        return normalized
    
    @staticmethod
    def is_same_domain(url1: str, url2: str) -> bool:
        """Check if two URLs belong to the same domain.
        
        Args:
            url1: First URL
            url2: Second URL
            
        Returns:
            True if same domain, False otherwise
        """
        domain1 = urlparse(url1).netloc
        domain2 = urlparse(url2).netloc
        return domain1 == domain2
    
    @staticmethod
    def get_domain(url: str) -> str:
        """Extract domain from URL.
        
        Args:
            url: URL to extract domain from
            
        Returns:
            Domain string
        """
        return urlparse(url).netloc
    
    @staticmethod
    def resolve_url(base_url: str, relative_url: str) -> str:
        """Resolve a relative URL against a base URL.
        
        Args:
            base_url: Base URL
            relative_url: Relative or absolute URL
            
        Returns:
            Resolved absolute URL
        """
        return urljoin(base_url, relative_url)
    
    @staticmethod
    def should_ignore(url: str, ignore_paths: list[str]) -> bool:
        """Check if URL should be ignored based on path patterns.
        
        Args:
            url: URL to check
            ignore_paths: List of path patterns to ignore
            
        Returns:
            True if should ignore, False otherwise
        """
        path = urlparse(url).path
        return any(ignored in path for ignored in ignore_paths)
