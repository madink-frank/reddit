#!/usr/bin/env python3
"""
Deployment monitoring script for Redis connection fix.
This script continuously monitors the deployed system to ensure Redis and Celery are working properly.
"""

import time
import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List

class DeploymentMonitor:
    def __init__(self, base_url: str, check_interval: int = 60):
        self.base_url = base_url.rstrip('/')
        self.check_interval = check_interval
        self.health_history = []
        self.alert_thresholds = {
            'consecutive_failures': 3,
            'response_time_threshold': 5.0,
            'error_rate_threshold': 0.1  # 10%
        }
    
    def check_health(self) -> Dict[str, Any]:
        """Check system health"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/health", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                health_data = response.json()
                health_data['response_time'] = response_time
                health_data['timestamp'] = datetime.utcnow().isoformat()
                health_data['success'] = True
                return health_data
            else:
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}",
                    'response_time': response_time,
                    'timestamp': datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response_time': None,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def check_redis_performance(self) -> Dict[str, Any]:
        """Check Redis performance through health endpoint"""
        health_data = self.check_health()
        
        if not health_data.get('success'):
            return {'success': False, 'error': 'Health check failed'}
        
        services = health_data.get('services', {})
        redis_status = services.get('redis', {})
        
        if redis_status.get('healthy'):
            perf_metrics = redis_status.get('performance_metrics', {})
            return {
                'success': True,
                'healthy': True,
                'response_time_ms': redis_status.get('response_time_ms', 0),
                'avg_response_time_ms': perf_metrics.get('average_response_time_ms', 0),
                'operations_per_second': perf_metrics.get('operations_per_second', 0),
                'error_rate_percent': perf_metrics.get('error_rate_percent', 0),
                'total_operations': perf_metrics.get('total_operations', 0)
            }
        else:
            return {
                'success': True,
                'healthy': False,
                'degraded_mode': redis_status.get('degraded_mode', False),
                'error': redis_status.get('error', 'Redis unhealthy')
            }
    
    def check_celery_status(self) -> Dict[str, Any]:
        """Check Celery status through health endpoint"""
        health_data = self.check_health()
        
        if not health_data.get('success'):
            return {'success': False, 'error': 'Health check failed'}
        
        services = health_data.get('services', {})
        celery_status = services.get('celery', {})
        
        return {
            'success': True,
            'healthy': celery_status.get('healthy', False),
            'active_workers': celery_status.get('active_workers', 0),
            'broker_healthy': celery_status.get('broker_healthy', False),
            'degraded_mode': celery_status.get('degraded_mode', False),
            'error': celery_status.get('error')
        }
    
    def analyze_trends(self) -> Dict[str, Any]:
        """Analyze health trends over time"""
        if len(self.health_history) < 2:
            return {'insufficient_data': True}
        
        recent_checks = self.health_history[-10:]  # Last 10 checks
        
        # Calculate success rate
        successful_checks = sum(1 for check in recent_checks if check.get('success'))
        success_rate = successful_checks / len(recent_checks)
        
        # Calculate average response time
        response_times = [check.get('response_time', 0) for check in recent_checks if check.get('response_time')]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Check for consecutive failures
        consecutive_failures = 0
        for check in reversed(recent_checks):
            if not check.get('success'):
                consecutive_failures += 1
            else:
                break
        
        return {
            'success_rate': success_rate,
            'avg_response_time': avg_response_time,
            'consecutive_failures': consecutive_failures,
            'total_checks': len(self.health_history),
            'recent_checks': len(recent_checks)
        }
    
    def should_alert(self, trends: Dict[str, Any]) -> List[str]:
        """Determine if alerts should be sent"""
        alerts = []
        
        if trends.get('insufficient_data'):
            return alerts
        
        # Check consecutive failures
        if trends['consecutive_failures'] >= self.alert_thresholds['consecutive_failures']:
            alerts.append(f"CRITICAL: {trends['consecutive_failures']} consecutive health check failures")
        
        # Check response time
        if trends['avg_response_time'] > self.alert_thresholds['response_time_threshold']:
            alerts.append(f"WARNING: High average response time: {trends['avg_response_time']:.2f}s")
        
        # Check success rate
        if trends['success_rate'] < (1 - self.alert_thresholds['error_rate_threshold']):
            alerts.append(f"WARNING: Low success rate: {trends['success_rate']:.1%}")
        
        return alerts
    
    def print_status(self, health_data: Dict[str, Any], redis_data: Dict[str, Any], celery_data: Dict[str, Any]):
        """Print current status"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"\n{'='*60}")
        print(f"System Status - {timestamp}")
        print(f"{'='*60}")
        
        # Overall health
        if health_data.get('success'):
            status = health_data.get('status', 'unknown')
            overall_healthy = health_data.get('overall_healthy', False)
            degraded_mode = health_data.get('degraded_mode', False)
            response_time = health_data.get('response_time', 0)
            
            status_icon = "✅" if overall_healthy else ("⚠️" if degraded_mode else "❌")
            print(f"{status_icon} Overall Status: {status} (Response: {response_time:.3f}s)")
            
            if degraded_mode:
                print("⚠️  System operating in degraded mode")
        else:
            print(f"❌ Health Check Failed: {health_data.get('error', 'Unknown error')}")
        
        # Redis status
        print(f"\n📊 Redis Status:")
        if redis_data.get('success'):
            if redis_data.get('healthy'):
                print(f"  ✅ Redis: Healthy")
                print(f"     Response Time: {redis_data.get('response_time_ms', 0):.2f}ms")
                print(f"     Avg Response: {redis_data.get('avg_response_time_ms', 0):.2f}ms")
                print(f"     Operations/sec: {redis_data.get('operations_per_second', 0):.2f}")
                print(f"     Error Rate: {redis_data.get('error_rate_percent', 0):.2f}%")
                print(f"     Total Operations: {redis_data.get('total_operations', 0)}")
            else:
                degraded = redis_data.get('degraded_mode', False)
                icon = "⚠️" if degraded else "❌"
                print(f"  {icon} Redis: {'Degraded' if degraded else 'Unhealthy'}")
                print(f"     Error: {redis_data.get('error', 'Unknown')}")
        else:
            print(f"  ❌ Redis check failed: {redis_data.get('error', 'Unknown')}")
        
        # Celery status
        print(f"\n🔄 Celery Status:")
        if celery_data.get('success'):
            if celery_data.get('healthy'):
                print(f"  ✅ Celery: Healthy")
                print(f"     Active Workers: {celery_data.get('active_workers', 0)}")
                print(f"     Broker Healthy: {celery_data.get('broker_healthy', False)}")
            else:
                degraded = celery_data.get('degraded_mode', False)
                icon = "⚠️" if degraded else "❌"
                print(f"  {icon} Celery: {'Degraded' if degraded else 'Unhealthy'}")
                print(f"     Active Workers: {celery_data.get('active_workers', 0)}")
                print(f"     Broker Healthy: {celery_data.get('broker_healthy', False)}")
                if celery_data.get('error'):
                    print(f"     Error: {celery_data['error']}")
        else:
            print(f"  ❌ Celery check failed: {celery_data.get('error', 'Unknown')}")
    
    def print_trends(self, trends: Dict[str, Any]):
        """Print trend analysis"""
        if trends.get('insufficient_data'):
            print("\n📈 Trends: Insufficient data for analysis")
            return
        
        print(f"\n📈 Trends (last {trends['recent_checks']} checks):")
        print(f"   Success Rate: {trends['success_rate']:.1%}")
        print(f"   Avg Response Time: {trends['avg_response_time']:.3f}s")
        print(f"   Consecutive Failures: {trends['consecutive_failures']}")
        print(f"   Total Checks: {trends['total_checks']}")
    
    def run_continuous_monitoring(self, duration_minutes: int = None):
        """Run continuous monitoring"""
        print(f"🔍 Starting continuous monitoring of {self.base_url}")
        print(f"Check interval: {self.check_interval} seconds")
        if duration_minutes:
            print(f"Duration: {duration_minutes} minutes")
        print("Press Ctrl+C to stop")
        
        start_time = time.time()
        check_count = 0
        
        try:
            while True:
                check_count += 1
                
                # Perform checks
                health_data = self.check_health()
                redis_data = self.check_redis_performance()
                celery_data = self.check_celery_status()
                
                # Store in history
                self.health_history.append(health_data)
                
                # Keep only last 100 checks in memory
                if len(self.health_history) > 100:
                    self.health_history = self.health_history[-100:]
                
                # Print status
                self.print_status(health_data, redis_data, celery_data)
                
                # Analyze trends
                trends = self.analyze_trends()
                self.print_trends(trends)
                
                # Check for alerts
                alerts = self.should_alert(trends)
                if alerts:
                    print(f"\n🚨 ALERTS:")
                    for alert in alerts:
                        print(f"   {alert}")
                
                # Check duration limit
                if duration_minutes:
                    elapsed_minutes = (time.time() - start_time) / 60
                    if elapsed_minutes >= duration_minutes:
                        print(f"\n✅ Monitoring completed after {elapsed_minutes:.1f} minutes")
                        break
                
                # Wait for next check
                print(f"\n⏳ Next check in {self.check_interval} seconds... (Check #{check_count})")
                time.sleep(self.check_interval)
                
        except KeyboardInterrupt:
            elapsed_minutes = (time.time() - start_time) / 60
            print(f"\n⚠️  Monitoring stopped by user after {elapsed_minutes:.1f} minutes")
            print(f"Total checks performed: {check_count}")

def main():
    """Main monitoring function"""
    if len(sys.argv) < 2:
        print("Usage: python monitor_deployment.py <base_url> [duration_minutes] [check_interval]")
        print("Example: python monitor_deployment.py https://myapp.railway.app 30 60")
        sys.exit(1)
    
    base_url = sys.argv[1]
    duration_minutes = int(sys.argv[2]) if len(sys.argv) > 2 else None
    check_interval = int(sys.argv[3]) if len(sys.argv) > 3 else 60
    
    monitor = DeploymentMonitor(base_url, check_interval)
    monitor.run_continuous_monitoring(duration_minutes)

if __name__ == "__main__":
    main()