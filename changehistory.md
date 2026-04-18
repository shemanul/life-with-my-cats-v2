# Life with My Cats - 변경 이력 (Change History)

> ⚠️ **AI에게**: 이 파일을 항상 먼저 읽고 과거 실수를 반복하지 마세요.  
> 특히 Supabase 키 설정 및 RLS/Storage 정책은 아래 교훈을 반드시 확인하세요.

---

## v57 — 2026-04-18

### 변경 내용: 지문 등록/로그인 UI 개선

**관련 파일**: `/src/app/pages/LoginPage.tsx` ← **수정**

**변경 사항**:
- 지문 **미등록** 상태일 때 → 로그인 화면에 **"지문 등록하기"** 버튼 바로 표시 (기존: 비밀번호 로그인 성공 후 모달로만 접근 가능)
- 지문 **등록 완료** 상태일 때 → **"지문으로 로그인"** 버튼 표시 (기존과 동일)
- **"지문 등록 해제"** 링크 추가 (재등록 필요 시 사용)
- 지문 등록/로그인 결과를 화면에 상태 메시지로 표시 (`biometricStatus`)
- HTTPS 미환경 시 안내 문구 표시 (`🔒 지문 인증은 HTTPS 환경에서만 사용 가능`)
- `console.log`로 `available`, `registered`, `isSecureContext` 디버깅 로그 추가

> ⚠️ **AI 주의**: 지문(WebAuthn)은 **HTTPS + 비iframe 환경**에서만 동작함.
> Figma Make 미리보기(iframe)에서는 `biometricAvailable === false` → 버튼 미표시.
> 반드시 Vercel 배포 앱(`https://...vercel.app`)에서 테스트해야 함.

> ⚠️ **AI 주의**: 지문 등록 시 `rp.id`는 `window.location.hostname` 사용.
> 등록한 도메인과 로그인 도메인이 다르면 인증 실패함 (예: localhost에서 등록 → vercel.app에서 로그인 불가).

---

## v58 — 2026-04-18

### 변경 내용: 보안 파일 관리 (.gitignore / .env.example) 추가

**관련 파일**:
- `/.gitignore` ← **신규 생성** (GitHub에서 직접 생성 — Figma Make 환경은 숨김 파일 생성 불가)
- `/.env.example` ← **신규 생성**

**변경 사항**:
- `.gitignore` 추가: 민감 파일 및 불필요한 파일 GitHub 업로드 방지
- `.env.example` 추가: 환경변수 설정 가이드 (실제 키 미포함 — 복사 후 `.env.local`에 실제 값 입력)

**`.gitignore` 포함 항목 및 이유**:

| 항목 | 이유 |
|------|------|
| `node_modules/`, `dist/`, `dist-ssr/`, `build/` | 빌드/의존성 산출물 |
| `.env`, `.env.local`, `.env.*.local` | 환경변수 — 실제 키 포함, 절대 커밋 금지 |
| `*.log`, `npm-debug.log*`, `yarn-debug.log*`, `pnpm-debug.log*` | 일반 로그 파일 전체 대응 |
| `.vscode/`, `.idea/` | 에디터 설정 |
| `.DS_Store`, `Thumbs.db` | OS 메타데이터 |
| `*.tsbuildinfo`, `vite.config.ts.timestamp-*` | TypeScript/Vite 빌드 캐시 |
| `.vercel/` | 로컬에서 `vercel` CLI 연결 시 생성되는 인증/프로젝트 정보 |
| `coverage/` | Jest 등 테스트 실행 시 생성되는 리포트 폴더 |
| `supabase/.branches`, `supabase/.temp` | Supabase CLI 임시 파일 |

> ⚠️ **AI 주의**: Figma Make 환경에서는 `.`으로 시작하는 숨김 파일(`.gitignore`, `.env` 등) 생성이 불가능함.
> 이런 파일은 반드시 **GitHub 웹 UI** 또는 **로컬 터미널**에서 직접 생성해야 함.

**환경별 키 관리 구조**:

| 환경 | 키 출처 |
|------|---------|
| Vercel 배포 | Vercel 대시보드 → Settings → Environment Variables |
| 로컬 개발 | `.env.local` 파일 (gitignore 적용, GitHub 미업로드) |
| Figma Make | `/utils/supabase/info.tsx` 폴백 (Figma Make 자체 프로젝트용) |

**필요한 환경변수**:
```
VITE_SUPABASE_PROJECT_ID=your-project-id-here
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

> ⚠️ **AI 주의**: `supabase-client.ts`의 폴백은 Figma Make 자체 info.tsx이므로,  
> **Vercel 배포 시 반드시 Vercel 대시보드에 환경변수 2개가 설정되어 있어야 함**.  
> GitHub 코드에 실제 키를 하드코딩하지 말 것.

---

## v56 — 2026-04-18

### 변경 내용 1: 로그인 화면 신규 추가 (adm_pwd 테이블 기반)

**관련 파일**:
- `/src/app/utils/auth.ts` ← **신규 생성**
- `/src/app/pages/LoginPage.tsx` ← **신규 생성**
- `/src/app/App.tsx` ← 인증 래퍼 추가
- `/src/app/pages/Home.tsx` ← 로그아웃 버튼 추가

**adm_pwd 테이블 구조**:
```sql
-- 이미 Supabase에 존재하는 테이블
CREATE TABLE adm_pwd (
  id   TEXT PRIMARY KEY,  -- 아이디
  pwd  TEXT NOT NULL      -- SHA-256 해시된 비밀번호
);
```

**인증 흐름**:
1. 앱 시작 → `localStorage`에서 세션 확인 (`lwmc_auth_session`)
2. 유효한 세션 → 자동 로그인 (메인 앱으로 진입)
3. 세션 없음 → 로그인 화면 표시
4. 비밀번호 입력 → SHA-256 해시 → `adm_pwd` 테이블 조회 → 일치 시 세션 저장
5. 로그인 성공 후 지문 미등록 + 지문 사용 가능 환경 → 지문 등록 제안 모달 표시

**자동 로그인 정책**:
- 자동 로그인 체크 → `rememberMe: true` → 세션 30일 유지
- 자동 로그인 미체크 → `rememberMe: false` → 세션 1일 유지
- 세션 키: `localStorage['lwmc_auth_session']`

**지문(생체인증) 로그인**:
- WebAuthn API 사용 (`navigator.credentials.create/get`)
- 지원 기기: `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` 확인
- 등록: 비밀번호 로그인 성공 후 자동 제안 → `platform` authenticator 등록
- 인증: 저장된 credential ID로 `navigator.credentials.get()` 호출
- 저장 위치:
  - `lwmc_biometric_cred`: base64url 인코딩된 credential ID
  - `lwmc_biometric_user`: 등록한 사용자 ID

> ⚠️ **AI 주의**: SHA-256은 `crypto.subtle.digest('SHA-256', ...)` Web Crypto API 사용.
> `sha256` npm 패키지 설치 불필요.

**로그아웃**: Home 화면 우상단 `LogOut` 아이콘 → `clearSession()` + `window.location.reload()`

---

### 변경 내용 2: 디테일 화면 고양이 사진 미표시 버그 수정

**관련 파일**: `/src/app/pages/CatDashboard.tsx`

**버그 원인**:
```tsx
// ❌ 수정 전: photoUrl prop 누락 → 항상 기본 이미지만 표시
<CatAvatar
  catId={catId!}
  name={cat.name}
  size={64}
  editable
  onPhotoChange={() => forceUpdate(n => n + 1)}  // 업로드도 안 함!
/>

// ✅ 수정 후: photoUrl 전달 + 실제 업로드 핸들러 연결
<CatAvatar
  catId={catId!}
  name={cat.name}
  photoUrl={cat.photoUrl}   // ← 이 prop이 빠져 있었음
  size={64}
  editable
  onPhotoChange={handlePhotoChange}  // ← 실제 Storage 업로드 함수
/>
```

**handlePhotoChange 수정**:
- 기존: `forceUpdate(n => n + 1)` (화면 재렌더만, 업로드 없음)
- 수정: `uploadPhotoToStorage(file, 'profile')` → `updateCat(...)` → `setCat(updated)`

---

### 변경 내용 3: adm_pwd 비밀번호 검증 방식 수정 (v56 추가)

**증상**: 비밀번호 입력해도 로그인 실패 (`result: false`)

**원인**:
1. `adm_pwd` 테이블은 신규 생성 테이블 → Supabase 기본 RLS **활성화** 상태 → anon 조회 차단
2. **핵심 원인**: DB에 저장된 pwd 형식이 `encode(sha256(...),'hex')` 소문자 hex인데, 처음에 다른 형식으로 저장되어 있었음

**최종 해결**:
- DB의 pwd 값을 PostgreSQL `encode(sha256('암호'::bytea), 'hex')` 형식으로 직접 업데이트
- RPC 함수 `verify_admin_password`가 동일 방식으로 비교하므로 일치

> ⚠️ **AI 주의**: `adm_pwd.pwd` 컬럼은 반드시 `encode(sha256('평문'::bytea), 'hex')` 형식의 **소문자 hex 문자열(64자)**로 저장해야 함.
> 저장 방법:
> ```sql
> UPDATE adm_pwd SET pwd = encode(sha256('내비밀번호'::bytea), 'hex') WHERE id = '아이디';
> ```

**해결 방법 (Supabase SQL Editor)**:
```sql
-- 예시: 'admin' 아이디의 비밀번호를 'mysecretpassword'로 설정
UPDATE adm_pwd SET pwd = encode(sha256('mysecretpassword'::bytea), 'hex') WHERE id = 'admin';
```

---

## ⚠️ AI 필독 — 반복 실수 방지 규칙

### 규칙 1: Supabase Anon Key는 반드시 Legacy JWT 형식

```
✅ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← 이게 맞음
❌ sb_publishable_...                          ← Storage 업로드 안 됨
❌ sb_anon_...                                ← Storage 업로드 안 됨
```

- 조회(SELECT)는 `sb_publishable_` 키로도 되지만, **INSERT / Storage 업로드는 반드시 `eyJ` JWT 형식**이어야 함
- 키 형식 확인: `supabaseAnonKey?.startsWith('eyJ')` → `false`이면 잘못된 키

### 규칙 2: SELECT는 되는데 INSERT/UPLOAD만 안 되면 → RLS 또는 Storage 정책 문제

- 조회 성공 + 쓰기 실패 패턴 = **RLS 정책 누락** 또는 **잘못된 키 형식**
- 이 프로젝트는 RLS를 비활성화하고 운영 중 (`DISABLE ROW LEVEL SECURITY`)
- Storage 버킷은 public이어도 **anon INSERT 정책이 별도로 필요**함

### 규칙 3: supabase-client.ts 폴백 Project ID

- 폴백 값은 반드시 **사용자 본인의 Supabase project ID**여야 함
- Figma Make 기본 project ID(`bwifhsxb...`)를 폴백으로 쓰면 잘못된 프로젝트에 연결됨
- 현재 파일: `/src/app/utils/supabase-client.ts`

### 규칙 4: 이 프로젝트의 Storage 버킷명

- 버킷명: `make-88fc1426-cat-photos`
- 접근: **PUBLIC**
- 폴더 구조: `profile/`, `poop/`, `vomit/`

### 규칙 5: Vercel 환경변수 설정

Vercel 프로젝트에서 다음 환경변수 설정 필요:
```
VITE_SUPABASE_PROJECT_ID = 사용자 Supabase project ID
VITE_SUPABASE_ANON_KEY   = eyJ... 형식의 Legacy anon key
```

### 규칙 6: CatAvatar 컴포넌트 사용 시 photoUrl 반드시 전달

```tsx
// ❌ 잘못된 사용 - photoUrl 없으면 항상 기본 이미지만 나옴
<CatAvatar catId={cat.id} name={cat.name} />

// ✅ 올바른 사용
<CatAvatar catId={cat.id} name={cat.name} photoUrl={cat.photoUrl} />
```

### 규칙 7: 인증 관련 파일 구조

```
/src/app/utils/auth.ts      - hashSHA256, loginWithPassword, loginWithBiometric,
                              registerBiometric, getSession, saveSession, clearSession
/src/app/pages/LoginPage.tsx - 로그인 UI 컴포넌트
```
- 로그인 체크는 `App.tsx`에서 수행 (RouterProvider 감싸는 방식)
- 세션은 `localStorage['lwmc_auth_session']`에 JSON으로 저장
- adm_pwd 테이블: `id`, `pwd`(SHA-256) 컬럼

---

## v55 — 2026-04-18

### 변경 내용: Supabase 키 형식 수정 + RLS/Storage 정책 설정

**증상**:
- 고양이 목록 **조회(SELECT)는 정상** 동작
- 고양이 **추가(INSERT) 및 사진 업로드(Storage)는 실패**
- 에러 메시지: `"new row violates row-level security policy"`

**원인 분석**:

| 항목 | 잘못된 값 | 올바른 값 |
|------|-----------|-----------|
| Supabase Anon Key | `sb_publishable_...` (새 형식) | `eyJ...` (Legacy JWT 형식) |
| Project ID 폴백 | Figma Make 기본 project ID | 사용자 본인 Supabase project ID |
| cats 테이블 RLS | ENABLED (정책 미설정) | DISABLED |
| health_records RLS | ENABLED (정책 미설정) | DISABLED |
| Storage 버킷 정책 | anon INSERT 정책 없음 | anon INSERT/UPDATE/SELECT 허용 |

**해결 방법**:

1. **`supabase-client.ts` 키 수정**:
   ```ts
   // ❌ 잘못된 예 - sb_publishable_ 형식은 Storage 업로드 불가
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_xxx";
   
   // ✅ 올바른 예 - Legacy anon key (eyJ 시작 JWT 형식)
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
   ```
   - **키 찾는 경로**: Supabase Dashboard → Project Settings → API → **"Legacy anon, service_role API keys"** 탭 → `anon` `public` 복사

2. **Supabase SQL Editor에서 실행**:
   ```sql
   ALTER TABLE cats DISABLE ROW LEVEL SECURITY;
   ALTER TABLE health_records DISABLE ROW LEVEL SECURITY;
   
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('make-88fc1426-cat-photos', 'make-88fc1426-cat-photos', true)
   ON CONFLICT (id) DO UPDATE SET public = true;
   
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

**결과**: 고양이 추가 및 사진 업로드 정상 동작 확인 ✅

---

## v54 — 2026-04-18 (이전 최종 버전)

### 변경 내용: 사진 업로드 Storage 방식으로 전환 완료

- localStorage + base64 방식에서 Supabase Storage 방식으로 마이그레이션
- `/upload-photo` API 엔드포인트 추가
- `photo_url` 컬럼 TEXT 타입으로 변경
- `CatFormModal`, `PoopRecord`, `VomitRecord` 컴포넌트 사진 업로드 로직 수정
- `PhotoThumbnail` 컴포넌트 신규 추가

---

## 버전 히스토리 요약

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v57 | 2026-04-18 | 지문 등록/로그인 UI 개선 |
| v58 | 2026-04-18 | 보안 파일 관리 (.gitignore / .env.example) 추가 |
| v56 | 2026-04-18 | 로그인/자동로그인/지문인증 추가, 디테일 사진 버그 수정, adm_pwd 비밀번호 검증 수정 |
| v55 | 2026-04-18 | Supabase 키 형식 수정, RLS 비활성화, Storage 정책 추가 |
| v54 | 2026-04-18 | Storage 사진 업로드 방식 전환 |
| v53 이전 | 2026-04-13~17 | 초기 개발, 라우팅, 기록 기능 구현 |

---

**최종 업데이트**: 2026년 4월 18일  
**관리자**: Life with My Cats 개발팀