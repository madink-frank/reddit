#!/usr/bin/env python3
"""
Production Monitoring Setup Script
Configures comprehensive monitoring for the Reddit Content Platform
"""

import os
import json
import requests
from typing import Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionMonitoringSetup:
    def __init__(self):
        self.config = self.load_config()
    
    def load_config(self) -> Dict:
        """Load monitoring configuration"""
        return {
            "sentry_dsn": os.getenv("SENTRY_DSN"),
            "slack_webhook": os.getenv("SLACK_WEBHOOK_URL"),
            "email_alerts": os.getenv("ALERT_EMAIL"),
            "backend_url": os.getenv("BACKEND_URL", "https://api.reddit-trends.com"),
            "admin_url": os.getenv("ADMIN_URL", "https://admin.reddit-trends.com"),
            "blog_url": os.getenv("BLOG_URL", "https://blog.reddit-trends.com"),
        }
    
    def setup_health_checks(self):
        """Setup health check monitoring"""
        health_checks = [
            {
                "name": "Backend API Health",
                "url": f"{self.config['backend_url']}/health",
                "method": "GET",
                "expected_status": 200,
                "timeout": 30,
                "interval": 60
            },
            {
                "name": "Backend API Database",
                "url": f"{self.config['backend_url']}/health/db",
                "method": "GET",
                "expected_status": 200,
                "timeout": 30,
                "interval": 300
            },
            {
                "name": "Backend API Redis",
                "url": f"{self.config['backend_url']}/health/redis",
                "method": "GET",
                "expected_status": 200,
                "timeout": 30,
                "interval": 300
            },
            {
                "name": "Admin Dashboard",
                "url": self.config['admin_url'],
                "method": "GET",
                "expected_status": 200,
                "timeout": 30,
                "interval": 300
            },
            {
                "name": "Public Blog",
                "url": self.config['blog_url'],
                "method": "GET",
                "expected_status": 200,
                "timeout": 30,
                "interval": 300
            }
        ]
        
        # Save health check configuration
        with open("monitoring/health-checks.json", "w") as f:
            json.dump(health_checks, f, indent=2)
        
        logger.info("Health check configuration saved")
        return health_checks
    
    def setup_performance_monitoring(self):
        """Setup performance monitoring thresholds"""
        performance_thresholds = {
            "api_response_time": {
                "warning": 500,  # ms
                "critical": 1000  # ms
            },
            "database_query_time": {
                "warning": 100,  # ms
                "critical": 500   # ms
            },
            "memory_usage": {
                "warning": 80,   # %
                "critical": 90   # %
            },
            "cpu_usage": {
                "warning": 70,   # %
                "critical": 85   # %
            },
            "disk_usage": {
                "warning": 80,   # %
                "critical": 90   # %
            },
            "error_rate": {
                "warning": 1,    # %
                "critical": 5    # %
            }
        }
        
        with open("monitoring/performance-thresholds.json", "w") as f:
            json.dump(performance_thresholds, f, indent=2)
        
        logger.info("Performance monitoring thresholds configured")
        return performance_thresholds
    
    def setup_log_monitoring(self):
        """Setup log monitoring and alerting"""
        log_patterns = {
            "error_patterns": [
                "ERROR",
                "CRITICAL",
                "Exception",
                "Traceback",
                "500 Internal Server Error",
                "Database connection failed",
                "Redis connection failed"
            ],
            "warning_patterns": [
                "WARNING",
                "WARN",
                "Deprecated",
                "Slow query",
                "High memory usage",
                "Rate limit exceeded"
            ],
            "security_patterns": [
                "Authentication failed",
                "Unauthorized access",
                "SQL injection attempt",
                "XSS attempt",
                "CSRF token mismatch"
            ]
        }
        
        with open("monitoring/log-patterns.json", "w") as f:
            json.dump(log_patterns, f, indent=2)
        
        logger.info("Log monitoring patterns configured")
        return log_patterns
    
    def setup_business_metrics(self):
        """Setup business metrics monitoring"""
        business_metrics = {
            "user_metrics": {
                "daily_active_users": {"threshold": 50, "trend": "increasing"},
                "new_registrations": {"threshold": 10, "trend": "stable"},
                "user_retention_rate": {"threshold": 70, "trend": "stable"}
            },
            "content_metrics": {
                "posts_crawled_daily": {"threshold": 1000, "trend": "stable"},
                "content_generated_daily": {"threshold": 10, "trend": "stable"},
                "blog_posts_published": {"threshold": 1, "trend": "stable"}
            },
            "engagement_metrics": {
                "blog_page_views": {"threshold": 100, "trend": "increasing"},
                "newsletter_subscriptions": {"threshold": 50, "trend": "increasing"},
                "comment_interactions": {"threshold": 20, "trend": "stable"}
            },
            "technical_metrics": {
                "api_requests_per_minute": {"threshold": 100, "trend": "stable"},
                "crawling_success_rate": {"threshold": 95, "trend": "stable"},
                "system_uptime": {"threshold": 99.5, "trend": "stable"}
            }
        }
        
        with open("monitoring/business-metrics.json", "w") as f:
            json.dump(business_metrics, f, indent=2)
        
        logger.info("Business metrics monitoring configured")
        return business_metrics
    
    def create_alert_rules(self):
        """Create alerting rules"""
        alert_rules = [
            {
                "name": "High Error Rate",
                "condition": "error_rate > 5%",
                "severity": "critical",
                "notification_channels": ["email", "slack"],
                "cooldown": 300  # 5 minutes
            },
            {
                "name": "API Response Time High",
                "condition": "avg_response_time > 1000ms",
                "severity": "warning",
                "notification_channels": ["slack"],
                "cooldown": 600  # 10 minutes
            },
            {
                "name": "Database Connection Failed",
                "condition": "database_health == false",
                "severity": "critical",
                "notification_channels": ["email", "slack", "sms"],
                "cooldown": 60   # 1 minute
            },
            {
                "name": "Memory Usage High",
                "condition": "memory_usage > 90%",
                "severity": "warning",
                "notification_channels": ["slack"],
                "cooldown": 900  # 15 minutes
            },
            {
                "name": "Crawling Failure Rate High",
                "condition": "crawling_failure_rate > 20%",
                "severity": "warning",
                "notification_channels": ["email"],
                "cooldown": 1800 # 30 minutes
            },
            {
                "name": "No Content Generated",
                "condition": "content_generated_24h == 0",
                "severity": "warning",
                "notification_channels": ["email"],
                "cooldown": 3600 # 1 hour
            }
        ]
        
        with open("monitoring/alert-rules.json", "w") as f:
            json.dump(alert_rules, f, indent=2)
        
        logger.info("Alert rules configured")
        return alert_rules
    
    def setup_dashboards(self):
        """Setup monitoring dashboards configuration"""
        dashboards = {
            "system_overview": {
                "panels": [
                    "system_health_status",
                    "api_response_times",
                    "error_rates",
                    "active_users",
                    "resource_usage"
                ]
            },
            "application_metrics": {
                "panels": [
                    "crawling_statistics",
                    "content_generation_stats",
                    "user_engagement_metrics",
                    "database_performance",
                    "cache_hit_rates"
                ]
            },
            "infrastructure": {
                "panels": [
                    "server_resources",
                    "database_metrics",
                    "redis_metrics",
                    "network_traffic",
                    "storage_usage"
                ]
            },
            "business_intelligence": {
                "panels": [
                    "user_growth",
                    "content_trends",
                    "engagement_trends",
                    "revenue_metrics",
                    "conversion_rates"
                ]
            }
        }
        
        with open("monitoring/dashboards.json", "w") as f:
            json.dump(dashboards, f, indent=2)
        
        logger.info("Dashboard configurations created")
        return dashboards
    
    def create_runbook(self):
        """Create incident response runbook"""
        runbook = {
            "incident_response": {
                "severity_levels": {
                    "critical": {
                        "response_time": "5 minutes",
                        "escalation": "immediate",
                        "actions": [
                            "Check system health dashboard",
                            "Verify service availability",
                            "Check error logs",
                            "Notify on-call engineer",
                            "Create incident ticket"
                        ]
                    },
                    "warning": {
                        "response_time": "30 minutes",
                        "escalation": "if unresolved in 2 hours",
                        "actions": [
                            "Investigate root cause",
                            "Monitor trends",
                            "Document findings",
                            "Apply fixes if needed"
                        ]
                    }
                }
            },
            "common_issues": {
                "database_connection_failed": {
                    "symptoms": ["Health check failures", "500 errors", "Timeout errors"],
                    "investigation": [
                        "Check database server status",
                        "Verify connection pool settings",
                        "Check network connectivity",
                        "Review database logs"
                    ],
                    "resolution": [
                        "Restart database connection pool",
                        "Scale database resources if needed",
                        "Check for long-running queries",
                        "Verify database credentials"
                    ]
                },
                "high_response_times": {
                    "symptoms": ["Slow API responses", "User complaints", "Timeout errors"],
                    "investigation": [
                        "Check server resources",
                        "Review slow query logs",
                        "Check cache hit rates",
                        "Monitor network latency"
                    ],
                    "resolution": [
                        "Optimize slow queries",
                        "Scale server resources",
                        "Clear cache if needed",
                        "Review code performance"
                    ]
                },
                "crawling_failures": {
                    "symptoms": ["No new content", "Crawling error logs", "Empty data"],
                    "investigation": [
                        "Check Reddit API status",
                        "Verify API credentials",
                        "Review crawling logs",
                        "Check rate limiting"
                    ],
                    "resolution": [
                        "Restart crawling workers",
                        "Update API credentials",
                        "Adjust rate limiting",
                        "Check keyword configurations"
                    ]
                }
            }
        }
        
        with open("monitoring/incident-runbook.json", "w") as f:
            json.dump(runbook, f, indent=2)
        
        logger.info("Incident response runbook created")
        return runbook
    
    def generate_monitoring_summary(self):
        """Generate monitoring setup summary"""
        summary = {
            "setup_date": "2025-01-22",
            "monitoring_components": [
                "Health checks",
                "Performance monitoring",
                "Log monitoring",
                "Business metrics",
                "Alert rules",
                "Dashboards",
                "Incident runbook"
            ],
            "notification_channels": [
                "Email alerts",
                "Slack notifications",
                "Dashboard alerts"
            ],
            "key_metrics": [
                "API response time",
                "Error rates",
                "System resources",
                "User engagement",
                "Content generation",
                "Crawling success rate"
            ],
            "next_steps": [
                "Configure external monitoring services",
                "Set up custom dashboards",
                "Test alert notifications",
                "Train team on runbook procedures",
                "Schedule regular monitoring reviews"
            ]
        }
        
        with open("monitoring/setup-summary.json", "w") as f:
            json.dump(summary, f, indent=2)
        
        return summary
    
    def run_setup(self):
        """Run complete monitoring setup"""
        logger.info("Starting production monitoring setup...")
        
        # Create monitoring directory
        os.makedirs("monitoring", exist_ok=True)
        
        # Setup all monitoring components
        self.setup_health_checks()
        self.setup_performance_monitoring()
        self.setup_log_monitoring()
        self.setup_business_metrics()
        self.create_alert_rules()
        self.setup_dashboards()
        self.create_runbook()
        summary = self.generate_monitoring_summary()
        
        logger.info("Production monitoring setup completed!")
        logger.info("Configuration files created in ./monitoring/ directory")
        
        return summary

def main():
    """Main setup function"""
    setup = ProductionMonitoringSetup()
    summary = setup.run_setup()
    
    print("\n=== MONITORING SETUP SUMMARY ===")
    print(f"Setup completed on: {summary['setup_date']}")
    print(f"Components configured: {len(summary['monitoring_components'])}")
    print(f"Key metrics tracked: {len(summary['key_metrics'])}")
    
    print("\nNext steps:")
    for step in summary['next_steps']:
        print(f"  • {step}")
    
    print("\nConfiguration files created in ./monitoring/ directory")
    print("Please review and customize the configurations as needed.")

if __name__ == "__main__":
    main()