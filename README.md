# Documentation Crawler - MDC Corpus Builder

A Python-based documentation crawler that automatically builds a Markdown corpus from developer documentation websites. This tool crawls documentation sites, extracts clean content, and generates MDC (Markdown with frontmatter) files suitable for LLM training, RAG systems, and documentation analysis.

## Features

- **Automated Crawling**: Crawl entire documentation sites from seed URLs
- **Sitemap Discovery**: Automatically discover URLs from sitemap.xml
- **Incremental Updates**: Smart state management to avoid re-crawling unchanged content
- **Clean Content Extraction**: Intelligent removal of navigation, footers, and other non-content elements
- **Markdown Output**: Convert HTML to clean, structured Markdown with code blocks preserved
- **MDC Format**: Each page saved with YAML frontmatter containing metadata
- **Browser Automation**: Uses Playwright for reliable JavaScript-heavy documentation sites
- **Configurable**: YAML-based configuration for crawl parameters
- **Robust**: Retry logic, rate limiting, and graceful error handling

## Installation

### Prerequisites

- Python 3.11 or higher
- pip

### Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Install Playwright browsers:

```bash
playwright install chromium
```

## Quick Start

1. Generate a sample configuration:

```bash
python -m doc_crawler.cli generate-config config.yaml
```

2. Edit `config.yaml` and add your documentation URLs to the `seeds` list:

```yaml
seeds:
  - https://docs.example.com
  - https://docs.another-site.com
```

3. Run the crawler:

```bash
python -m doc_crawler.cli crawl config.yaml
```

## Configuration

The crawler uses a YAML configuration file with the following options:

```yaml
seeds:
  - https://docs.example.com        # Starting URLs for crawling
  
output_dir: corpus                  # Directory for MDC output files
max_concurrency: 5                  # Number of concurrent requests
restart_browser_every: 50           # Restart browser after N pages
rate_limit_seconds: 1.0             # Delay between requests

ignore_paths:                       # URL paths to skip
  - /login
  - /search
  - /blog

max_pages: 5000                     # Maximum pages to crawl
page_timeout: 30000                 # Page load timeout (ms)
max_retries: 3                      # Retry attempts for failed pages
log_level: INFO                     # Logging level
state_dir: _meta                    # Directory for crawl state
```

## Output Format

Each crawled page generates an MDC file with:

### Directory Structure

```
corpus/
  docs_example_com/
    getting-started/
      installation.md
      quickstart.md
    api/
      authentication.md
```

### MDC File Format

```markdown
---
source: https://docs.example.com/api/authentication
provider: docs.example.com
crawled_at: 2024-01-15T10:30:00Z
content_hash: abc123...
---

# Authentication

Your documentation content in clean Markdown...
```

## Architecture

The crawler is built with a modular architecture:

- **CLI**: Command-line interface for running crawls
- **Orchestrator**: Coordinates the entire crawl process
- **Queue Manager**: Thread-safe URL queue with deduplication
- **Browser Pool**: Manages Playwright browser instances
- **Page Fetcher**: Fetches pages with retry logic and rate limiting
- **Content Extractor**: Extracts main content and converts to Markdown
- **Link Extractor**: Discovers internal links for crawling
- **Content Cleaner**: Normalizes and cleans Markdown output
- **MDC Writer**: Writes files with frontmatter
- **State Manager**: Tracks crawl state for incremental updates
- **Discovery**: Finds URLs via sitemap.xml

## Incremental Crawling

The crawler maintains state in `_meta/crawl_state.json` to support incremental crawling:

- Tracks visited URLs
- Stores content hashes to detect changes
- Skips unchanged pages on subsequent runs

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black doc_crawler/
```

## Use Cases

- **LLM Training**: Build training corpora from documentation
- **RAG Systems**: Create knowledge bases for retrieval-augmented generation
- **Documentation Analysis**: Analyze documentation structure and content
- **Offline Documentation**: Create offline copies of documentation sites
- **Documentation Migration**: Convert documentation to Markdown format

## Legacy Web Interface

This repository previously contained a Next.js web application for text scraping. The web interface has been replaced with this Python CLI tool. If you need the web interface, please check out an earlier commit.
