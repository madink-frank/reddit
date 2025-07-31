#!/usr/bin/env python3
"""
배포된 Reddit Content Platform API 테스트 스크립트
"""

import requests
import json
import sys
from datetime import datetime

# 배포된 API 도메인 (로그에서 확인됨)
API_DOMAINS = [
    "https://redis-production-3a49.up.railway.app",
]

def test_api_endpoint(base_url):
    """API 엔드포인트 테스트"""
    print(f"\n🧪 API 테스트 시작: {base_url}")
    print("=" * 60)
    
    try:
        # 1. Health Check
        print("🔍 Health Check 테스트...")
        health_response = requests.get(f"{base_url}/health", timeout=10)
        if health_response.status_code == 200:
            print("✅ Health Check 성공!")
            print(f"   응답: {health_response.json()}")
        else:
            print(f"❌ Health Check 실패: {health_response.status_code}")
            return False
            
        # 2. API 문서 확인
        print("\n📚 API 문서 확인...")
        docs_response = requests.get(f"{base_url}/docs", timeout=10)
        if docs_response.status_code == 200:
            print("✅ API 문서 접근 가능!")
        else:
            print(f"⚠️ API 문서 접근 불가: {docs_response.status_code}")
            
        # 3. 기본 엔드포인트 테스트
        print("\n🚀 기본 엔드포인트 테스트...")
        root_response = requests.get(f"{base_url}/", timeout=10)
        if root_response.status_code == 200:
            print("✅ 루트 엔드포인트 성공!")
            print(f"   응답: {root_response.json()}")
        else:
            print(f"❌ 루트 엔드포인트 실패: {root_response.status_code}")
            
        # 4. Reddit API 연결 테스트 (인증 없이)
        print("\n🔗 Reddit API 연결 테스트...")
        try:
            reddit_test_response = requests.get(f"{base_url}/api/v1/reddit/test", timeout=15)
            if reddit_test_response.status_code == 200:
                print("✅ Reddit API 연결 테스트 성공!")
                print(f"   응답: {reddit_test_response.json()}")
            else:
                print(f"⚠️ Reddit API 연결 테스트: {reddit_test_response.status_code}")
        except Exception as e:
            print(f"⚠️ Reddit API 테스트 중 오류: {str(e)}")
            
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"❌ 연결 실패: {base_url}에 연결할 수 없습니다.")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ 타임아웃: {base_url} 응답 시간 초과")
        return False
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {str(e)}")
        return False

def main():
    """메인 테스트 함수"""
    print("🚀 Reddit Content Platform API 배포 테스트")
    print(f"⏰ 테스트 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    success_count = 0
    total_count = len(API_DOMAINS)
    
    for domain in API_DOMAINS:
        if test_api_endpoint(domain):
            success_count += 1
            
    print("\n" + "=" * 60)
    print("📊 테스트 결과 요약:")
    print(f"   성공: {success_count}/{total_count}")
    
    if success_count > 0:
        print("🎉 배포된 API 서버를 찾았습니다!")
        return True
    else:
        print("❌ 접근 가능한 API 서버를 찾지 못했습니다.")
        print("💡 Railway 웹 콘솔에서 실제 도메인을 확인해주세요.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)