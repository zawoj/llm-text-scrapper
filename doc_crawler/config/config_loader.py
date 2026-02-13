"""Configuration loading and validation."""

import yaml
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class CrawlerConfig:
    """Configuration for the documentation crawler."""
    
    # Seed URLs to start crawling from
    seeds: list[str] = field(default_factory=list)
    
    # Output directory for MDC files
    output_dir: str = "corpus"
    
    # Maximum number of concurrent requests
    max_concurrency: int = 5
    
    # Restart browser every N pages
    restart_browser_every: int = 50
    
    # Rate limit in seconds between requests
    rate_limit_seconds: float = 1.0
    
    # Paths to ignore during crawling
    ignore_paths: list[str] = field(default_factory=lambda: [
        '/login', '/search', '/blog', '/api'
    ])
    
    # Maximum number of pages to crawl (None for unlimited)
    max_pages: Optional[int] = 5000
    
    # Timeout for page loads in milliseconds
    page_timeout: int = 30000
    
    # Number of retries for failed requests
    max_retries: int = 3
    
    # Log level
    log_level: str = "INFO"
    
    # State directory for incremental crawling
    state_dir: str = "_meta"
    
    @classmethod
    def from_yaml(cls, path: str) -> 'CrawlerConfig':
        """Load configuration from YAML file.
        
        Args:
            path: Path to YAML configuration file
            
        Returns:
            CrawlerConfig instance
        """
        yaml_path = Path(path)
        
        if not yaml_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {path}")
        
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        
        if not data:
            raise ValueError(f"Empty configuration file: {path}")
        
        return cls(**data)
    
    def to_yaml(self, path: str) -> None:
        """Save configuration to YAML file.
        
        Args:
            path: Path to save YAML configuration
        """
        data = {
            'seeds': self.seeds,
            'output_dir': self.output_dir,
            'max_concurrency': self.max_concurrency,
            'restart_browser_every': self.restart_browser_every,
            'rate_limit_seconds': self.rate_limit_seconds,
            'ignore_paths': self.ignore_paths,
            'max_pages': self.max_pages,
            'page_timeout': self.page_timeout,
            'max_retries': self.max_retries,
            'log_level': self.log_level,
            'state_dir': self.state_dir,
        }
        
        yaml_path = Path(path)
        yaml_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(yaml_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    
    def validate(self) -> None:
        """Validate configuration values.
        
        Raises:
            ValueError: If configuration is invalid
        """
        if not self.seeds:
            raise ValueError("At least one seed URL is required")
        
        if self.max_concurrency < 1:
            raise ValueError("max_concurrency must be at least 1")
        
        if self.rate_limit_seconds < 0:
            raise ValueError("rate_limit_seconds cannot be negative")
        
        if self.max_pages is not None and self.max_pages < 1:
            raise ValueError("max_pages must be at least 1")
