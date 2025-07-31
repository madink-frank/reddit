#!/usr/bin/env python3
"""
Deployment validation script for Redis connection fix.
This script validates that all Redis and Celery configurations are working properly.
"""

import asyncio
import sys
import os
import time
import json
from datetime import datetime
from typing import Dict, Any, List

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

async def validate_redis_connection():
    """Validate Redis connection and operations"""
    print("🔍 Validating Redis Connection...")
    
    try:
        from app.utils.redis_client import get_redis_client
        
        redis_client = await get_redis_client()
        
        # Test 1: Basic connection and ping
        print("  ✓ Testing Redis ping...")
        ping_result = await redis_client.ping()
        if not ping_result:
            print("  ❌ Redis ping failed")
            return False
        print(f"  ✅ Redis ping successful")
        
        # Test 2: Basic read/write operations
        print("  ✓ Testing Redis read/write operations...")
        test_key = "deployment_test_key"
        test_value = {"test": "data", "timestamp": datetime.utcnow().isoformat()}
        
        # Set operation
        set_result = await redis_client.set(test_key, test_value, expire=60)
        if not set_result:
            print("  ❌ Redis set operation failed")
            return False
        
        # Get operation
        retrieved_value = await redis_client.get(test_key)
        if retrieved_value != test_value:
            print(f"  ❌ Redis get operation failed. Expected: {test_value}, Got: {retrieved_value}")
            return False
        
        # Delete operation
        delete_result = await redis_client.delete(test_key)
        if not delete_result:
            print("  ❌ Redis delete operation failed")
            return False
        
        print("  ✅ Redis read/write operations successful")
        
        # Test 3: Performance metrics
        print("  ✓ Testing Redis performance metrics...")
        perf_stats = redis_client.get_performance_stats()
        if not isinstance(perf_stats, dict):
            print("  ❌ Redis performance stats not available")
            return False
        
        print(f"  ✅ Redis performance stats available: {perf_stats.get('total_operations', 0)} operations")
        
        # Test 4: Connection pool stats
        print("  ✓ Testing Redis connection pool...")
        pool_stats = await redis_client.get_connection_pool_stats()
        if "error" in pool_stats:
            print(f"  ❌ Redis connection pool error: {pool_stats['error']}")
            return False
        
        print(f"  ✅ Redis connection pool healthy: {pool_stats.get('pool_max_connections', 0)} max connections")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Redis validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def validate_celery_configuration():
    """Validate Celery configuration and connectivity"""
    print("🔍 Validating Celery Configuration...")
    
    try:
        from app.core.celery_app import celery_app
        
        # Test 1: Celery app configuration
        print("  ✓ Testing Celery app configuration...")
        if not celery_app:
            print("  ❌ Celery app not configured")
            return False
        
        print(f"  ✅ Celery app configured with broker: {celery_app.conf.broker_url}")
        
        # Test 2: Broker connection
        print("  ✓ Testing Celery broker connection...")
        try:
            with celery_app.connection_or_acquire() as conn:
                conn.ensure_connection(max_retries=3)
            print("  ✅ Celery broker connection successful")
        except Exception as e:
            print(f"  ❌ Celery broker connection failed: {e}")
            return False
        
        # Test 3: Worker inspection (may not have workers in local testing)
        print("  ✓ Testing Celery worker inspection...")
        try:
            inspect = celery_app.control.inspect()
            active_workers = inspect.active()
            if active_workers:
                worker_count = len(active_workers)
                print(f"  ✅ Found {worker_count} active Celery workers")
            else:
                print("  ⚠️  No active Celery workers found (this is expected in local testing)")
        except Exception as e:
            print(f"  ⚠️  Celery worker inspection failed: {e} (this is expected in local testing)")
        
        # Test 4: Task registration
        print("  ✓ Testing Celery task registration...")
        registered_tasks = list(celery_app.tasks.keys())
        task_count = len([t for t in registered_tasks if not t.startswith('celery.')])
        print(f"  ✅ Found {task_count} registered tasks")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Celery validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def validate_health_checks():
    """Validate health check endpoints"""
    print("🔍 Validating Health Check System...")
    
    try:
        from app.services.health_check_service import health_service
        
        # Test 1: Overall health status
        print("  ✓ Testing overall health status...")
        health_status = await health_service.get_health_status(include_details=True)
        
        if not isinstance(health_status, dict):
            print("  ❌ Health status not returned as dictionary")
            return False
        
        print(f"  ✅ Health status retrieved: {health_status.get('status', 'unknown')}")
        
        # Test 2: Individual service checks
        print("  ✓ Testing individual service health checks...")
        services = health_status.get('services', {})
        
        for service_name, service_status in services.items():
            healthy = service_status.get('healthy', False)
            degraded = service_status.get('degraded_mode', False)
            status_text = service_status.get('status', 'unknown')
            
            if healthy:
                print(f"    ✅ {service_name}: {status_text}")
            elif degraded:
                print(f"    ⚠️  {service_name}: {status_text} (degraded mode)")
            else:
                error = service_status.get('error', 'unknown error')
                print(f"    ❌ {service_name}: {status_text} - {error}")
        
        # Test 3: Performance metrics in health checks
        redis_status = services.get('redis', {})
        if 'performance_metrics' in redis_status:
            perf = redis_status['performance_metrics']
            print(f"  ✅ Redis performance metrics in health check: {perf.get('average_response_time_ms', 0)}ms avg")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Health check validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def validate_error_handling():
    """Validate error handling and resilience"""
    print("🔍 Validating Error Handling and Resilience...")
    
    try:
        from app.utils.redis_client import get_redis_client
        
        redis_client = await get_redis_client()
        
        # Test 1: Graceful degradation when Redis operations fail
        print("  ✓ Testing graceful degradation...")
        
        # Test getting a non-existent key (should not raise exception)
        result = await redis_client.get("non_existent_key_12345")
        if result is not None:
            print("  ⚠️  Expected None for non-existent key")
        else:
            print("  ✅ Graceful handling of non-existent keys")
        
        # Test 2: Performance monitoring during operations
        print("  ✓ Testing performance monitoring...")
        
        # Perform several operations to generate metrics
        for i in range(5):
            await redis_client.set(f"perf_test_{i}", f"value_{i}", expire=10)
            await redis_client.get(f"perf_test_{i}")
            await redis_client.delete(f"perf_test_{i}")
        
        perf_stats = redis_client.get_performance_stats()
        if perf_stats.get('total_operations', 0) > 0:
            print(f"  ✅ Performance monitoring working: {perf_stats.get('total_operations')} operations tracked")
        else:
            print("  ⚠️  Performance monitoring may not be working properly")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error handling validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def validate_configuration():
    """Validate configuration settings"""
    print("🔍 Validating Configuration Settings...")
    
    try:
        from app.core.config import settings
        
        # Test 1: Redis URL configuration
        print("  ✓ Testing Redis URL configuration...")
        if not settings.REDIS_URL:
            print("  ❌ REDIS_URL not configured")
            return False
        
        print(f"  ✅ Redis URL configured: {settings.REDIS_URL[:20]}...")
        
        # Test 2: Celery configuration
        print("  ✓ Testing Celery configuration...")
        celery_broker = settings.CELERY_BROKER_URL or settings.REDIS_URL
        celery_backend = settings.CELERY_RESULT_BACKEND or settings.REDIS_URL
        
        if not celery_broker:
            print("  ❌ Celery broker URL not configured")
            return False
        
        if not celery_backend:
            print("  ❌ Celery result backend not configured")
            return False
        
        print(f"  ✅ Celery broker configured: {celery_broker[:20]}...")
        print(f"  ✅ Celery backend configured: {celery_backend[:20]}...")
        
        # Test 3: Environment detection
        print("  ✓ Testing environment detection...")
        is_railway = bool(os.getenv('RAILWAY_ENVIRONMENT'))
        is_production = os.getenv('NODE_ENV') == 'production'
        
        if is_railway:
            print("  ✅ Running in Railway environment")
        else:
            print("  ⚠️  Running in local development environment")
        
        if is_production:
            print("  ✅ Production environment detected")
        else:
            print("  ⚠️  Development environment detected")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Configuration validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def run_performance_tests():
    """Run performance tests to validate optimizations"""
    print("🔍 Running Performance Tests...")
    
    try:
        from app.utils.redis_client import get_redis_client
        
        redis_client = await get_redis_client()
        
        # Test 1: Latency test
        print("  ✓ Testing Redis latency...")
        latencies = []
        
        for i in range(10):
            start_time = time.time()
            await redis_client.ping()
            latency = (time.time() - start_time) * 1000  # Convert to ms
            latencies.append(latency)
        
        avg_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)
        
        print(f"  ✅ Average latency: {avg_latency:.2f}ms, Max latency: {max_latency:.2f}ms")
        
        if avg_latency > 100:
            print("  ⚠️  High average latency detected (>100ms)")
        
        # Test 2: Throughput test
        print("  ✓ Testing Redis throughput...")
        
        start_time = time.time()
        operations = 50
        
        for i in range(operations):
            await redis_client.set(f"throughput_test_{i}", f"value_{i}", expire=30)
        
        for i in range(operations):
            await redis_client.get(f"throughput_test_{i}")
        
        for i in range(operations):
            await redis_client.delete(f"throughput_test_{i}")
        
        total_time = time.time() - start_time
        ops_per_second = (operations * 3) / total_time  # 3 operations per iteration
        
        print(f"  ✅ Throughput: {ops_per_second:.2f} operations/second")
        
        if ops_per_second < 100:
            print("  ⚠️  Low throughput detected (<100 ops/sec)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Performance tests failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main validation function"""
    print("🚀 Starting Redis Connection Fix Deployment Validation")
    print("=" * 60)
    
    validation_results = []
    
    # Run all validation tests
    tests = [
        ("Configuration", validate_configuration),
        ("Redis Connection", validate_redis_connection),
        ("Celery Configuration", validate_celery_configuration),
        ("Health Checks", validate_health_checks),
        ("Error Handling", validate_error_handling),
        ("Performance Tests", run_performance_tests),
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} validation...")
        try:
            result = await test_func()
            validation_results.append((test_name, result))
            
            if result:
                print(f"✅ {test_name} validation PASSED")
            else:
                print(f"❌ {test_name} validation FAILED")
                
        except Exception as e:
            print(f"❌ {test_name} validation ERROR: {e}")
            validation_results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(1 for _, result in validation_results if result)
    total_tests = len(validation_results)
    
    for test_name, result in validation_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All validations PASSED! Deployment is ready.")
        return True
    else:
        print("⚠️  Some validations FAILED. Please review the issues above.")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Validation failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)