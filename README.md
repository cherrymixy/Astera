# Dooink

말하는 리듬으로 두들(낙서)을 그리는 웹 프로토타입입니다.

## 🎨 프로젝트 개요

Dooink는 사용자의 음성 리듬을 실시간으로 분석하여 추상적인 낙서를 생성하는 인터랙티브 웹 애플리케이션입니다. 말하는 동안 음량, 속도, 무음 구간 등이 두들의 색상, 선 두께, 속도, 떨림 등으로 시각화됩니다.

## ✨ 주요 기능

### 1. 개체 선택
- 12개의 일상적인 개체 카드 중 하나를 선택
- 각 개체는 이모지와 설명으로 표현

### 2. 실시간 두들 생성
- **추상적 낙서 스타일**: 자유롭게 움직이는 추상적인 낙서
- **음성 반응형**:
  - 음량(RMS)에 따라 선 두께와 속도 변화
  - 음량이 높을수록 선이 두껍고 빠르게 움직임
  - 무음 구간에서는 선이 끊어짐
  - 각 스트로크마다 랜덤 색상 생성
  - 손그림 느낌의 지터(jitter) 효과
- **세션 일관성**: 시드 기반 RNG로 리플레이 시 동일한 결과 재현

### 3. 음성 인식 (STT)
- Web Speech API를 사용한 내부 음성 인식
- 화면에는 텍스트를 표시하지 않음 (내부적으로만 사용)
- 한국어 지원

### 4. 사유 요약 생성
- STT로 인식된 음성을 분석하여 개체에 대한 관점/해석 중심의 한 줄 사유 문장 생성
- OpenAI API 사용 (선택사항, 없으면 키워드 기반 fallback)
- 결과 화면에서만 표시

### 5. 철학자 관점 연결
- 사유 문장을 기반으로 유사한 관점의 철학자 2~3명 추천
- 각 철학자마다 선택한 개체에 대한 구체적인 관점 설명 생성
- 클릭 시 철학자의 상세 설명 모달 표시
- OpenAI API 사용 (선택사항, 없으면 키워드 기반 fallback)

### 6. 배경 이미지 합성 (결과 화면)
- 결과 화면에서 사용자가 업로드한 일상 이미지를 배경으로 사용 가능
- 배경 이미지 + 그레이 오버레이 + 두들 선 조합
- "두들만 보기" / "배경 보기" 토글 기능

### 7. 결과 저장 및 관리
- 두들 이미지, 합성 이미지, 메타데이터, 사유 요약을 데이터베이스에 저장
- 홈 화면에서 최근 기록 확인
- 상세 페이지에서 전체 결과 및 철학자 추천 확인

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Drawing**: HTML Canvas 2D + requestAnimationFrame
- **Audio**: Web Audio API (getUserMedia + AnalyserNode)
- **STT**: Web Speech API
- **Backend**: Next.js Route Handlers
- **Database**: SQLite + Prisma
- **AI**: OpenAI API (선택사항)
- **Design**: 애플 스타일 (다크 그레이 배경)

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행 (SQLite 데이터베이스 생성)
npm run prisma:migrate
```

### 3. 환경 변수 설정 (선택사항)

프로젝트 루트에 `.env.local` 파일을 생성하고 OpenAI API 키를 입력하세요:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

**참고**: API 키가 없어도 키워드 기반 fallback으로 동작합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어주세요.

### 5. 마이크 권한

브라우저에서 마이크 접근 권한을 허용해야 합니다.

## 📁 프로젝트 구조

```
DooinkWeb/
├── app/
│   ├── api/
│   │   ├── philosophers/         # 철학자 추천 API
│   │   ├── reasoning/            # 사유 요약 API
│   │   └── sessions/             # 세션 저장/조회 API
│   ├── session/
│   │   ├── new/                  # 말하기 & 두들 페이지
│   │   └── [id]/                 # 결과 상세 페이지
│   ├── select/                   # 개체 선택 페이지
│   ├── layout.tsx
│   ├── page.tsx                  # 홈 페이지
│   └── globals.css
├── lib/
│   ├── audio.ts                  # Web Audio API 분석 (RMS, 무음 감지)
│   ├── doodleEngine.ts           # 추상 낙서 생성 엔진
│   ├── canvasRenderer.ts         # Canvas 렌더러
│   ├── objects.ts                # 개체 카드 데이터
│   ├── stt.ts                    # Web Speech API 기반 STT
│   ├── reasoning.ts              # 사유 요약 생성 (fallback)
│   ├── philosophers.ts            # 철학자 데이터 및 추천 로직 (fallback)
│   ├── openai.ts                 # OpenAI 클라이언트 설정
│   ├── aiServer.ts               # AI 서버 클라이언트 (선택사항)
│   └── db.ts                     # Prisma 클라이언트
├── types/
│   └── index.ts                  # TypeScript 타입 정의
├── prisma/
│   └── schema.prisma             # 데이터베이스 스키마
└── public/
    ├── dooink.png                # 로고
    └── uploads/                  # 이미지 저장 (선택사항)
```

## 🎯 사용 흐름

1. **홈 화면**: 로고와 "New Session" 버튼, 최근 기록 목록
2. **개체 선택**: 12개의 개체 카드 중 하나 선택
3. **두들 그리기**:
   - 마이크 버튼 클릭하여 녹음 시작
   - 말하는 동안 실시간으로 추상 낙서 생성
   - Clear 버튼으로 초기화 가능
   - Finish 버튼으로 완료
4. **결과 화면**:
   - 생성된 두들 이미지 확인
   - 사유 요약 문장 확인
   - 배경 이미지 업로드 및 합성 (선택사항)
   - 메타데이터 확인
   - 추천된 철학자 카드 확인 및 상세 설명 보기
   - PNG 다운로드

## 📊 데이터 모델

### Session
- `id`: 세션 UUID
- `createdAt`: 생성 시간
- `objectId`, `objectLabel`: 선택한 개체 정보
- `doodlePngBase64`: 두들 이미지 (base64)
- `combinedPngBase64`: 합성 이미지 (base64)
- `metricsJson`: 메트릭 데이터 (JSON)
- `strokesJson`: 스트로크 데이터 (JSON, 리플레이용)
- `reasoningText`: 사유 요약 문장
- `transcriptText`: STT 원문 (내부용, 화면에 표시 안 함)
- `userImageBase64`: 사용자가 업로드한 배경 이미지 (base64, 선택사항)

## 📈 메트릭

각 세션은 다음 메트릭을 포함합니다:

- `avgRms`: 평균 음량 (0~1)
- `peakCount`: 피크 수
- `pauseCount`: 무음 구간 수
- `energyScore`: 에너지 점수 (0~1)
- `assertivenessScore`: 확신도 점수 (0~1)
- `durationMs`: 지속 시간 (밀리초)

## 🤖 OpenAI API 설정

사유 요약과 철학자 추천 기능을 OpenAI API로 사용하려면:

### 1. API 키 발급
- https://platform.openai.com/api-keys 에서 발급
- 로그인 후 "Create new secret key" 클릭
- 키는 `sk-`로 시작하는 긴 문자열

### 2. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. 서버 재시작
```bash
npm run dev
```

**참고**: 
- API 키가 없으면 자동으로 키워드 기반 fallback 모드로 동작
- `.env.local` 파일은 Git에 커밋되지 않음 (보안)

## 🔧 별도 AI 서버 사용 (선택사항)

AI 처리를 별도 서버로 분리하려면:

### 1. 환경 변수 설정
`.env.local` 파일에 AI 서버 URL 추가:

```env
NEXT_PUBLIC_AI_SERVER_URL=https://your-ai-server.com
```

### 2. AI 서버 구현
별도 AI 서버는 다음 엔드포인트를 제공해야 합니다:

- `POST /reasoning`
  - 입력: `{ transcript: string, objectId: string }`
  - 출력: `{ reasoning: string }`

- `POST /philosophers`
  - 입력: `{ reasoningText: string, objectId: string, objectLabel: string }`
  - 출력: `{ philosophers: Philosopher[] }`

### 3. 동작 방식
- `NEXT_PUBLIC_AI_SERVER_URL`이 설정되어 있으면 별도 AI 서버 사용
- 설정되지 않으면 로컬 API 사용 (현재 Next.js 서버)
- AI 서버 호출 실패 시 자동으로 로컬 API로 fallback

예시 서버 코드는 `ai-server-example.js`를 참고하세요.

## 🎨 디자인

- **스타일**: 애플 스타일 (미니멀, 깔끔)
- **배경**: 다크 그레이 (#1a1a1a)
- **카드**: #2a2a2a 배경, #3a3a3a 테두리
- **버튼**: 흰색 배경 (주요), 회색 배경 (보조)
- **로고**: Dooink 로고 (상단 중앙)

## ⚠️ 주의사항

- **마이크 권한**: 마이크 접근 권한이 필요합니다
- **HTTPS**: HTTPS 환경에서만 마이크 접근 가능 (로컬 개발은 localhost에서 가능)
- **브라우저 지원**: Web Speech API는 Chrome, Edge 등 일부 브라우저에서만 지원
- **이미지 저장**: 이미지는 base64로 데이터베이스에 저장됩니다
- **STT 텍스트**: STT 텍스트는 화면에 표시하지 않습니다 (내부적으로만 사용)
- **OpenAI API**: API 키가 없으면 키워드 기반 규칙으로 동작합니다

## 📝 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# Prisma Studio (데이터베이스 GUI)
npm run prisma:studio
```

## 🔄 업데이트 이력

- **v1.0.0**: 초기 버전
  - 추상적 실시간 낙서 생성
  - 음성 인식 및 사유 요약
  - 철학자 관점 연결
  - 배경 이미지 합성 기능
  - 애플 스타일 디자인

## 📄 라이선스

Private
