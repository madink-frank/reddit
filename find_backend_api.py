#!/usr/bin/env python3
"""
Railway 프로젝트에서 백엔드 API 서버를 찾는 스크립트
"""

import requests
import json
from typing import List, Dict

# 가능한 백엔드 API URL 패턴들
POSSIBLE_URLS = [
    "https://reddit-crawling-production.up.railway.app",
    "https://backend-production.up.railway.app", 
    "https://api-production.up.railway.app",
    "https://fastapi-production.up.railway.app",
    "https://reddit-api-production.up.railway.app",
    "https://web-production.up.railway.app",
    "https://app-production.up.railway.app"
]

def test_url(url: str) -> Dict:
    """URL 테스트"""
    try:
        print(f"🔍 테스트 중: {url}")
        response = requests.get(url, timeout=10)
        
        result = {
            "url": url,
            "status_code": response.status_code,
            "accessible": True,
            "content_type": response.headers.get("content-type", ""),
            "server": response.headers.get("server", "")
        }
        
        if response.status_code == 200:
            print(f"✅ 성공: {url} (상태코드: {response.status_code})")
        else:
            print(f"⚠️  응답: {url} (상태코드: {response.status_code})")
            
        return result
        
    except requests.exceptions.ConnectionError:
        print(f"❌ 연결 실패: {url}")
        return {"url": url, "accessible": False, "error": "Connection failed"}
    except requests.exceptions.Timeout:
        print(f"⏰ 시간 초과: {url}")
        return {"url": url, "accessible": False, "error": "Timeout"}
    except Exception as e:
        print(f"❌ 오류: {url} - {str(e)}")
        return {"url": url, "accessible": False, "error": str(e)}

def test_api_endpoints(base_url: str) -> Dict:
    """API 엔드포인트 테스트"""
    endpoints = [
        "/",
        "/health",
        "/docs",
        "/api/v1/health",
        "/api/health"
    ]
    
    results = {}
    for endpoint in endpoints:
        full_url = base_url.rstrip('/') + endpoint
        try:
            response = requests.get(full_url, timeout=5)
            results[endpoint] = {
                "status_code": response.status_code,
                "accessible": True
            }
            print(f"  📍 {endpoint}: {response.status_code}")
        except:
            results[endpoint] = {"accessible": False}
            print(f"  📍 {endpoint}: 접근 불가")
    
    return results

def main():
    print("🔍 Railway 백엔드 API 서버 찾기")
    print("=" * 50)
    
    accessible_urls = []
    
    for url in POSSIBLE_URLS:
        result = test_url(url)
        if result.get("accessible"):
            accessible_urls.append(result)
    
    print("\n📊 결과 요약:")
    print("=" * 50)
    
    if accessible_urls:
        print(f"✅ 접근 가능한 URL: {len(accessible_urls)}개")
        for result in accessible_urls:
            print(f"  🌐 {result['url']} (상태코드: {result['status_code']})")
            
            # API 엔드포인트 테스트
            if result['status_code'] in [200, 404, 422]:  # API 서버일 가능성이 있는 상태코드
                print(f"    🧪 API 엔드포인트 테스트:")
                test_api_endpoints(result['url'])
    else:
        print("❌ 접근 가능한 URL을 찾지 못했습니다.")
        print("\n💡 다음 방법을 시도해보세요:")
        print("1. Railway 대시보드에서 서비스 URL 확인")
        print("2. railway domain 명령어로 도메인 확인")
        print("3. railway logs로 서비스 로그 확인")

if __name__ == "__main__":
    main()