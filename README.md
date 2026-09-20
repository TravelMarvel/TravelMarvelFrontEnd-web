# Travel Marble Web (Next.js)

Expo `TravelMarvelFrontEnd`를 **React + Next.js 모바일 웹**으로 포팅한 프로젝트입니다.

## 기능

- 카카오 / Google 로그인 (기존 백엔드 `/auth/kakao`, `/auth/google`)
- 마블판 목록 · 생성 · 상세(주사위 1~3칸)
- 명소 상세 · 사진 업로드(Presigned URL)
- 내 앨범 · 인생네컷
- 마이페이지 · 로그아웃 · 회원 탈퇴

## 시작하기

```bash
cd TravelMarvelWeb
cp .env.example .env.local
# .env.local 값 채우기
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) (모바일 뷰포트 권장)

## 환경 변수

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 기본 `/backend` (Next rewrite 프록시, CORS 회피) |
| `TRAVEL_MARBLE_API_ORIGIN` | 실제 API (`https://api.travelmarble.site/api`) |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth 웹 클라이언트 ID |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 **JavaScript 키** (네이티브 키와 다름) |

### OAuth 설정 메모

- **Google**: 승인된 JavaScript 원본에 `http://localhost:3000` 추가
- **Kakao**: 앱에 Web 플랫폼 추가 후 사이트 도메인에 `localhost` 등록, JavaScript 키 사용

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드 결과 실행
# TravelMarvelFrontEnd-web
