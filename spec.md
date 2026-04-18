# Life with My Cats - 기술 명세서 (v58)

**작성일**: 2026년 4월 18일  
**버전**: v58  
**상태**: 운영 중인 최종 버전

---

## 1. 프로젝트 소개

**Life with My Cats**는 랙돌 고양이들의 일상 건강 관리를 위한 모바일 최적화 PWA 애플리케이션입니다.

### 주요 목적
- 여러 마리의 고양이 프로필 관리
- 일일 건강 기록 추적 (식사, 활력, 복약, 양치, 배변, 구토)
- 사진 첨부를 통한 시각적 건강 기록
- 날짜별 기록 조회 및 삭제

### 주요 특징
- **파스텔톤 UI**: 부드러운 색상 팔레트로 사용자 경험 향상
- **주아(Jua) 폰트**: 친근하고 읽기 쉬운 한글 폰트 적용
- **모바일 우선 설계**: 터치 인터페이스에 최적화된 반응형 디자인
- **실시간 동기화**: Supabase를 통한 클라우드 기반 데이터 관리
- **사진 저장**: Supabase Storage를 활용한 효율적인 이미지 관리
- **관리자 인증**: SHA-256 비밀번호 + WebAuthn 지문 인증으로 앱 접근 보호

---

## 2. 기술 스택

### Frontend
- **React 19** - UI 프레임워크
- **Vite** - 빌드 도구
- **React Router (Data mode)** - 클라이언트 사이드 라우팅
- **Tailwind CSS v4** - 유틸리티 기반 스타일링
- **TypeScript** - 타입 안전성

### Backend
- **Supabase**
  - PostgreSQL 데이터베이스
  - Edge Functions (Hono 웹서버)
  - Storage (이미지 파일 저장)
- **Hono** - Edge Function 웹 프레임워크

### 폰트
- **Jua (주아)** - Google Fonts를 통해 제공되는 한글 폰트

---

## 3. 화면 목록 및 기능 설명

### 3.0 LoginPage (`/login` — 자동 리다이렉트)
- **기능**: 앱 진입 시 관리자 인증 화면
- **주요 동작**:
  - 비밀번호 입력 → SHA-256 해시 → `adm_pwd` 테이블 조회 → 일치 시 세션 저장
  - **자동 로그인 체크** 시 30일 세션 유지, 미체크 시 1일 유지
  - 세션이 유효한 경우 LoginPage 스킵 → 바로 Home 진입
  - **지문 미등록** 상태 → "지문 등록하기" 버튼 표시
  - **지문 등록 완료** 상태 → "지문으로 로그인" 버튼 표시
  - **지문 등록 해제** 링크: 재등록 필요 시 사용
  - HTTPS 미환경 시 지문 버튼 미표시 + 안내 문구 표시
  - 세션 키: `localStorage['lwmc_auth_session']`

> ⚠️ WebAuthn 지문 인증은 **HTTPS + 비iframe 환경**에서만 동작 (Vercel 배포 앱에서 테스트)

### 3.1 Home (`/`)
- **기능**: 등록된 모든 고양이 목록 표시
- **주요 동작**:
  - 고양이 카드 리스트 표시 (이름, 프로필 사진, 나이)
  - 고양이 추가 버튼
  - 고양이 카드 클릭 시 개별 대시보드로 이동
  - 고양이 수정/삭제 기능
  - 우상단 로그아웃 버튼 (`LogOut` 아이콘) → 세션 삭제 후 LoginPage로 이동

### 3.2 CatDashboard (`/:catId`)
- **기능**: 개별 고양이의 대시보드
- **주요 동작**:
  - 고양이 기본 정보 표시 (이름, 나이, 품종, 성별, 중성화 여부)
  - 오늘 날짜의 각 기록 유형별 요약 표시
  - 각 기록 화면으로 이동할 수 있는 네비게이션 버튼
  - 전체 기록 조회(History) 버튼

### 3.3 FoodRecord (`/:catId/food`)
- **기능**: 주식 및 간식 기록
- **주요 동작**:
  - 주식: 그램(g) 단위로 양 입력, 시간 기록 (복수 입력 가능)
  - 간식: 이름, 양, 시간 기록 (복수 입력 가능)
  - 주식/간식 항목 추가/삭제
  - 날짜별 저장 및 조회

### 3.4 VitalityRecord (`/:catId/vitality`)
- **기능**: 고양이의 활력 상태 기록
- **주요 동작**:
  - 5단계 활력 상태 선택
    - 매우 활발 (very-active)
    - 활발함 (active)
    - 보통 (normal)
    - 피곤함 (tired)
    - 아픈 듯 (sick)
  - 메모 입력 (선택 사항)

### 3.5 MedicationRecord (`/:catId/medication`)
- **기능**: 복약 기록
- **주요 동작**:
  - 아침/저녁 복약 여부 체크박스
  - 메모 입력 (선택 사항)

### 3.6 ToothBrushRecord (`/:catId/toothbrush`)
- **기능**: 양치 기록
- **주요 동작**:
  - 오전/오후 양치 여부 체크박스

### 3.7 PoopRecord (`/:catId/poop`)
- **기능**: 배변 기록
- **주요 동작**:
  - 배변 상태 선택
    - 정상변 (normal)
    - 무른 변 (soft)
    - 설사 (diarrhea)
    - 변비 (constipation)
  - 사진 첨부 (선택 사항)
  - 메모 입력 (선택 사항)

### 3.8 VomitRecord (`/:catId/vomit`)
- **기능**: 구토 기록
- **주요 동작**:
  - 구토 발생 여부 체크박스
  - 사진 첨부 (선택 사항)
  - 메모 입력 (선택 사항)

### 3.9 History (`/:catId/history`)
- **기능**: 전체 건강 기록 조회
- **주요 동작**:
  - 날짜별로 그룹화된 모든 기록 표시
  - 각 기록 유형별 아이콘 및 요약 정보
  - 개별 기록 삭제 기능 (사진이 첨부된 경우 Storage에서도 함께 삭제)
  - 최신 기록부터 역순 정렬

---

## 4. DB 스키마

### 4.1 cats 테이블

고양이 프로필 정보를 저장합니다.

```sql
CREATE TABLE cats (
  id TEXT PRIMARY KEY,              -- UUID (서버에서 crypto.randomUUID()로 생성)
  name TEXT NOT NULL,               -- 이름
  birth_year INTEGER NOT NULL,      -- 출생 연도
  birth_month INTEGER NOT NULL,     -- 출생 월
  birth_day INTEGER NOT NULL,       -- 출생 일
  gender TEXT NOT NULL,             -- 'female' | 'male'
  breed TEXT NOT NULL,              -- 품종
  neutered BOOLEAN NOT NULL,        -- 중성화 여부
  photo_url TEXT,                   -- Supabase Storage URL
  created_at TIMESTAMP DEFAULT NOW()
);
```

**특이사항**:
- `id`는 DB DEFAULT 없이 서버에서 직접 UUID 생성
- 생년월일은 `birth_year`, `birth_month`, `birth_day`로 분리 저장
- `photo_url`은 Supabase Storage의 공개 URL

### 4.2 health_records 테이블

모든 유형의 건강 기록을 저장하는 단일 테이블입니다.

```sql
CREATE TABLE health_records (
  id SERIAL PRIMARY KEY,            -- 자동 생성 ID
  cat_id TEXT NOT NULL,             -- cats.id 참조
  type TEXT NOT NULL,               -- 'food' | 'vitality' | 'medication' | 'toothbrush' | 'poop' | 'vomit'
  date TEXT NOT NULL,               -- 'YYYY-MM-DD' 형식
  data JSONB NOT NULL,              -- 레코드 상세 데이터
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(cat_id, type, date)        -- 고양이당 날짜별 타입당 1개 레코드
);
```

**JSONB data 구조 (type별)**:

**food**:
```json
{
  "mainFood": [
    { "amount": 50, "time": "08:00" }
  ],
  "snacks": [
    { "name": "츄르", "amount": "1개", "time": "15:00" }
  ]
}
```

**vitality**:
```json
{
  "status": "active",
  "notes": "오늘 많이 뛰어놀았음"
}
```

**medication**:
```json
{
  "morning": true,
  "evening": false,
  "notes": "아침에만 투약"
}
```

**toothbrush**:
```json
{
  "morning": false,
  "evening": true
}
```

**poop**:
```json
{
  "status": "normal",
  "photoUrl": "https://...",
  "notes": "건강한 상태"
}
```

**vomit**:
```json
{
  "occurred": true,
  "photoUrl": "https://...",
  "notes": "털볼 구토"
}
```

### 4.3 adm_pwd 테이블

관리자 비밀번호를 저장합니다.

```sql
CREATE TABLE adm_pwd (
  id  TEXT PRIMARY KEY,  -- 관리자 아이디
  pwd TEXT NOT NULL      -- SHA-256 해시 (encode(sha256(평문::bytea), 'hex') 형식)
);
```

**특이사항**:
- `pwd` 컬럼은 반드시 **소문자 hex 문자열 64자** 형식으로 저장
- 저장 방법 (Supabase SQL Editor):
  ```sql
  UPDATE adm_pwd SET pwd = encode(sha256('내비밀번호'::bytea), 'hex') WHERE id = '아이디';
  ```
- RLS: **비활성화** (DISABLE ROW LEVEL SECURITY)
- Supabase RPC 함수 `verify_admin_password` 존재 (동일 방식으로 비교)

> ⚠️ **AI 주의**: pwd 저장 형식이 다르면 로그인 불가. 반드시 PostgreSQL `encode(sha256(...),'hex')` 방식 사용.

---

## 5. Storage 구조

### 버킷 정보
- **버킷명**: `make-88fc1426-cat-photos`
- **접근 권한**: public (공개 읽기)
- **용도**: 고양이 프로필 사진, 배변 기록 사진, 구토 기록 사진

### Storage 정책 (RLS)

버킷은 public이지만 **anon 사용자의 업로드를 위해 별도 정책이 필요**합니다.  
아래 SQL이 Supabase에 적용되어 있어야 합니다:

```sql
CREATE POLICY "anon_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'make-88fc1426-cat-photos');

CREATE POLICY "anon_update" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'make-88fc1426-cat-photos');

CREATE POLICY "anon_select" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'make-88fc1426-cat-photos');
```

> ⚠️ **주의**: 버킷이 public이어도 anon INSERT 정책이 없으면 업로드가 실패합니다.

### 폴더 구조
```
make-88fc1426-cat-photos/
├── profile/
│   └── {uuid}.{ext}         # 고양이 프로필 사진
├── poop/
│   └── {uuid}.{ext}         # 배변 기록 사진
└── vomit/
    └── {uuid}.{ext}         # 구토 기록 사진
```

### 파일명 규칙
- UUID v4 형식의 고유 식별자 사용
- 확장자는 업로드된 파일의 원본 확장자 유지 (jpg, png 등)
- 예시: `poop/a3f2b1c4-5d6e-7f8g-9h0i-1j2k3l4m5n6o.jpg`

---

## 6. API 엔드포인트 목록

### 기본 URL
```
https://{projectId}.supabase.co/functions/v1/make-server-88fc1426
```

### 인증
모든 요청에 다음 헤더 필요:
```
Authorization: Bearer {publicAnonKey}
```

### 6.1 건강 기록 API

#### GET `/records/:catId`
- **설명**: 특정 고양이의 모든 건강 기록 조회
- **응답**: 날짜별로 그룹화된 기록 배열

#### GET `/records/:catId/:type/:date`
- **설명**: 특정 날짜의 특정 유형 기록 조회
- **파라미터**:
  - `catId`: 고양이 ID
  - `type`: `food` | `vitality` | `medication` | `toothbrush` | `poop` | `vomit`
  - `date`: `YYYY-MM-DD` 형식
- **응답**: 해당 기록 객체 또는 null

#### POST `/records`
- **설명**: 건강 기록 저장 (upsert)
- **요청 본문**:
```json
{
  "catId": "uuid",
  "type": "food",
  "date": "2026-04-18",
  "data": { ... }
}
```
- **응답**: 저장된 기록 객체

#### DELETE `/records/:catId/:type/:date`
- **설명**: 특정 기록 삭제 (사진이 있으면 Storage에서도 삭제)
- **파라미터**: GET과 동일
- **응답**: 삭제 성공 메시지

### 6.2 고양이 관리 API

#### GET `/cats`
- **설명**: 모든 고양이 목록 조회
- **응답**: 고양이 배열

#### POST `/cats`
- **설명**: 새 고양이 등록
- **요청 본문**:
```json
{
  "name": "나비",
  "birthYear": 2023,
  "birthMonth": 3,
  "birthDay": 15,
  "gender": "female",
  "breed": "Ragdoll",
  "neutered": true,
  "photoUrl": "https://..."
}
```
- **특이사항**: `id`는 서버에서 `crypto.randomUUID()`로 자동 생성
- **응답**: 생성된 고양이 객체

#### PUT `/cats/:catId`
- **설명**: 고양이 정보 수정
- **요청 본문**: POST와 동일 (id 제외)
- **응답**: 수정된 고양이 객체

#### DELETE `/cats/:catId`
- **설명**: 고양이 삭제
- **응답**: 삭제 성공 메시지

### 6.3 파일 업로드 API

#### POST `/upload-photo`
- **설명**: 사진을 Supabase Storage에 업로드
- **요청 본문**:
```json
{
  "file": "base64-encoded-image-data",
  "type": "profile" | "poop" | "vomit",
  "ext": "jpg" | "png"
}
```
- **응답**:
```json
{
  "url": "https://...public-url..."
}
```

---

## 7. 파일 구조

```
/workspaces/default/code/
├── .gitignore                         # 민감 파일 GitHub 업로드 방지 (GitHub에서 직접 생성)
├── .env.example                       # 환경변수 설정 예시 (실제 키 미포함)
├── src/
│   ├── app/
│   │   ├── App.tsx                    # RouterProvider 진입점 + 인증 래퍼
│   │   ├── routes.tsx                 # createBrowserRouter 라우트 정의
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx          # 로그인 화면 (비밀번호 + 지문 인증)
│   │   │   ├── Home.tsx               # 고양이 목록 화면 (로그아웃 버튼 포함)
│   │   │   ├── CatDashboard.tsx       # 개별 고양이 대시보드
│   │   │   ├── FoodRecord.tsx         # 식사 기록
│   │   │   ├── VitalityRecord.tsx     # 활력 기록
│   │   │   ├── MedicationRecord.tsx   # 복약 기록
│   │   │   ├── ToothBrushRecord.tsx   # 양치 기록
│   │   │   ├── PoopRecord.tsx         # 배변 기록
│   │   │   ├── VomitRecord.tsx        # 구토 기록
│   │   │   └── History.tsx            # 전체 기록 조회
│   │   ├── components/
│   │   │   ├── CatFormModal.tsx       # 고양이 추가/수정 모달
│   │   │   ├── CatAvatar.tsx          # 고양이 프로필 사진 컴포넌트
│   │   │   ├── PhotoThumbnail.tsx     # 사진 썸네일 컴포넌트
│   │   │   └── ui/                    # shadcn/ui 컴포넌트들
│   │   ├── utils/
│   │   │   ├── auth.ts                # 인증 유틸 (hashSHA256, login, biometric, session)
│   │   │   ├── storage.ts             # 건강기록 CRUD (serverFetch 기반)
│   │   │   ├── cat-storage.ts         # 고양이 CRUD
│   │   │   └── supabase-client.ts     # serverFetch / serverUpload 헬퍼
│   │   └── types/
│   │       └── health-record.ts       # TypeScript 타입 정의
│   ├── styles/
│   │   ├── fonts.css                  # Jua 폰트 import
│   │   └── theme.css                  # Tailwind 토큰/테마 정의
│   └── main.tsx                       # React 앱 진입점
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx              # Hono 서버 (모든 API 라우트)
│           └── kv_store.tsx           # KV 유틸 (현재 미사용)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 8. 설계 결정 사항 (ADR)

### ADR-001: 사진 저장 방식 - Supabase Storage 사용

**날짜**: 2026-04-17  
**상태**: 승인됨

**맥락**:
초기에는 localStorage와 base64 인코딩을 사용하여 사진을 저장했으나, 다음과 같은 문제가 발생했습니다:
- localStorage의 용량 제한 (일반적으로 5-10MB)
- base64 인코딩으로 인한 파일 크기 증가 (약 33%)
- 성능 저하 (대량의 base64 데이터 로드 시)

**결정**:
Supabase Storage를 활용하여 이미지를 클라우드에 저장하고, DB에는 공개 URL만 저장합니다.

**근거**:
- 무제한에 가까운 저장 공간
- CDN을 통한 빠른 이미지 로딩
- 원본 품질 유지
- 디바이스 간 동기화 용이

**결과**:
- `photo_url` 컬럼 타입을 TEXT로 변경
- `/upload-photo` API 엔드포인트 추가
- 기존 base64 데이터 마이그레이션 완료

---

### ADR-002: 생년월일 분리 저장

**날짜**: 2026-04-15  
**상태**: 승인됨

**맥락**:
고양이의 정확한 생년월일을 알 수 없는 경우가 많아, 단일 DATE 컬럼으로는 불완전한 정보를 표현하기 어렵습니다.

**결정**:
`birth_year`, `birth_month`, `birth_day`를 별도의 INTEGER 컬럼으로 분리 저장합니다.

**근거**:
- 부분적인 생년월일 정보 입력 가능 (예: 2023년생이지만 정확한 월/일 모름)
- 나이 계산 시 유연성 확보
- NULL 값으로 미확인 정보 표현 가능

**결과**:
- 프론트엔드에서는 `YYYY-MM-DD` 문자열로 조합하여 사용
- 나이 계산 로직이 명확해짐

---

### ADR-003: 단일 health_records 테이블 사용

**날짜**: 2026-04-14  
**상태**: 승인됨

**맥락**:
각 기록 유형(food, vitality, medication 등)마다 별도 테이블을 만들 수도 있었지만, 모든 유형이 공통적인 구조를 가집니다.

**결정**:
모든 건강 기록을 `health_records` 단일 테이블에 저장하고, `type` 컬럼으로 구분하며, 상세 데이터는 JSONB `data` 컬럼에 저장합니다.

**근거**:
- 스키마 관리 단순화
- 날짜별 조회 시 JOIN 불필요
- JSONB를 통한 유연한 데이터 구조
- PostgreSQL의 JSONB 인덱싱 성능 우수

**트레이드오프**:
- 타입별 컬럼 검증이 어려움 (애플리케이션 레벨에서 처리)
- JSONB 쿼리가 일반 컬럼보다 복잡할 수 있음

**결과**:
- API 설계가 일관성 있게 구성됨
- 새로운 기록 유형 추가 시 테이블 변경 불필요

---

### ADR-004: 서버에서 UUID 생성

**날짜**: 2026-04-14  
**상태**: 승인됨

**맥락**:
PostgreSQL의 `uuid_generate_v4()` 또는 클라이언트에서 UUID를 생성할 수도 있었습니다.

**결정**:
Supabase Edge Function 서버에서 `crypto.randomUUID()`를 사용하여 UUID를 생성합니다.

**근거**:
- DB에 uuid-ossp extension 설치 불필요
- 클라이언트 생성 시 충돌 가능성 제거
- 서버에서 ID 생성 후 반환하는 명확한 플로우

**결과**:
- `createCatHandler`에서 UUID 생성 로직 구현
- DB 스키마에서 DEFAULT 제거

---

### ADR-005: React Router Data mode 채택

**날짜**: 2026-04-13  
**상태**: 승인됨

**맥락**:
React Router v7에서는 Data mode와 전통적인 Component mode를 모두 지원합니다.

**결정**:
`createBrowserRouter`를 사용한 Data mode를 채택합니다.

**근거**:
- 선언적 라우트 정의
- 타입 안전성 향상
- loader/action 패턴 사용 가능 (향후 확장성)

**결과**:
- `routes.tsx`에서 모든 라우트 중앙 관리
- 각 페이지 컴포넌트는 순수 UI 컴포넌트로 유지

---

### ADR-006: KV 테이블 미사용

**날짜**: 2026-04-17  
**상태**: 승인됨

**맥락**:
Supabase 통합 시 제공되는 `kv_store` 테이블이 존재하지만, 프로젝트의 데이터 구조와 맞지 않습니다.

**결정**:
`kv_store` 테이블을 사용하지 않고, `cats`와 `health_records` 테이블만 사용합니다.

**근거**:
- 관계형 데이터 구조가 더 적합 (고양이 ↔ 건강기록 관계)
- PostgreSQL의 JSONB로 충분히 유연한 데이터 저장 가능
- SQL 쿼리를 통한 복잡한 조회 가능

**결과**:
- `kv_store.tsx` 파일은 존재하지만 사용하지 않음
- 명확한 데이터 모델링

---

### ADR-007: 관리자 인증 방식 — SHA-256 + WebAuthn

**날짜**: 2026-04-18  
**상태**: 승인됨

**맥락**:
앱이 개인 가족용이지만, 고양이 건강 기록이 민감할 수 있으므로 간단한 접근 제어가 필요합니다.

**결정**:
- **1차 인증**: 비밀번호를 Web Crypto API로 SHA-256 해시 → `adm_pwd` 테이블과 비교
- **2차 인증(선택)**: WebAuthn을 통한 지문(생체) 인증으로 빠른 재로그인

**근거**:
- Supabase Auth 대신 커스텀 테이블을 사용하여 단순화
- SHA-256은 npm 패키지 없이 `crypto.subtle.digest()` Web Crypto API만으로 구현
- WebAuthn은 HTTPS 환경에서 기기 자체 보안 칩을 활용 → 안전하고 편리

**인증 흐름**:
```
앱 시작
  ├─ localStorage['lwmc_auth_session'] 유효 → 자동 로그인 (Home)
  └─ 세션 없음 → LoginPage
       ├─ 지문 등록됨 + HTTPS → "지문으로 로그인" 버튼
       ├─ 지문 미등록 + HTTPS → "지문 등록하기" 버튼
       └─ 비밀번호 입력 → SHA-256 → adm_pwd 조회 → 성공 시 세션 저장 → Home
```

**세션 구조** (`localStorage['lwmc_auth_session']`):
```json
{
  "userId": "admin",
  "loginAt": 1713400000000,
  "expiresAt": 1715992000000,
  "rememberMe": true
}
```

**지문(WebAuthn) 저장 위치**:
- `lwmc_biometric_cred`: base64url 인코딩된 credential ID
- `lwmc_biometric_user`: 등록한 사용자 ID

> ⚠️ **AI 주의**: `rp.id`는 `window.location.hostname` 사용.  
> 등록 도메인 ≠ 로그인 도메인이면 인증 실패 (예: localhost 등록 → vercel.app 로그인 불가)

**결과**:
- `/src/app/utils/auth.ts`: 인증 유틸 함수 모음
- `/src/app/pages/LoginPage.tsx`: 로그인 UI
- `App.tsx`에서 세션 체크 후 라우팅 분기

---

### ADR-008: 환경변수 관리 — .gitignore + Vercel 대시보드

**날짜**: 2026-04-18  
**상태**: 승인됨

**맥락**:
Supabase 연결 키가 코드에 하드코딩되면 GitHub에 노출될 위험이 있습니다.

**결정**:
- `.gitignore`로 `.env`, `.env.local` 등 민감 파일 GitHub 업로드 차단
- Vercel 대시보드에 환경변수 저장 → 빌드 시 주입
- 로컬 개발은 `.env.local` 파일 사용 (gitignore 적용)
- `.env.example`로 필요한 환경변수 목록 문서화

> ⚠️ **AI 주의**: Figma Make 환경에서는 `.`으로 시작하는 숨김 파일 생성 불가.  
> `.gitignore`는 GitHub 웹 UI 또는 로컬 터미널에서 직접 생성해야 함.

---

## 9. 향후 개선 아이디어

### 9.1 기능 추가
- [ ] **알림 기능**: 복약 시간, 양치 시간 등 푸시 알림
- [ ] **통계 대시보드**: 주간/월간 건강 트렌드 그래프
- [ ] **체중 기록**: 정기적인 체중 측정 및 추이 관리
- [ ] **병원 기록**: 진료 일자, 진단명, 처방약 등 관리
- [ ] **다중 사용자**: 가족 구성원이 함께 기록 공유
- [ ] **데이터 내보내기**: PDF/CSV 형식으로 기록 내보내기

### 9.2 UX 개선
- [ ] **오프라인 지원**: PWA Service Worker를 통한 오프라인 모드
- [ ] **다크 모드**: 사용자 선호도에 따른 테마 전환
- [ ] **접근성 향상**: ARIA 레이블, 키보드 네비게이션 개선
- [ ] **애니메이션**: 페이지 전환 및 상호작용 애니메이션 추가

### 9.3 기술 개선
- [ ] **에러 처리 강화**: 전역 에러 바운더리 및 사용자 친화적 에러 메시지
- [ ] **로딩 상태 관리**: Skeleton UI 및 낙관적 업데이트
- [ ] **이미지 최적화**: 자동 리사이징 및 WebP 변환
- [ ] **테스트 작성**: 단위 테스트 및 E2E 테스트
- [ ] **성능 모니터링**: Sentry 또는 Supabase 로그 활용
- [ ] **CI/CD 구축**: GitHub Actions를 통한 자동 배포

### 9.4 보안 강화
- [ ] **이미지 검증**: 업로드 파일 타입 및 크기 제한
- [ ] **Rate Limiting**: API 요청 제한
- [ ] **입력 검증**: Zod 등을 활용한 스키마 검증

---

## 부록 A: 환경 변수

프로젝트에서 사용되는 환경 변수 목록:

### 프론트엔드 (Vite — `VITE_` 접두사 필수)
```env
VITE_SUPABASE_PROJECT_ID=your-project-id   # Supabase Project Reference ID
VITE_SUPABASE_ANON_KEY=eyJ...              # Legacy JWT anon key (eyJ 시작 필수)
```

### 백엔드 (Supabase Edge Function — Supabase 대시보드에서 설정)
```env
SUPABASE_URL=https://{projectId}.supabase.co
SUPABASE_ANON_KEY={publicAnonKey}
SUPABASE_SERVICE_ROLE_KEY={serviceRoleKey}  # 서버 전용 — 절대 클라이언트 노출 금지
```

### 환경별 키 관리 방법

| 환경 | 설정 위치 |
|------|-----------|
| Vercel 배포 | Vercel 대시보드 → Settings → Environment Variables |
| 로컬 개발 | `.env.local` 파일 (`.gitignore` 적용, GitHub 미업로드) |
| Figma Make | `/utils/supabase/info.tsx` 폴백 (Figma Make 자체 프로젝트용) |

**보안 주의사항**:
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되어서는 안 됨
- `.env` / `.env.local` 파일은 `.gitignore`에 의해 GitHub 업로드 차단
- Supabase Anon Key는 반드시 `eyJ`로 시작하는 **Legacy JWT 형식** 사용 (신형 `sb_publishable_` 키는 Storage 업로드 불가)

---

## 부록 B: 날짜 형식 규칙

프로젝트 전체에서 일관된 날짜 형식 사용:

- **저장 형식**: `YYYY-MM-DD` (ISO 8601)
- **표시 형식**: `2026년 4월 18일` (한국어)
- **시간 형식**: `HH:MM` (24시간제)

**예시**:
```typescript
// 저장
const date = "2026-04-18";

// 표시
const displayDate = new Date(date).toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// "2026년 4월 18일"
```

---

## 부록 C: 타입 정의 참조

전체 TypeScript 타입 정의는 `/src/app/types/health-record.ts` 파일을 참조하세요.

주요 타입:
- `Cat`: 고양이 프로필
- `FoodRecord`: 식사 기록
- `VitalityRecord`: 활력 기록
- `MedicationRecord`: 복약 기록
- `ToothBrushRecord`: 양치 기록
- `PoopRecord`: 배변 기록
- `VomitRecord`: 구토 기록
- `DailyRecord`: 일일 종합 기록

---

**문서 버전**: v58  
**마지막 업데이트**: 2026년 4월 18일  
**관리자**: Life with My Cats 개발팀