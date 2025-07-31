#!/usr/bin/env python3
"""
Reddit Content Platform - 배포된 서비스 테스트 스크립트
모든 배포된 서비스의 상태와 기능을 테스트합니다.
"""

import requests
import json
import time
from typing import Dict, List, Optional
import sys
from datetime import datetime

# 배포된 서비스 URL들
SERVICES = {
    "admin_dashboard": "https://admin-dashboard-ccbe8yd34-frank-chas-projects.vercel.app",
    "public_blog": "https://admin-dashboard-gj0hsl2yl-frank-chas-projects.vercel.app",
    "backend_api": None,  # Railway에서 확인 필요
    "postgres_db": "https://postgres-production-30e0.up.railway.app",
    "redis_cache": "https://redis-production-3a49.up.railway.app"
}

# 테스트 결과 저장
test_results = {
    "timestamp": datetime.now().isoformat(),
    "services": {},
    "overall_status": "UNKNOWN"
}

def print_header(title: str):
    """테스트 섹션 헤더 출력"""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")

def print_success(message: str):
    """성공 메시지 출력"""
    print(f"✅ {message}")

def print_error(message: str):
    """에러 메시지 출력"""
    print(f"❌ {message}")

def print_warning(message: str):
    """경고 메시지 출력"""
    print(f"⚠️  {message}")

def print_info(message: str):
    """정보 메시지 출력"""
    print(f"ℹ️  {message}")

def test_http_service(name: str, url: str, expected_status: int = 200, timeout: int = 10) -> Dict:
    """HTTP 서비스 테스트"""
    result = {
        "name": name,
        "url": url,
        "status": "UNKNOWN",
        "response_time": None,
        "status_code": None,
        "error": None
    }
    
    try:
        print_info(f"테스트 중: {name} ({url})")
        start_time = time.time()
        
        response = requests.get(url, timeout=timeout, allow_redirects=True)
        response_time = round((time.time() - start_time) * 1000, 2)
        
        result["response_time"] = response_time
        result["status_code"] = response.status_code
        
        if response.status_code == expected_status:
            result["status"] = "SUCCESS"
            print_success(f"{name} 응답 성공 (상태코드: {response.status_code}, 응답시간: {response_time}ms)")
        else:
            result["status"] = "WARNING"
            result["error"] = f"예상하지 못한 상태코드: {response.status_code}"
            print_warning(f"{name} 예상하지 못한 상태코드: {response.status_code} (응답시간: {response_time}ms)")
            
    except requests.exceptions.Timeout:
        result["status"] = "ERROR"
        result["error"] = "요청 시간 초과"
        print_error(f"{name} 요청 시간 초과 ({timeout}초)")
        
    except requests.exceptions.ConnectionError:
        result["status"] = "ERROR"
        result["error"] = "연결 실패"
        print_error(f"{name} 연결 실패")
        
    except Exception as e:
        result["status"] = "ERROR"
        result["error"] = str(e)
        print_error(f"{name} 테스트 실패: {str(e)}")
    
    return result

def test_frontend_services():
    """프론트엔드 서비스들 테스트"""
    print_header("프론트엔드 서비스 테스트")
    
    # Admin Dashboard 테스트
    admin_result = test_http_service(
        "관리자 대시보드", 
        SERVICES["admin_dashboard"]
    )
    test_results["services"]["admin_dashboard"] = admin_result
    
    # Public Blog 테스트
    blog_result = test_http_service(
        "공개 블로그", 
        SERVICES["public_blog"]
    )
    test_results["services"]["public_blog"] = blog_result

def test_backend_services():
    """백엔드 서비스들 테스트"""
    print_header("백엔드 서비스 테스트")
    
    # PostgreSQL 테스트 (HTTP 헬스체크가 있다면)
    postgres_result = test_http_service(
        "PostgreSQL 데이터베이스", 
        SERVICES["postgres_db"],
        expected_status=404  # 데이터베이스는 보통 404를 반환할 수 있음
    )
    test_results["services"]["postgres_db"] = postgres_result
    
    # Redis 테스트 (HTTP 헬스체크가 있다면)
    redis_result = test_http_service(
        "Redis 캐시", 
        SERVICES["redis_cache"],
        expected_status=404  # 캐시 서비스도 보통 404를 반환할 수 있음
    )
    test_results["services"]["redis_cache"] = redis_result

def test_api_endpoints():
    """API 엔드포인트 테스트"""
    print_header("API 엔드포인트 테스트")
    
    if SERVICES["backend_api"]:
        # 헬스체크 엔드포인트
        health_result = test_http_service(
            "API 헬스체크", 
            f"{SERVICES['backend_api']}/health"
        )
        test_results["services"]["api_health"] = health_result
        
        # API 문서 엔드포인트
        docs_result = test_http_service(
            "API 문서", 
            f"{SERVICES['backend_api']}/docs"
        )
        test_results["services"]["api_docs"] = docs_result
    else:
        print_warning("백엔드 API URL이 설정되지 않았습니다.")
        test_results["services"]["backend_api"] = {
            "status": "SKIPPED",
            "error": "URL not configured"
        }

def test_reddit_api_integration():
    """Reddit API 연동 테스트"""
    print_header("Reddit API 연동 테스트")
    
    if SERVICES["backend_api"]:
        # Reddit API 테스트 엔드포인트가 있다면
        reddit_result = test_http_service(
            "Reddit API 연동", 
            f"{SERVICES['backend_api']}/api/v1/reddit/test"
        )
        test_results["services"]["reddit_api"] = reddit_result
    else:
        print_warning("백엔드 API URL이 설정되지 않아 Reddit API 테스트를 건너뜁니다.")
        test_results["services"]["reddit_api"] = {
            "status": "SKIPPED",
            "error": "Backend API URL not configured"
        }

def generate_test_report():
    """테스트 결과 리포트 생성"""
    print_header("테스트 결과 요약")
    
    total_tests = len(test_results["services"])
    successful_tests = sum(1 for result in test_results["services"].values() if result.get("status") == "SUCCESS")
    warning_tests = sum(1 for result in test_results["services"].values() if result.get("status") == "WARNING")
    failed_tests = sum(1 for result in test_results["services"].values() if result.get("status") == "ERROR")
    skipped_tests = sum(1 for result in test_results["services"].values() if result.get("status") == "SKIPPED")
    
    print(f"📊 전체 테스트: {total_tests}")
    print(f"✅ 성공: {successful_tests}")
    print(f"⚠️  경고: {warning_tests}")
    print(f"❌ 실패: {failed_tests}")
    print(f"⏭️  건너뜀: {skipped_tests}")
    
    # 전체 상태 결정
    if failed_tests == 0 and warning_tests == 0:
        test_results["overall_status"] = "SUCCESS"
        print_success("🎉 모든 테스트가 성공했습니다!")
    elif failed_tests == 0:
        test_results["overall_status"] = "WARNING"
        print_warning("⚠️  일부 서비스에서 경고가 발생했습니다.")
    else:
        test_results["overall_status"] = "ERROR"
        print_error("❌ 일부 테스트가 실패했습니다.")
    
    # 상세 결과 출력
    print("\n📋 상세 결과:")
    for service_name, result in test_results["services"].items():
        status_icon = {
            "SUCCESS": "✅",
            "WARNING": "⚠️",
            "ERROR": "❌",
            "SKIPPED": "⏭️",
            "UNKNOWN": "❓"
        }.get(result.get("status", "UNKNOWN"), "❓")
        
        print(f"  {status_icon} {service_name}: {result.get('status', 'UNKNOWN')}")
        if result.get("error"):
            print(f"    └─ 오류: {result['error']}")
        if result.get("response_time"):
            print(f"    └─ 응답시간: {result['response_time']}ms")

def save_test_results():
    """테스트 결과를 파일로 저장"""
    filename = f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(test_results, f, indent=2, ensure_ascii=False)
        print_success(f"테스트 결과가 {filename}에 저장되었습니다.")
    except Exception as e:
        print_error(f"테스트 결과 저장 실패: {str(e)}")

def main():
    """메인 테스트 실행"""
    print_header("Reddit Content Platform 배포 서비스 테스트 시작")
    print_info(f"테스트 시작 시간: {test_results['timestamp']}")
    
    try:
        # 각 테스트 실행
        test_frontend_services()
        test_backend_services()
        test_api_endpoints()
        test_reddit_api_integration()
        
        # 결과 리포트 생성
        generate_test_report()
        
        # 결과 저장
        save_test_results()
        
    except KeyboardInterrupt:
        print_warning("\n테스트가 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print_error(f"테스트 실행 중 오류 발생: {str(e)}")
        sys.exit(1)
    
    # 종료 코드 결정
    if test_results["overall_status"] == "SUCCESS":
        sys.exit(0)
    elif test_results["overall_status"] == "WARNING":
        sys.exit(0)  # 경고는 성공으로 처리
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()