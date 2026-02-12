"""Hashing utilities for content deduplication."""

import hashlib


def hash_content(content: str) -> str:
    """Generate SHA256 hash of content.
    
    Args:
        content: String content to hash
        
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(content.encode('utf-8')).hexdigest()
