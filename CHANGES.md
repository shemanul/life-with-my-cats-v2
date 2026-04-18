# 변경사항 패치노트

## 2026-04-18 — Vercel 배포 빌드 오류 수정

### 문제
`figma:asset/` 는 Figma Make 내부 전용 가상 모듈이라,  
코드를 다운로드해서 Vercel 등 외부 환경에서 빌드하면 다음 오류가 발생함:

```
Failed to resolve import "figma:asset/clip1761684981600.png"
Failed to resolve import "figma:asset/clip1760497858512.png"
```

### 수정된 파일

#### 1. `src/app/components/CatAvatar.tsx`

- **변경 전** — `figma:asset/` 가상 경로로 로컬 이미지 import
  ```ts
  import ariDefaultImg from 'figma:asset/clip1761684981600.png';
  import kungDefaultImg from 'figma:asset/clip1760497858512.png';
  ```

- **변경 후** — Unsplash URL로 교체 (다운로드/배포 환경 모두 정상 동작)
  ```ts
  const DEFAULT_IMAGES: Record<string, string> = {
    ari:  'https://images.unsplash.com/photo-1758153412755-38876d86d028?...',
    kung: 'https://images.unsplash.com/photo-1610973053414-abc5309f0a8c?...',
  };
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1912da?...';
  ```

- 기존 `catId` 기반 기본 이미지 로직은 그대로 유지  
- `catId`가 `ari` / `kung` 외의 값이면 공통 폴백 이미지 표시

#### 2. `vite.config.ts`

- **변경 전**
  ```ts
  assetsInclude: ['**/*.svg', '**/*.csv']
  ```

- **변경 후** — PNG 등 이미지 확장자 명시 추가
  ```ts
  assetsInclude: ['**/*.svg', '**/*.csv', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp']
  ```

### 참고

- `src/imports/image-1.png` ~ `image-42.png` (44개) 파일은 현재 코드에서 사용되지 않음
- 고양이 실제 사진은 Supabase Storage에 업로드 후 URL로 관리됨 (기존 로직 유지)

---

## 2026-04-18 — Vercel 배포 시 환경변수 처리 추가

### 문제
Vercel로 배포하면 Supabase 연결 정보가 없어서 데이터를 불러오지 못함.

### 수정된 파일

#### 1. `src/app/utils/supabase-client.ts`

- **변경 전** — `info.tsx` 하드코딩 값만 사용
  ```ts
  import { projectId, publicAnonKey } from '/utils/supabase/info';
  const supabaseUrl = `https://${projectId}.supabase.co`;
  const supabaseKey = publicAnonKey;
  ```

- **변경 후** — Vercel 환경변수 우선, 없으면 하드코딩 폴백
  ```ts
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || _projectId;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || _publicAnonKey;
  ```

#### 2. `.env.example` (신규 생성)

- Vercel 환경변수 설정 가이드 파일
- 필요한 환경변수 목록과 Supabase Dashboard에서 찾는 방법 안내

---

### Vercel 환경변수 설정 방법 (단계별)

**Step 1.** Supabase Dashboard 접속 → [Project Settings] → [API]

**Step 2.** 아래 두 값을 복사

| 항목 | Supabase Dashboard 위치 |
|------|------------------------|
| `VITE_SUPABASE_PROJECT_ID` | Project Settings > General > **Reference ID** |
| `VITE_SUPABASE_ANON_KEY` | Project Settings > API > **anon public** |

**Step 3.** Vercel Dashboard 접속 → 해당 프로젝트 선택

**Step 4.** [Settings] → [Environment Variables] 메뉴 클릭

**Step 5.** 위 두 변수를 각각 추가하고 [Save] 클릭

**Step 6.** [Deployments] 탭으로 가서 최신 배포 우클릭 → [Redeploy]

> ⚠️ 환경변수 추가 후 반드시 **Redeploy** 해야 적용됩니다!

---

## 2026-04-18 — Vercel 배포 시 스타일 깨짐 수정

### 문제
Vercel 배포 후 앱이 스타일 없이 날것의 텍스트만 표시됨.  
Tailwind CSS, 폰트(Jua·Pretendard), 테마 색상이 전혀 적용되지 않음.

### 원인
`src/main.tsx`에서 `theme.css` 하나만 import하고 있어서,  
Tailwind 전체 스타일과 폰트를 묶은 `index.css`가 로드되지 않았음.

```
index.css  ← 이걸 불러와야 함
  ├── fonts.css    (Jua, Pretendard 폰트)
  ├── tailwind.css (Tailwind 전체 스타일)
  └── theme.css    (색상·테마 변수)
```

### 수정된 파일

- **`src/main.tsx`**
  ```ts
  // 변경 전 (잘못됨) — Tailwind·폰트 없음
  import './styles/theme.css'

  // 변경 후 (올바름) — 모든 스타일 포함
  import './styles/index.css'
  ```