"""Command-line interface for the documentation crawler."""

import asyncio
import sys
from pathlib import Path
from doc_crawler.config.config_loader import CrawlerConfig
from doc_crawler.crawler.orchestrator import CrawlerOrchestrator
from doc_crawler.utils.logger import setup_logger


def print_usage():
    """Print usage information."""
    print("""
Documentation Crawler - MDC Corpus Builder

Usage:
    python -m doc_crawler.cli crawl <config.yaml>
    python -m doc_crawler.cli generate-config <output.yaml>

Commands:
    crawl <config>          Start crawling with the specified configuration file
    generate-config <file>  Generate a sample configuration file

Examples:
    python -m doc_crawler.cli crawl config.yaml
    python -m doc_crawler.cli generate-config example-config.yaml
""")


def generate_sample_config(output_path: str):
    """Generate a sample configuration file.
    
    Args:
        output_path: Path to save the configuration file
    """
    config = CrawlerConfig(
        seeds=[
            'https://docs.example.com',
        ],
        output_dir='corpus',
        max_concurrency=5,
        restart_browser_every=50,
        rate_limit_seconds=1.0,
        ignore_paths=['/login', '/search', '/blog', '/api'],
        max_pages=5000,
        page_timeout=30000,
        max_retries=3,
        log_level='INFO',
        state_dir='_meta'
    )
    
    config.to_yaml(output_path)
    print(f"Sample configuration saved to: {output_path}")
    print("\nEdit the configuration file and add your documentation URLs to 'seeds'")


async def run_crawl(config_path: str):
    """Run the crawler with the specified configuration.
    
    Args:
        config_path: Path to configuration file
    """
    # Load configuration
    try:
        config = CrawlerConfig.from_yaml(config_path)
        config.validate()
    except FileNotFoundError:
        print(f"Error: Configuration file not found: {config_path}")
        print("\nGenerate a sample configuration with:")
        print(f"    python -m doc_crawler.cli generate-config {config_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)
    
    # Setup logger with configured level
    logger = setup_logger('doc_crawler', config.log_level)
    
    # Print configuration
    logger.info("=" * 50)
    logger.info("Documentation Crawler - Starting")
    logger.info("=" * 50)
    logger.info(f"Seeds: {', '.join(config.seeds)}")
    logger.info(f"Output directory: {config.output_dir}")
    logger.info(f"Max pages: {config.max_pages}")
    logger.info(f"Rate limit: {config.rate_limit_seconds}s")
    logger.info("=" * 50)
    
    # Create and run orchestrator
    orchestrator = CrawlerOrchestrator(config)
    await orchestrator.crawl()


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'crawl':
        if len(sys.argv) < 3:
            print("Error: Configuration file path required")
            print_usage()
            sys.exit(1)
        
        config_path = sys.argv[2]
        asyncio.run(run_crawl(config_path))
        
    elif command == 'generate-config':
        if len(sys.argv) < 3:
            print("Error: Output file path required")
            print_usage()
            sys.exit(1)
        
        output_path = sys.argv[2]
        generate_sample_config(output_path)
        
    else:
        print(f"Error: Unknown command '{command}'")
        print_usage()
        sys.exit(1)


if __name__ == '__main__':
    main()
