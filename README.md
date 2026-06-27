# Life with My Cats 🐱

랙돌 고양이들의 건강 관리를 위한 모바일 최적화 PWA 애플리케이션.

## 📋 프로젝트 소개

Life with My Cats는 여러 마리의 고양이 건강을 체계적으로 관리할 수 있는 웹 애플리케이션입니다.
일일 식사량, 활력 상태, 복약 여부, 양치, 배변/구토 상태를 사진과 함께 기록할 수 있습니다.

## ✨ 주요 기능

- 🐈 고양이 프로필 관리 (사진, 이름, 생년월일, 품종, 성별, 중성화 여부)
- 🍽️ 식사 기록 (주식 그램 단위, 간식)
- 💪 활력 상태 기록 (5단계)
- 💊 복약 기록 (아침/저녁)
- 🪥 양치 기록 (오전/오후)
- 💩 배변 기록 (상태 + 사진)
- 🤮 구토 기록 (여부 + 사진)
- 📊 날짜별 전체 기록 조회 및 삭제

## 🛠️ 기술 스택

### Frontend
- React 19
- Vite
- React Router (Data mode)
- Tailwind CSS v4
- TypeScript

### Backend
- Supabase (PostgreSQL + Edge Functions + Storage)
- Hono (Edge Function 웹 프레임워크)

### 스타일
- Jua (주아) 한글 폰트
- 파스텔톤 모바일 최적화 UI

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+
- pnpm (패키지 매니저)
- Supabase 계정

### 설치 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/YOUR_USERNAME/life-with-my-cats.git
   cd life-with-my-cats
   ```

2. **의존성 설치**
   ```bash
   pnpm install
   ```

3. **환경 변수 설정**
   
   `.env.example` 파일을 복사해서 `.env` 파일을 만들고 Supabase 정보를 입력하세요:
   ```bash
   cp .env.example .env
   ```

   `.env` 파일 내용:
   ```env
   SUPABASE_URL=your-project-url.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_DB_URL=your-database-url
   ```

4. **데이터베이스 설정**

   Supabase 대시보드에서 다음 테이블을 생성하세요:

   **cats 테이블:**
   ```sql
   CREATE TABLE cats (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     birth_year INTEGER NOT NULL,
     birth_month INTEGER NOT NULL,
     birth_day INTEGER NOT NULL,
     gender TEXT NOT NULL,
     breed TEXT NOT NULL,
     neutered BOOLEAN NOT NULL,
     photo_url TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   **health_records 테이블:**
   ```sql
   CREATE TABLE health_records (
     id SERIAL PRIMARY KEY,
     cat_id TEXT NOT NULL,
     type TEXT NOT NULL,
     date TEXT NOT NULL,
     data JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(cat_id, type, date)
   );
   ```

5. **개발 서버 실행**
   ```bash
   pnpm dev
   ```

   브라우저에서 `http://localhost:5173` 접속

## 📖 문서

자세한 기술 명세는 [spec.md](./spec.md)를 참조하세요.

## 🔐 보안 주의사항

- `.env` 파일을 절대 GitHub에 올리지 마세요
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 측에서만 사용하세요
- 클라이언트에는 `SUPABASE_ANON_KEY`만 노출되어야 합니다

## 📝 버전 관리

- v54: Initial release (2026-04-18)

## 👨‍💻 개발자

Life with My Cats 개발팀

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.
