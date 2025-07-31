# Implementation Plan

- [x] 1. 프로젝트 구조 및 기본 설정
  - FastAPI 프로젝트 구조 생성 (app/, models/, services/, api/ 디렉토리)
  - requirements.txt 작성 (FastAPI, SQLAlchemy, Celery, Redis, PostgreSQL 등)
  - 환경변수 설정 파일 (.env.example) 생성
  - _Requirements: 9.1, 9.2_

- [x] 2. 데이터베이스 모델 및 설정
- [x] 2.1 SQLAlchemy 모델 구현
  - User, Keyword, Post, Comment, ProcessLog, GeneratedContent, MetricsCache 모델 생성
  - 모델 간 관계 설정 (Foreign Key, Index)
  - _Requirements: 2.1, 3.3, 5.5_

- [x] 2.2 데이터베이스 연결 및 마이그레이션 설정
  - Alembic 설정 및 초기 마이그레이션 파일 생성
  - 데이터베이스 연결 유틸리티 구현
  - _Requirements: 3.3, 8.3_

- [x] 3. 인증 시스템 구현
- [x] 3.1 JWT 토큰 관리 시스템
  - JWT 토큰 생성, 검증, 갱신 함수 구현
  - 토큰 미들웨어 구현
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 3.2 Reddit OAuth2 연동
  - Reddit OAuth2 인증 플로우 구현
  - 사용자 정보 저장 및 관리
  - _Requirements: 1.1, 1.2_

- [x] 4. 키워드 관리 API 구현
- [x] 4.1 키워드 CRUD API
  - 키워드 생성, 조회, 수정, 삭제 엔드포인트 구현
  - 키워드 중복 검증 로직
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.2 키워드 서비스 레이어
  - 키워드 비즈니스 로직 구현
  - 사용자별 키워드 관리 기능
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Reddit 크롤링 시스템 구현
- [x] 5.1 Reddit API 클라이언트
  - Reddit API 호출 함수 구현
  - API 응답 파싱 및 데이터 정제
  - 재시도 로직 및 에러 핸들링
  - _Requirements: 3.2, 3.4, 3.5_

- [x] 5.2 Celery 워커 설정
  - Celery 설정 및 워커 구현
  - 크롤링 작업 큐 처리
  - _Requirements: 3.1, 3.3_

- [x] 5.3 크롤링 스케줄러
  - Celery Beat 스케줄링 설정
  - 주기적 크롤링 작업 구현
  - _Requirements: 3.1, 3.3_

- [x] 6. 크롤링 상태 관리 API
- [x] 6.1 크롤링 상태 추적
  - 크롤링 진행 상태 저장 및 조회
  - 실시간 상태 업데이트 기능
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6.2 크롤링 이력 관리
  - 크롤링 작업 로그 저장
  - 이력 조회 API 구현
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 7. 포스트 검색 및 필터링 API
- [x] 7.1 포스트 검색 기능
  - 제목, 내용, 키워드 기반 검색
  - 전문 검색 인덱스 구현
  - _Requirements: 5.1, 5.4_

- [x] 7.2 포스트 필터링 및 페이지네이션
  - 날짜, 키워드, 점수 기반 필터링
  - 페이지네이션 구현
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 8. 트렌드 분석 시스템
- [x] 8.1 트렌드 분석 알고리즘
  - 키워드별 언급 빈도 분석
  - 시간대별 트렌드 변화 계산
  - _Requirements: 6.1, 6.2_

- [x] 8.2 인기 포스트 분석
  - 업보트 수, 댓글 수 기반 인기도 계산
  - 트렌딩 포스트 선별 로직
  - _Requirements: 6.3_

- [x] 8.3 Redis 캐싱 시스템
  - 트렌드 분석 결과 캐싱
  - 캐시 만료 및 갱신 로직
  - _Requirements: 6.4_

- [x] 9. 콘텐츠 생성 시스템
- [x] 9.1 콘텐츠 생성 템플릿
  - 블로그 글, 신제품 소개, 트렌드 분석 템플릿 구현
  - 템플릿 기반 콘텐츠 생성 로직
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9.2 콘텐츠 생성 워커
  - Celery를 통한 비동기 콘텐츠 생성
  - 생성된 콘텐츠 저장 및 버전 관리
  - _Requirements: 7.4, 7.5_

- [x] 9.3 콘텐츠 관리 API
  - 생성된 콘텐츠 조회 및 관리
  - 콘텐츠 메타데이터 관리
  - _Requirements: 7.4_

- [x] 10. 모니터링 및 헬스체크
- [x] 10.1 Prometheus 메트릭 수집
  - API 응답 시간, 요청 수 메트릭
  - 크롤링 작업 성공/실패 메트릭
  - _Requirements: 8.1, 8.4_

- [x] 10.2 헬스체크 엔드포인트
  - 데이터베이스, Redis, Celery 상태 확인
  - 시스템 전반적인 상태 모니터링
  - _Requirements: 8.3_

- [x] 10.3 알림 시스템
  - 임계값 초과 시 알림 발송
  - 크롤링 실패 시 관리자 알림
  - _Requirements: 8.2, 8.4_

- [x] 11. API 문서화
- [x] 11.1 Swagger/OpenAPI 문서 생성
  - FastAPI 자동 문서 생성 설정
  - API 엔드포인트 문서화
  - _Requirements: 9.1, 9.2_

- [x] 11.2 Postman Collection 생성
  - 모든 API 엔드포인트 테스트 컬렉션
  - 인증 토큰 설정 가이드
  - _Requirements: 9.3, 9.4_

- [x] 12. 테스트 구현
- [x] 12.1 단위 테스트
  - 서비스 레이어 로직 테스트
  - 모델 검증 테스트
  - _Requirements: 전체 요구사항 검증_

- [x] 12.2 통합 테스트
  - API 엔드포인트 테스트
  - 데이터베이스 연동 테스트
  - _Requirements: 전체 요구사항 검증_

- [x] 12.3 E2E 테스트
  - 전체 크롤링 플로우 테스트
  - 인증 플로우 테스트
  - _Requirements: 전체 요구사항 검증_

- [x] 13. 배포 설정
- [x] 13.1 Docker 설정
  - Dockerfile 및 docker-compose.yml 작성
  - 컨테이너 환경 설정
  - _Requirements: 배포 환경 구성_

- [x] 13.2 Railway.com 배포 설정
  - railway.toml 설정
  - 환경변수 구성
  - _Requirements: 배포 환경 구성_

- [x] 13.3 CI/CD 파이프라인
  - GitHub Actions 워크플로우 설정
  - 자동 테스트 및 배포 구성
  - _Requirements: 배포 자동화_

## Frontend Development Tasks

### Public Blog Application (대중용 블로그 사이트)

- [x] 14. 공개 블로그 프론트엔드 프로젝트 초기 설정
- [x] 14.1 React + TypeScript 프로젝트 생성
  - Vite를 사용한 React 18 + TypeScript 프로젝트 초기화
  - 기본 폴더 구조 생성 (components/, pages/, hooks/, services/, types/)
  - ESLint, Prettier, Husky 설정
  - _Requirements: 프론트엔드 개발 환경 구성_

- [x] 14.2 의존성 및 개발 도구 설정
  - 필수 라이브러리 설치 (React Router, Zustand, React Query, Tailwind CSS)
  - 개발 도구 설정 (Storybook, Vitest, Testing Library)
  - 타입 정의 파일 생성
  - _Requirements: 프론트엔드 개발 환경 구성_

- [x] 14.3 기본 설정 파일 구성
  - 환경변수 설정 (.env files)
  - API 클라이언트 기본 설정 (Public API 전용)
  - 라우팅 설정 (/, /blog, /blog/[slug], /about, /search)
  - _Requirements: 프론트엔드 개발 환경 구성_

- [x] 15. 공개 블로그 디자인 시스템 구축
- [x] 15.1 블로그 디자인 토큰 설정
  - Tailwind CSS 커스텀 설정 (블로그 테마)
  - 컬러 팔레트, 타이포그래피, 스페이싱 시스템 정의
  - 다크/라이트 테마 지원
  - _Requirements: 일관된 블로그 UI/UX 제공_

- [x] 15.2 블로그 UI 컴포넌트 라이브러리
  - Button, Card, Badge, Search 등 블로그 전용 컴포넌트 구현
  - 접근성 고려한 컴포넌트 설계 (ARIA 속성, 키보드 네비게이션)
  - Storybook을 통한 컴포넌트 문서화
  - _Requirements: 재사용 가능한 블로그 UI 컴포넌트_

- [x] 15.3 블로그 레이아웃 컴포넌트
  - Header, Navigation, Footer 레이아웃 컴포넌트 구현
  - 반응형 네비게이션 메뉴
  - 브레드크럼 네비게이션
  - _Requirements: 일관된 블로그 레이아웃 구조_

- [x] 16. 블로그 홈페이지 구현
- [x] 16.1 메인 랜딩 페이지
  - 히어로 섹션 (서비스 소개)
  - 최신 블로그 포스트 미리보기
  - 인기 카테고리/태그 표시
  - _Requirements: 매력적인 첫 인상 제공_

- [x] 16.2 블로그 소개 페이지
  - 서비스 소개 및 목적 설명
  - 데이터 수집 방식 설명
  - 연락처 및 피드백 섹션
  - _Requirements: 서비스 투명성 제공_

- [x] 17. 블로그 포스트 시스템 구현
- [x] 17.1 블로그 목록 페이지
  - 생성된 블로그 포스트 목록 표시
  - 카테고리별 필터링 (AI, 기술, 트렌드 등)
  - 태그 기반 필터링
  - 페이지네이션 또는 무한 스크롤
  - _Requirements: 7.4, 블로그 콘텐츠 탐색_

- [x] 17.2 개별 블로그 포스트 페이지
  - Markdown 콘텐츠 렌더링
  - 목차 (Table of Contents) 자동 생성
  - 소셜 미디어 공유 버튼
  - 관련 포스트 추천
  - _Requirements: 7.4, 블로그 콘텐츠 표시_

- [x] 17.3 블로그 검색 기능
  - 전문 검색 (제목, 내용, 태그)
  - 실시간 검색 제안
  - 검색 결과 하이라이팅
  - 검색 히스토리 저장
  - _Requirements: 블로그 콘텐츠 검색_

- [x] 17.4 RSS 피드 및 SEO 최적화
  - RSS/Atom 피드 생성
  - 메타 태그 최적화
  - 구조화된 데이터 (JSON-LD)
  - 사이트맵 자동 생성
  - _Requirements: SEO 및 구독 기능_

- [x] 18. 블로그 인터랙션 기능
- [x] 18.1 댓글 시스템 (선택적)
  - 댓글 작성 및 표시
  - 댓글 모더레이션
  - 스팸 방지 기능
  - _Requirements: 사용자 참여 증진_

- [x] 18.2 구독 및 알림 기능
  - 이메일 구독 폼
  - 새 포스트 알림
  - 구독 관리 페이지
  - _Requirements: 사용자 리텐션_

- [x] 19. 블로그 성능 최적화
- [x] 19.1 이미지 및 콘텐츠 최적화
  - 이미지 지연 로딩 및 최적화
  - 콘텐츠 캐싱 전략
  - CDN 연동
  - _Requirements: 빠른 로딩 속도_

- [x] 19.2 SEO 및 접근성 최적화
  - 메타 태그 동적 생성
  - Open Graph 태그
  - 접근성 준수 (WCAG 2.1 AA)
  - _Requirements: 검색 엔진 최적화_

- [x] 20. 블로그 배포 및 모니터링
- [x] 20.1 Vercel 배포 설정
  - 정적 사이트 생성 (SSG) 설정
  - 환경변수 구성
  - 도메인 연결
  - _Requirements: 블로그 배포_

- [x] 20.2 분석 및 모니터링
  - Google Analytics 연동
  - 성능 모니터링
  - 에러 추적
  - _Requirements: 블로그 운영 모니터링_

### Admin Dashboard Application (관리자 대시보드)

- [x] 21. 관리자 대시보드 프로젝트 초기 설정
- [x] 21.1 React + TypeScript 프로젝트 생성
  - Vite를 사용한 React 18 + TypeScript 프로젝트 초기화
  - 관리자 전용 폴더 구조 생성
  - ESLint, Prettier, Husky 설정
  - _Requirements: 관리자 개발 환경 구성_

- [x] 21.2 관리자 의존성 설정
  - 관리자 전용 라이브러리 설치 (Chart.js, Socket.IO, etc.)
  - 개발 도구 설정
  - 타입 정의 파일 생성
  - _Requirements: 관리자 개발 환경 구성_

- [x] 21.3 관리자 기본 설정
  - 환경변수 설정 (Admin API 전용)
  - API 클라이언트 설정 (인증 포함)
  - 관리자 라우팅 설정 (/admin/*)
  - _Requirements: 관리자 환경 구성_

- [x] 22. 관리자 인증 시스템 구현
- [x] 22.1 관리자 인증 상태 관리
  - Zustand를 사용한 인증 상태 스토어 구현
  - JWT 토큰 관리 (저장, 갱신, 만료 처리)
  - 자동 로그아웃 기능
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 22.2 관리자 로그인 페이지
  - Reddit OAuth2 로그인 페이지 구현
  - 로그인 콜백 처리 페이지
  - 관리자 권한 검증
  - _Requirements: 1.1, 1.2_

- [x] 22.3 관리자 보호된 라우트
  - 관리자 권한이 필요한 페이지 보호 로직
  - 권한 기반 접근 제어
  - 리다이렉트 처리
  - _Requirements: 1.4_

- [x] 23. 관리자 API 연동 및 상태 관리
- [x] 23.1 관리자 API 클라이언트 구현
  - Axios 기반 HTTP 클라이언트 구현
  - 요청/응답 인터셉터 설정 (토큰 자동 첨부, 에러 처리)
  - 관리자 API 서비스 레이어 구현
  - _Requirements: 백엔드 API 연동_

- [x] 23.2 관리자 React Query 설정
  - 서버 상태 관리를 위한 React Query 설정
  - 캐싱 전략 및 무효화 로직
  - 낙관적 업데이트 구현
  - _Requirements: 효율적인 데이터 페칭_

- [x] 23.3 관리자 전역 상태 관리
  - Zustand를 사용한 클라이언트 상태 관리
  - 상태 지속성 (localStorage 연동)
  - 상태 디버깅 도구 설정
  - _Requirements: 일관된 상태 관리_

- [x] 24. 관리자 대시보드 페이지 구현
- [x] 24.1 대시보드 레이아웃
  - 관리자 대시보드 메인 레이아웃 구현
  - 통계 카드 컴포넌트 구현
  - 반응형 그리드 시스템
  - _Requirements: 전체 시스템 현황 표시_

- [x] 24.2 실시간 통계 표시
  - 활성 키워드, 총 포스트 수, 트렌딩 키워드 카드
  - 실시간 데이터 업데이트 (WebSocket/SSE)
  - 로딩 상태 및 에러 처리
  - _Requirements: 실시간 시스템 현황_

- [x] 24.3 최근 활동 피드
  - 최근 크롤링 활동, 생성된 콘텐츠 표시
  - 무한 스크롤 또는 페이지네이션
  - 활동 타입별 아이콘 및 색상 구분
  - _Requirements: 사용자 활동 추적_

- [x] 24.4 빠른 액션 버튼
  - 키워드 추가, 크롤링 시작, 콘텐츠 생성 버튼
  - 모달을 통한 빠른 작업 수행
  - 액션 결과 피드백 표시
  - _Requirements: 빠른 작업 수행_

- [x] 25. 키워드 관리 페이지 구현
- [x] 25.1 키워드 목록 표시
  - 키워드 카드/테이블 형태 표시
  - 검색 및 필터링 기능
  - 정렬 옵션 (이름, 생성일, 포스트 수)
  - _Requirements: 2.2, 키워드 관리_

- [x] 25.2 키워드 CRUD 기능
  - 키워드 추가 모달/폼 구현
  - 키워드 수정 기능
  - 키워드 삭제 (확인 다이얼로그 포함)
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 25.3 키워드 통계 표시
  - 키워드별 포스트 수, 마지막 업데이트 시간
  - 키워드 성과 차트
  - 활성/비활성 상태 토글
  - _Requirements: 2.2, 키워드 성과 분석_

- [x] 25.4 벌크 액션 기능
  - 다중 선택을 통한 일괄 삭제
  - 일괄 활성화/비활성화
  - 선택된 키워드 내보내기
  - _Requirements: 효율적인 키워드 관리_

- [x] 26. 포스트 탐색 페이지 구현
- [x] 26.1 포스트 목록 표시
  - 포스트 카드 형태 레이아웃
  - 가상 스크롤링을 통한 성능 최적화
  - 포스트 메타데이터 표시 (점수, 댓글 수, 시간)
  - _Requirements: 5.1, 5.5_

- [x] 26.2 검색 및 필터링 기능
  - 실시간 검색 (디바운싱 적용)
  - 고급 필터 (날짜 범위, 키워드, 서브레딧, 점수)
  - 필터 상태 URL 동기화
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 26.3 포스트 상세 모달
  - 포스트 전체 내용 표시
  - 댓글 표시 (페이지네이션)
  - 원본 Reddit 링크
  - _Requirements: 5.5_

- [x] 26.4 정렬 및 페이지네이션
  - 다양한 정렬 옵션 (날짜, 인기도, 댓글 수)
  - 무한 스크롤 구현
  - 페이지 상태 관리
  - _Requirements: 5.4_

- [x] 27. 분석 대시보드 페이지 구현
- [x] 27.1 차트 라이브러리 설정
  - Chart.js/React-Chartjs-2 설정
  - 차트 공통 컴포넌트 구현
  - 반응형 차트 설정
  - _Requirements: 6.2, 데이터 시각화_

- [x] 27.2 트렌드 분석 차트
  - 시간대별 트렌드 변화 라인 차트
  - 키워드별 언급 빈도 바 차트
  - 인터랙티브 차트 기능 (줌, 필터)
  - _Requirements: 6.1, 6.2_

- [x] 27.3 통계 시각화
  - 서브레딧 분포 파이 차트
  - 감정 분석 결과 표시
  - 상위 성과 포스트 테이블
  - _Requirements: 6.3, 통계 분석_

- [x] 27.4 필터 및 시간 범위 선택
  - 날짜 범위 피커 구현
  - 키워드별 필터링
  - 실시간 차트 업데이트
  - _Requirements: 6.4, 동적 분석_

- [x] 28. 콘텐츠 생성 페이지 구현
- [x] 28.1 콘텐츠 생성 폼
  - 콘텐츠 타입 선택 (블로그, 제품 소개, 트렌드 분석)
  - 키워드 다중 선택 컴포넌트
  - 템플릿 선택 드롭다운
  - _Requirements: 7.1, 7.2_

- [x] 28.2 실시간 콘텐츠 미리보기
  - 마크다운 에디터 및 미리보기
  - 실시간 콘텐츠 생성 상태 표시
  - 생성 진행률 표시
  - _Requirements: 7.1, 실시간 미리보기_

- [x] 28.3 생성된 콘텐츠 관리
  - 콘텐츠 목록 표시
  - 콘텐츠 편집 기능
  - 콘텐츠 발행/비공개 토글
  - 콘텐츠 내보내기 (Markdown, HTML, PDF)
  - _Requirements: 7.4, 콘텐츠 관리_

- [x] 28.4 콘텐츠 템플릿 관리
  - 사용자 정의 템플릿 생성
  - 템플릿 미리보기
  - 템플릿 공유 기능
  - _Requirements: 7.3, 템플릿 시스템_

- [x] 29. 크롤링 모니터링 페이지 구현
- [x] 29.1 실시간 크롤링 상태 표시
  - 현재 진행 중인 크롤링 작업 표시
  - 진행률 바 및 ETA 계산
  - WebSocket을 통한 실시간 업데이트
  - _Requirements: 4.1, 4.2_

- [x] 29.2 크롤링 제어 기능
  - 크롤링 시작/일시정지/중지 버튼
  - 크롤링 작업 큐 관리
  - 우선순위 설정 기능
  - _Requirements: 4.1, 크롤링 제어_

- [x] 29.3 크롤링 히스토리
  - 과거 크롤링 작업 이력 표시
  - 성공/실패 상태 표시
  - 에러 로그 상세 보기
  - _Requirements: 4.3, 4.4_

- [x] 29.4 크롤링 통계 및 성과
  - 크롤링 성공률 차트
  - 시간대별 크롤링 성과
  - 키워드별 수집 통계
  - _Requirements: 크롤링 성과 분석_

- [x] 30. 실시간 기능 구현
- [x] 30.1 WebSocket 연결 관리
  - Socket.IO 클라이언트 설정
  - 연결 상태 관리 및 재연결 로직
  - 이벤트 리스너 관리
  - _Requirements: 실시간 데이터 업데이트_

- [x] 30.2 실시간 알림 시스템
  - 토스트 알림 컴포넌트
  - 크롤링 완료, 에러 발생 알림
  - 알림 히스토리 관리
  - _Requirements: 사용자 피드백_

- [x] 30.3 실시간 데이터 동기화
  - 새로운 포스트 실시간 표시
  - 통계 데이터 자동 갱신
  - 충돌 해결 로직
  - _Requirements: 데이터 일관성_

### 공통 최적화 및 배포

- [x] 31. 성능 최적화 및 사용자 경험 개선 (Admin Dashboard)
- [x] 31.1 코드 분할 및 지연 로딩
  - 페이지별 코드 분할 (React.lazy)
  - 컴포넌트 지연 로딩
  - 번들 크기 최적화
  - _Requirements: 성능 최적화_

- [x] 31.2 이미지 및 리소스 최적화
  - 이미지 지연 로딩
  - WebP 포맷 지원
  - 아이콘 최적화 (SVG sprite)
  - _Requirements: 로딩 성능 개선_

- [x] 31.3 캐싱 전략 구현
  - Service Worker를 통한 오프라인 지원
  - API 응답 캐싱
  - 정적 리소스 캐싱
  - _Requirements: 오프라인 지원_

- [x] 31.4 사용자 경험 개선
  - 스켈레톤 로딩 화면
  - 에러 바운더리 구현
  - 접근성 개선 (키보드 네비게이션, 스크린 리더)
  - _Requirements: 사용자 경험 향상_

- [x] 32. 테스트 구현 (Admin Dashboard)
- [x] 32.1 단위 테스트
  - 컴포넌트 단위 테스트 (Testing Library)
  - 커스텀 훅 테스트
  - 유틸리티 함수 테스트
  - _Requirements: 코드 품질 보장_

- [x] 32.2 통합 테스트
  - 페이지 레벨 통합 테스트
  - API 연동 테스트 (MSW 사용)
  - 상태 관리 테스트
  - _Requirements: 기능 검증_

- [x] 32.3 E2E 테스트
  - Playwright를 사용한 E2E 테스트
  - 사용자 플로우 테스트 (관리자 작업)
  - 크로스 브라우저 테스트
  - _Requirements: 전체 시스템 검증_

- [x] 32.4 접근성 테스트
  - axe-core를 사용한 접근성 테스트
  - 키보드 네비게이션 테스트
  - 스크린 리더 호환성 테스트
  - _Requirements: 접근성 준수_

- [x] 33. 프론트엔드 배포 설정
- [x] 33.1 빌드 최적화 (Admin Dashboard)
  - Vite 빌드 설정 최적화
  - 환경별 빌드 구성
  - 번들 분석 및 최적화
  - _Requirements: 배포 준비_

- [x] 33.2 배포 설정
  - 관리자 대시보드: Vercel 또는 Railway 배포 설정
  - 환경변수 설정
  - 도메인 및 SSL 설정
  - _Requirements: 프로덕션 배포_

- [x] 33.3 CI/CD 파이프라인 (Admin Dashboard)
  - GitHub Actions 워크플로우 설정
  - 자동 테스트 및 빌드
  - 자동 배포 설정
  - _Requirements: 배포 자동화_

- [x] 33.4 모니터링 및 에러 추적 (Admin Dashboard)
  - Sentry를 통한 에러 추적 설정
  - 성능 모니터링 (Web Vitals)
  - 사용자 분석 도구 연동
  - _Requirements: 운영 모니터링_