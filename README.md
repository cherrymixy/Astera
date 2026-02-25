# 나의 철학 별자리 (Astera)

음성 키워드로 나만의 철학 별자리를 만드는 인터랙티브 웹 앱입니다.

## 🏗 아키텍처

```
client/   → FE (Vite + React + TS)  → Vercel 배포
server/   → BE (Express + TS)       → Render/Fly.io 배포
Supabase  → PostgreSQL DB (클라우드)
```

## ⚡ 빠른 시작

### 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `server/schema.sql` 실행
3. Settings > API에서 URL과 Service Role Key 복사

### 2. 백엔드

```bash
cd server
cp .env.example .env    # 환경변수 설정
npm install
npm run dev             # http://localhost:4000
```

`.env` 파일 설정:
```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-string
CORS_ORIGIN=http://localhost:5173
```

### 3. 프론트엔드

```bash
cd client
cp .env.example .env    # 환경변수 설정
npm install
npm run dev             # http://localhost:5173
```

`.env` 파일 설정:
```env
VITE_API_URL=http://localhost:4000
```

## 🚀 배포

### FE → Vercel

1. Vercel에서 `client/` 디렉토리를 Root Directory로 설정
2. 환경변수 추가: `VITE_API_URL=https://your-backend.onrender.com`
3. Build Command: `npm run build`
4. Output Directory: `dist`

### BE → Render

1. Render에서 Web Service 생성
2. Root Directory: `server/`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. 환경변수 설정:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`

## 🔌 API 엔드포인트

| Method | Path | 설명 | 인증 |
|--------|------|------|:----:|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| GET | `/api/auth/me` | 내 정보 | ✅ |
| GET | `/api/sessions` | 별자리 목록 | ✅ |
| GET | `/api/sessions/:id` | 별자리 상세 | ✅ |
| POST | `/api/sessions` | 별자리 생성 | ✅ |
| DELETE | `/api/sessions/:id` | 별자리 삭제 | ✅ |

## ✅ 배포 후 테스트 체크리스트

| # | 항목 | 확인 방법 |
|---|------|----------|
| 1 | FE 접속 | Vercel URL → 로그인 페이지 표시 |
| 2 | 회원가입 | 이름/이메일/비밀번호 입력 → 가입 성공 |
| 3 | 로그인 | 가입 계정으로 로그인 → 홈 표시 |
| 4 | 별자리 생성 | 키워드 추가 → 저장 → DB 반영 |
| 5 | 별자리 조회 | 홈에서 목록 표시, 상세 이동 |
| 6 | 별자리 삭제 | 삭제 → 목록에서 제거 |
| 7 | 로그아웃 | 로그아웃 → 로그인 페이지 |
| 8 | CORS | FE→BE API 호출 시 에러 없음 |
| 9 | 새로고침 | JWT 토큰으로 로그인 유지 |
| 10 | 계정 격리 | 다른 계정의 별자리 안 보임 |

## 📄 라이선스

Private
