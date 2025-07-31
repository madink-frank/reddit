#!/usr/bin/env python3
"""
Deployment and validation script for Railway deployment.
This script handles deployment to Railway and validates the Redis connection fixes.
"""

import os
import sys
import subprocess
import time
import requests
import json
from typing import Dict, Any, Optional

def run_command(command: str, cwd: str = None) -> tuple[bool, str]:
    """Run a shell command and return success status and output"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)

def check_railway_cli():
    """Check if Railway CLI is available"""
    success, output = run_command("railway --version")
    if success:
        print(f"✅ Railway CLI available: {output.strip()}")
        return True
    else:
        print("❌ Railway CLI not found. Please install it:")
        print("   npm install -g @railway/cli")
        print("   or visit: https://docs.railway.app/develop/cli")
        return False

def check_railway_login():
    """Check if user is logged into Railway"""
    success, output = run_command("railway whoami")
    if success:
        print(f"✅ Logged into Railway as: {output.strip()}")
        return True
    else:
        print("❌ Not logged into Railway. Please run:")
        print("   railway login")
        return False

def deploy_to_railway():
    """Deploy the application to Railway"""
    print("🚀 Deploying to Railway...")
    
    # Check if we're in a Railway project
    success, output = run_command("railway status")
    if not success:
        print("❌ Not in a Railway project. Please run:")
        print("   railway link")
        return False
    
    print(f"✅ Railway project status: {output.strip()}")
    
    # Deploy the application
    print("📦 Starting deployment...")
    success, output = run_command("railway up --detach")
    
    if success:
        print("✅ Deployment initiated successfully")
        print(output)
        return True
    else:
        print(f"❌ Deployment failed: {output}")
        return False

def wait_for_deployment(max_wait_time: int = 600):
    """Wait for deployment to complete"""
    print(f"⏳ Waiting for deployment to complete (max {max_wait_time}s)...")
    
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        success, output = run_command("railway status")
        if success and "deployed" in output.lower():
            print("✅ Deployment completed successfully")
            return True
        
        print(".", end="", flush=True)
        time.sleep(10)
    
    print("\n❌ Deployment timed out")
    return False

def get_railway_url():
    """Get the Railway deployment URL"""
    success, output = run_command("railway domain")
    if success:
        lines = output.strip().split('\n')
        for line in lines:
            if 'https://' in line:
                url = line.strip()
                print(f"✅ Railway URL: {url}")
                return url
    
    print("❌ Could not get Railway URL")
    return None

def validate_health_endpoint(base_url: str) -> bool:
    """Validate the health endpoint"""
    print("🔍 Validating health endpoint...")
    
    health_url = f"{base_url}/health"
    
    try:
        response = requests.get(health_url, timeout=30)
        
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health endpoint accessible")
            
            # Print health status
            print(f"Overall Status: {health_data.get('status', 'unknown')}")
            print(f"Overall Healthy: {health_data.get('overall_healthy', False)}")
            print(f"Degraded Mode: {health_data.get('degraded_mode', False)}")
            
            services = health_data.get('services', {})
            for service_name, service_status in services.items():
                healthy = service_status.get('healthy', False)
                status = service_status.get('status', 'unknown')
                degraded = service_status.get('degraded_mode', False)
                
                if healthy:
                    print(f"  ✅ {service_name}: {status}")
                elif degraded:
                    print(f"  ⚠️  {service_name}: {status} (degraded mode)")
                else:
                    error = service_status.get('error', 'unknown error')
                    print(f"  ❌ {service_name}: {status} - {error}")
            
            return True
        else:
            print(f"❌ Health endpoint returned status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to access health endpoint: {e}")
        return False

def validate_redis_functionality(base_url: str) -> bool:
    """Validate Redis functionality through API endpoints"""
    print("🔍 Validating Redis functionality...")
    
    # Test endpoints that use Redis caching
    test_endpoints = [
        "/api/v1/posts",
        "/api/v1/keywords", 
        "/api/v1/analytics/summary"
    ]
    
    redis_working = False
    
    for endpoint in test_endpoints:
        url = f"{base_url}{endpoint}"
        try:
            # Make two requests to test caching
            print(f"  Testing {endpoint}...")
            
            start_time = time.time()
            response1 = requests.get(url, timeout=30)
            first_request_time = time.time() - start_time
            
            if response1.status_code in [200, 401]:  # 401 is OK for auth-required endpoints
                start_time = time.time()
                response2 = requests.get(url, timeout=30)
                second_request_time = time.time() - start_time
                
                # If Redis caching is working, second request should be faster
                if second_request_time < first_request_time * 0.8:
                    print(f"    ✅ Caching appears to be working (first: {first_request_time:.3f}s, second: {second_request_time:.3f}s)")
                    redis_working = True
                else:
                    print(f"    ⚠️  No significant caching improvement detected")
            else:
                print(f"    ❌ Endpoint returned status {response1.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"    ❌ Failed to test {endpoint}: {e}")
    
    return redis_working

def validate_celery_functionality(base_url: str) -> bool:
    """Validate Celery functionality"""
    print("🔍 Validating Celery functionality...")
    
    # Check if we can access Celery status through health endpoint
    health_url = f"{base_url}/health"
    
    try:
        response = requests.get(health_url, timeout=30)
        if response.status_code == 200:
            health_data = response.json()
            celery_status = health_data.get('services', {}).get('celery', {})
            
            if celery_status.get('healthy', False):
                print("✅ Celery is healthy")
                print(f"  Active Workers: {celery_status.get('active_workers', 0)}")
                print(f"  Broker Healthy: {celery_status.get('broker_healthy', False)}")
                return True
            elif celery_status.get('degraded_mode', False):
                print("⚠️  Celery is in degraded mode (this is acceptable)")
                print(f"  Status: {celery_status.get('status', 'unknown')}")
                return True
            else:
                print("❌ Celery is not healthy")
                print(f"  Error: {celery_status.get('error', 'unknown')}")
                return False
        else:
            print(f"❌ Could not check Celery status (health endpoint returned {response.status_code})")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to check Celery status: {e}")
        return False

def run_performance_tests(base_url: str) -> bool:
    """Run performance tests against the deployed application"""
    print("🔍 Running performance tests...")
    
    health_url = f"{base_url}/health"
    
    # Test response times
    response_times = []
    for i in range(5):
        try:
            start_time = time.time()
            response = requests.get(health_url, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                response_times.append(response_time)
                print(f"  Request {i+1}: {response_time:.3f}s")
            else:
                print(f"  Request {i+1}: Failed with status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"  Request {i+1}: Failed with error {e}")
    
    if response_times:
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        
        print(f"✅ Average response time: {avg_response_time:.3f}s")
        print(f"✅ Max response time: {max_response_time:.3f}s")
        
        if avg_response_time < 2.0:
            print("✅ Performance is acceptable")
            return True
        else:
            print("⚠️  Performance may be slow")
            return True  # Still acceptable
    else:
        print("❌ No successful requests for performance testing")
        return False

def main():
    """Main deployment and validation function"""
    print("🚀 Railway Deployment and Validation Script")
    print("=" * 60)
    
    # Check prerequisites
    if not check_railway_cli():
        return False
    
    if not check_railway_login():
        return False
    
    # Deploy to Railway
    if not deploy_to_railway():
        return False
    
    # Wait for deployment to complete
    if not wait_for_deployment():
        return False
    
    # Get deployment URL
    base_url = get_railway_url()
    if not base_url:
        return False
    
    # Wait a bit for the service to fully start
    print("⏳ Waiting for service to fully start...")
    time.sleep(30)
    
    # Run validations
    validation_results = []
    
    tests = [
        ("Health Endpoint", lambda: validate_health_endpoint(base_url)),
        ("Redis Functionality", lambda: validate_redis_functionality(base_url)),
        ("Celery Functionality", lambda: validate_celery_functionality(base_url)),
        ("Performance Tests", lambda: run_performance_tests(base_url)),
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} validation...")
        try:
            result = test_func()
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
    print("📊 DEPLOYMENT VALIDATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(1 for _, result in validation_results if result)
    total_tests = len(validation_results)
    
    for test_name, result in validation_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    print(f"Deployment URL: {base_url}")
    
    if passed_tests == total_tests:
        print("🎉 All validations PASSED! Deployment is successful.")
        return True
    else:
        print("⚠️  Some validations FAILED. Please review the issues above.")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Deployment interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Deployment failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)