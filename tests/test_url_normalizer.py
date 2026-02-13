"""Tests for URL normalizer."""

import pytest
from doc_crawler.normalizer.url_normalizer import URLNormalizer


class TestURLNormalizer:
    """Test URL normalization."""
    
    def test_normalize_removes_fragment(self):
        """Test that fragments are removed."""
        url = "https://docs.example.com/page#section"
        normalized = URLNormalizer.normalize(url)
        assert normalized == "https://docs.example.com/page"
    
    def test_normalize_removes_query(self):
        """Test that query parameters are removed."""
        url = "https://docs.example.com/page?foo=bar&baz=qux"
        normalized = URLNormalizer.normalize(url)
        assert normalized == "https://docs.example.com/page"
    
    def test_normalize_removes_trailing_slash(self):
        """Test that trailing slashes are removed."""
        url = "https://docs.example.com/page/"
        normalized = URLNormalizer.normalize(url)
        assert normalized == "https://docs.example.com/page"
    
    def test_normalize_keeps_root_slash(self):
        """Test that root path keeps its slash."""
        url = "https://docs.example.com/"
        normalized = URLNormalizer.normalize(url)
        assert normalized == "https://docs.example.com/"
    
    def test_normalize_enforces_https(self):
        """Test that HTTP is converted to HTTPS."""
        url = "http://docs.example.com/page"
        normalized = URLNormalizer.normalize(url)
        assert normalized == "https://docs.example.com/page"
    
    def test_is_same_domain_true(self):
        """Test same domain detection."""
        url1 = "https://docs.example.com/page1"
        url2 = "https://docs.example.com/page2"
        assert URLNormalizer.is_same_domain(url1, url2)
    
    def test_is_same_domain_false(self):
        """Test different domain detection."""
        url1 = "https://docs.example.com/page"
        url2 = "https://docs.other.com/page"
        assert not URLNormalizer.is_same_domain(url1, url2)
    
    def test_get_domain(self):
        """Test domain extraction."""
        url = "https://docs.example.com/path/to/page"
        domain = URLNormalizer.get_domain(url)
        assert domain == "docs.example.com"
    
    def test_resolve_relative_url(self):
        """Test resolving relative URLs."""
        base = "https://docs.example.com/path/page"
        relative = "../other/page"
        resolved = URLNormalizer.resolve_url(base, relative)
        assert resolved == "https://docs.example.com/other/page"
    
    def test_resolve_absolute_url(self):
        """Test resolving absolute URLs."""
        base = "https://docs.example.com/path/page"
        absolute = "https://other.com/page"
        resolved = URLNormalizer.resolve_url(base, absolute)
        assert resolved == "https://other.com/page"
    
    def test_should_ignore_matching_path(self):
        """Test ignore path matching."""
        url = "https://docs.example.com/login/form"
        ignore_paths = ['/login', '/search']
        assert URLNormalizer.should_ignore(url, ignore_paths)
    
    def test_should_not_ignore_non_matching_path(self):
        """Test non-matching path is not ignored."""
        url = "https://docs.example.com/docs/guide"
        ignore_paths = ['/login', '/search']
        assert not URLNormalizer.should_ignore(url, ignore_paths)
