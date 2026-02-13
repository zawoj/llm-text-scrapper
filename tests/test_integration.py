"""Integration tests with mock data."""

import pytest
from doc_crawler.extractor.content_extractor import ContentExtractor
from doc_crawler.normalizer.content_cleaner import ContentCleaner


class TestContentExtraction:
    """Test end-to-end content extraction."""
    
    def test_extract_and_clean_content(self):
        """Test extracting and cleaning content."""
        html = """
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
            <nav><a href="/">Home</a></nav>
            <main>
                <h1>Main Title</h1>
                <p>This is a paragraph.</p>
                <pre><code>def hello():
    print("Hello")</code></pre>
            </main>
            <footer>Copyright 2024</footer>
            <script>alert('test');</script>
        </body>
        </html>
        """
        
        extractor = ContentExtractor()
        cleaner = ContentCleaner()
        
        # Extract content
        markdown = extractor.extract(html, "https://example.com/test")
        assert markdown is not None
        assert "Main Title" in markdown
        assert "This is a paragraph" in markdown
        assert "def hello()" in markdown
        
        # Verify unwanted elements removed
        assert "nav" not in markdown.lower()
        assert "footer" not in markdown.lower()
        assert "script" not in markdown.lower()
        assert "alert" not in markdown
        
        # Clean content
        cleaned = cleaner.clean(markdown)
        assert cleaned is not None
        assert len(cleaned) > 0


class TestMDCPathMapping:
    """Test URL to file path mapping."""
    
    def test_url_to_path_conversion(self):
        """Test converting URLs to file paths."""
        from doc_crawler.writer.mdc_writer import MDCWriter
        from pathlib import Path
        
        writer = MDCWriter("test_output")
        
        # Test simple path
        path = writer._url_to_path("https://docs.example.com/guide/intro")
        assert "docs_example_com" in str(path)
        assert "guide/intro.md" in str(path)
        
        # Test root path
        path = writer._url_to_path("https://docs.example.com/")
        assert "index.md" in str(path)
        
        # Test path with trailing slash
        path = writer._url_to_path("https://docs.example.com/guide/")
        assert "guide/index.md" in str(path)
