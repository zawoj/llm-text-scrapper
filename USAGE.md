# Documentation Crawler Usage Guide

This guide provides detailed instructions for using the Documentation Crawler system.

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

## Basic Usage

### Generate Configuration

First, generate a sample configuration file:

```bash
python -m doc_crawler.cli generate-config config.yaml
```

### Edit Configuration

Edit the `config.yaml` file to add the documentation sites you want to crawl:

```yaml
seeds:
  - https://docs.stripe.com
  - https://docs.github.com

output_dir: corpus
max_pages: 1000
```

### Run Crawler

Start the crawler:

```bash
python -m doc_crawler.cli crawl config.yaml
```

## Configuration Options

### Required Options

- **seeds**: List of starting URLs to crawl
- **output_dir**: Directory where MDC files will be saved

### Optional Options

- **max_concurrency**: Number of concurrent requests (default: 5)
- **restart_browser_every**: Restart browser after N pages (default: 50)
- **rate_limit_seconds**: Delay between requests in seconds (default: 1.0)
- **ignore_paths**: List of URL paths to skip (default: ['/login', '/search', '/blog', '/api'])
- **max_pages**: Maximum number of pages to crawl (default: 5000, set to null for unlimited)
- **page_timeout**: Page load timeout in milliseconds (default: 30000)
- **max_retries**: Number of retry attempts for failed requests (default: 3)
- **log_level**: Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL (default: INFO)
- **state_dir**: Directory for crawl state storage (default: _meta)

## Output Structure

The crawler generates MDC (Markdown with frontmatter) files organized by domain:

```
corpus/
├── docs_stripe_com/
│   ├── index.md
│   ├── api/
│   │   ├── authentication.md
│   │   └── errors.md
│   └── guides/
│       └── getting-started.md
└── docs_github_com/
    ├── index.md
    └── actions/
        └── quickstart.md
```

## MDC File Format

Each file includes YAML frontmatter with metadata:

```markdown
---
source: https://docs.stripe.com/api/authentication
provider: docs.stripe.com
crawled_at: 2024-01-15T10:30:00+00:00
content_hash: abc123def456...
---

# Authentication

Your documentation content in clean Markdown format...
```

## Incremental Crawling

The crawler automatically tracks state in the `_meta/` directory:

- **First run**: Crawls all pages
- **Subsequent runs**: Only crawls new or changed pages

To force a complete re-crawl, delete the `_meta/` directory:

```bash
rm -rf _meta/
```

## Advanced Usage

### Debug Mode

Enable debug logging to see detailed information:

```yaml
log_level: DEBUG
```

### Crawling Multiple Documentation Sites

Add multiple seed URLs:

```yaml
seeds:
  - https://docs.stripe.com
  - https://docs.twilio.com
  - https://docs.sendgrid.com
```

### Custom Ignore Patterns

Skip specific paths:

```yaml
ignore_paths:
  - /login
  - /signup
  - /search
  - /blog
  - /changelog
  - /api/playground
```

### Rate Limiting

Adjust the rate limit to be more or less aggressive:

```yaml
rate_limit_seconds: 2.0  # Slower, more polite
# or
rate_limit_seconds: 0.5  # Faster, but may trigger rate limits
```

## Common Issues

### Browser Crashes

If the browser crashes frequently, try:

1. Reduce `max_concurrency`
2. Increase `restart_browser_every`

```yaml
max_concurrency: 2
restart_browser_every: 25
```

### Timeout Errors

For slower sites, increase the timeout:

```yaml
page_timeout: 60000  # 60 seconds
```

### Memory Issues

For very large crawls, enable browser restarts more frequently:

```yaml
restart_browser_every: 25
```

## Monitoring Progress

The crawler logs progress information:

```
2024-01-15 10:30:00 - doc_crawler - INFO - ==================================================
2024-01-15 10:30:00 - doc_crawler - INFO - Documentation Crawler - Starting
2024-01-15 10:30:00 - doc_crawler - INFO - ==================================================
2024-01-15 10:30:05 - doc_crawler - INFO - Queue initialized with 50 URLs
2024-01-15 10:30:10 - doc_crawler - INFO - Progress: 10 pages processed, 45 in queue
2024-01-15 10:30:20 - doc_crawler - INFO - Progress: 20 pages processed, 50 in queue
...
```

## Stopping the Crawler

Press `Ctrl+C` to gracefully stop the crawler:

- The crawler will finish processing the current page
- State will be saved automatically
- You can resume later by running the same command

## Tips and Best Practices

1. **Start Small**: Test with a small `max_pages` value first
2. **Use Sitemap Discovery**: Most documentation sites have a sitemap.xml that speeds up discovery
3. **Monitor Logs**: Watch for errors or warnings that might indicate problems
4. **Respect Rate Limits**: Use appropriate `rate_limit_seconds` to be a good citizen
5. **Regular Incremental Runs**: Run the crawler periodically to catch updates

## Example Configurations

### Fast Development Crawl

```yaml
seeds:
  - https://docs.example.com
output_dir: corpus
max_pages: 50
max_concurrency: 10
rate_limit_seconds: 0.5
log_level: DEBUG
```

### Production Crawl

```yaml
seeds:
  - https://docs.stripe.com
  - https://docs.twilio.com
output_dir: /data/corpus
max_pages: 10000
max_concurrency: 5
restart_browser_every: 50
rate_limit_seconds: 1.0
max_retries: 5
log_level: INFO
state_dir: /data/meta
```

### Polite Crawl

```yaml
seeds:
  - https://docs.example.com
output_dir: corpus
max_concurrency: 2
rate_limit_seconds: 2.0
max_retries: 3
```
