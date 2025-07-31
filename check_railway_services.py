#!/usr/bin/env python3
"""
Railway 프로젝트의 모든 서비스를 확인하는 스크립트
"""

import subprocess
import json
import re

def run_command(command):
    """명령어 실행"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def get_railway_services():
    """Railway 서비스 목록 확인"""
    print("🔍 Railway 서비스 확인 중...")
    
    # Railway 상태 확인
    stdout, stderr, code = run_command("railway status")
    if code == 0:
        print("✅ Railway 연결 상태:")
        print(stdout)
    else:
        print("❌ Railway 상태 확인 실패:")
        print(stderr)
        return
    
    print("\n" + "="*50)
    
    # 가능한 서비스 이름들로 연결 시도
    services_to_try = [
        "backend",
        "api", 
        "fastapi",
        "web",
        "app",
        "reddit-api",
        "reddit-backend",
        "main",
        "server"
    ]
    
    print("🔍 가능한 서비스들 확인 중...")
    
    for service_name in services_to_try:
        print(f"\n📍 '{service_name}' 서비스 연결 시도...")
        
        # 서비스 연결 시도 (자동으로 선택)
        command = f'echo "{service_name}" | railway service'
        stdout, stderr, code = run_command(command)
        
        if "Linked service" in stdout:
            print(f"✅ '{service_name}' 서비스 발견!")
            
            # 해당 서비스의 변수 확인
            print(f"📋 '{service_name}' 서비스 환경변수:")
            var_stdout, var_stderr, var_code = run_command("railway variables")
            if var_code == 0:
                # 도메인 관련 변수 찾기
                lines = var_stdout.split('\n')
                for line in lines:
                    if 'RAILWAY_PUBLIC_DOMAIN' in line or 'DOMAIN' in line or 'URL' in line:
                        print(f"  🌐 {line}")
            
            # 도메인 확인
            print(f"🌐 '{service_name}' 서비스 도메인 확인:")
            domain_stdout, domain_stderr, domain_code = run_command("railway domain")
            if domain_code == 0:
                print(f"  📍 도메인: {domain_stdout}")
            else:
                print(f"  ❌ 도메인 확인 실패: {domain_stderr}")
                
        elif "not found" in stderr or "not found" in stdout:
            print(f"❌ '{service_name}' 서비스 없음")
        else:
            print(f"⚠️  '{service_name}' 서비스 상태 불명: {stdout} {stderr}")

def main():
    print("🚀 Railway 서비스 탐색 시작")
    print("="*50)
    
    get_railway_services()
    
    print("\n" + "="*50)
    print("💡 추가 확인 방법:")
    print("1. Railway 대시보드 직접 확인: railway open")
    print("2. 로그 확인으로 실행 중인 서비스 찾기")
    print("3. 환경변수에서 다른 서비스 URL 확인")

if __name__ == "__main__":
    main()