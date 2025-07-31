#!/usr/bin/env python3
"""
Reddit API 연결 테스트 스크립트
"""

import requests
import base64
import json

# Reddit API 정보
CLIENT_ID = "Uk8KRyYRlAw50WhnN6JbTQ"
CLIENT_SECRET = "wpWuNikuElpauPM1h0_tAqFbB_KW4Q"
USER_AGENT = "RedditContentPlatform/1.0"

def test_basic_api():
    """기본 API 연결 테스트 (인증 없음)"""
    print("🔍 기본 API 연결 테스트...")
    
    headers = {
        'User-Agent': USER_AGENT
    }
    
    try:
        response = requests.get(
            'https://www.reddit.com/r/python/hot.json?limit=3',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            posts = data['data']['children']
            print(f"✅ 기본 API 연결 성공! 포스트 {len(posts)}개 수신")
            
            # 첫 번째 포스트 정보 출력
            if posts:
                first_post = posts[0]['data']
                print(f"   📝 첫 번째 포스트: {first_post['title'][:50]}...")
                print(f"   👍 점수: {first_post['score']}")
            
            return True
        else:
            print(f"❌ 기본 API 연결 실패: HTTP {response.status_code}")
            print(f"   응답: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ 기본 API 연결 오류: {e}")
        return False

def test_oauth_api():
    """OAuth 인증 API 테스트"""
    print("\n🔐 OAuth 인증 API 테스트...")
    
    # Basic Auth 헤더 생성
    auth_string = f"{CLIENT_ID}:{CLIENT_SECRET}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'client_credentials'
    }
    
    try:
        # Access Token 획득
        response = requests.post(
            'https://www.reddit.com/api/v1/access_token',
            headers=headers,
            data=data,
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            token_type = token_data.get('token_type', 'bearer')
            expires_in = token_data.get('expires_in', 0)
            
            print(f"✅ OAuth 토큰 획득 성공!")
            print(f"   🎫 토큰 타입: {token_type}")
            print(f"   ⏰ 만료 시간: {expires_in}초")
            print(f"   🔑 토큰: {access_token[:20]}...")
            
            # 인증된 API 호출 테스트
            return test_authenticated_api(access_token, token_type)
            
        else:
            print(f"❌ OAuth 토큰 획득 실패: HTTP {response.status_code}")
            print(f"   응답: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ OAuth 인증 오류: {e}")
        return False

def test_authenticated_api(access_token, token_type):
    """인증된 API 호출 테스트"""
    print("\n🚀 인증된 API 호출 테스트...")
    
    headers = {
        'Authorization': f'{token_type} {access_token}',
        'User-Agent': USER_AGENT
    }
    
    try:
        # 인증된 API로 데이터 요청
        response = requests.get(
            'https://oauth.reddit.com/r/python/hot?limit=3',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            posts = data['data']['children']
            print(f"✅ 인증된 API 호출 성공! 포스트 {len(posts)}개 수신")
            
            # Rate limit 정보 확인
            remaining = response.headers.get('x-ratelimit-remaining')
            reset_time = response.headers.get('x-ratelimit-reset')
            
            if remaining:
                print(f"   📊 남은 요청 수: {remaining}")
            if reset_time:
                print(f"   🔄 리셋 시간: {reset_time}초 후")
            
            return True
        else:
            print(f"❌ 인증된 API 호출 실패: HTTP {response.status_code}")
            print(f"   응답: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ 인증된 API 호출 오류: {e}")
        return False

def main():
    """메인 테스트 함수"""
    print("🧪 Reddit API 연결 테스트 시작")
    print("=" * 50)
    
    # 기본 API 테스트
    basic_success = test_basic_api()
    
    # OAuth API 테스트
    oauth_success = test_oauth_api()
    
    # 결과 요약
    print("\n" + "=" * 50)
    print("📊 테스트 결과 요약:")
    print(f"   기본 API: {'✅ 성공' if basic_success else '❌ 실패'}")
    print(f"   OAuth API: {'✅ 성공' if oauth_success else '❌ 실패'}")
    
    if basic_success and oauth_success:
        print("\n🎉 모든 Reddit API 테스트 성공!")
        print("   배포 준비가 완료되었습니다.")
        return True
    else:
        print("\n⚠️  일부 테스트 실패")
        print("   API 키 또는 설정을 확인해주세요.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)