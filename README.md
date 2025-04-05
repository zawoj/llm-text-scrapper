# LLM Text Scraper

A Next.js application for extracting clean, semantic content from websites for documentation purposes. This tool crawls websites, builds a sitemap, and generates well-formatted TXT and Markdown documents by intelligently removing HTML clutter.

![Demo of LLM Text Scraper Application](/public/demo.png)

## Features

- Crawl websites and automatically generate sitemaps
- Extract meaningful content by removing unnecessary HTML markup
- Strip navigation elements, headers, footers, and non-semantic tags
- Generate clean text files suitable for Large Language Models
- Create Markdown documentation with proper formatting
- Stream progress updates with Server-Sent Events
- Fast Edge Runtime support

## How It Works

1. **Sitemap Generation**: Automatically discovers and builds a sitemap of the target website
2. **Content Extraction**: Scrapes each page and extracts only the meaningful semantic content
3. **Text Processing**: Removes HTML boilerplate, navigation, and styling
4. **File Generation**: Creates clean TXT and MD files with proper formatting

## API Endpoints

The application provides REST API endpoints accessible at `/api`:

- `POST /api/doc-gen/sitemap-gen` - Start sitemap generation
- `GET /api/doc-gen/sitemap-progress/:url` - Stream sitemap generation progress
- `GET /api/doc-gen/sitemap/:url` - Get the generated sitemap
- `POST /api/doc-gen/doc-gen` - Start documentation generation
- `GET /api/doc-gen/doc-progress/:url` - Stream documentation generation progress
- `GET /api/doc-gen/doc/:url` - Get the generated documentation
- `GET /api/doc-gen/html-file/:filename` - Get the raw HTML file

# TODO

- [ ] Connect with database to cache sitemaps and docs
- [ ] Function that catches llm-text(s).txt if exists in documentation website
- [ ] Improve text extraction
