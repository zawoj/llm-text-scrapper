"""Tests for content hashing."""

import pytest
from doc_crawler.utils.hashing import hash_content


class TestHashing:
    """Test content hashing."""
    
    def test_hash_content_consistent(self):
        """Test that hashing is consistent."""
        content = "Test content"
        hash1 = hash_content(content)
        hash2 = hash_content(content)
        assert hash1 == hash2
    
    def test_hash_content_different(self):
        """Test that different content produces different hashes."""
        content1 = "Test content 1"
        content2 = "Test content 2"
        hash1 = hash_content(content1)
        hash2 = hash_content(content2)
        assert hash1 != hash2
    
    def test_hash_content_returns_hex(self):
        """Test that hash is hexadecimal."""
        content = "Test content"
        hash_value = hash_content(content)
        assert len(hash_value) == 64  # SHA256 produces 64 hex chars
        assert all(c in '0123456789abcdef' for c in hash_value)
