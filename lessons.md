# Portfolio Project - Lessons & Skills

이 파일은 포트폴리오 프로젝트를 진행하며 배운 교훈과 작업 규칙을 저장합니다.
**작업을 시작하기 전에 항상 이 내용을 먼저 숙지하세요.**

---

## 📋 프로젝트 개요

- **프로젝트명**: Portfolio Rebalancing App
- **목적**: 개인 포트폴리오 리밸런싱 및 자산 관리
- **기술 스택**: Next.js 14, React 18, TypeScript, Chart.js, Yahoo Finance API
- **주요 기능**:
  - 리밸런싱 계산 (매수/매도 수량)
  - 포트폴리오 시뮬레이션
  - 실시간 주가/환율 연동 (Yahoo Finance)
  - AI 기반 투자 일지 생성

---

## ✅ BEST PRACTICES (권장 사항)

### 코드 작성
1. **TypeScript 우선**: 새 파일 생성 시 가능한 `.ts` 또는 `.tsx` 사용
2. **컴포넌트 구조**: 재사용 가능한 컴포넌트는 `/src/components/` 하위에 카테고리별로 분류
3. **API Routes**: Next.js API routes는 `/src/app/api/` 하위에 RESTful 구조로 작성
4. **유틸리티 함수**: 공통 로직은 `/src/lib/` 하위에 모듈화
5. **에러 로깅**: 반드시 `@/lib/logger`의 함수 사용
   - `logError(message, error, data?)` - 에러 발생 시
   - `logWarn(message, data?)` - 경고 메시지
   - `logDebug(message, data?)` - 디버깅 정보 (개발 환경 전용)
   - `logInfo(message, data?)` - 일반 정보

### 파일 및 폴더 구조
- **페이지**: `/src/app/[페이지명]/page.js` (Next.js App Router 규칙)
- **컴포넌트**: `/src/components/[카테고리]/[컴포넌트명].js`
- **라이브러리**: `/src/lib/[기능명].js`

### 스타일 및 포맷
- **CSS**: Tailwind CSS 또는 CSS Modules 사용 (globals.css는 전역 스타일 전용)
- **명명 규칙**: camelCase for 변수/함수, PascalCase for 컴포넌트

---

## ❌ DO NOT (하지 말아야 할 것)

### 파일 관리
1. **node_modules 수정 금지**: 외부 라이브러리는 직접 수정하지 말 것
2. **data 폴더 직접 수정 주의**: 데이터 파일은 API를 통해 관리
3. **환경 변수 노출 금지**: API 키 등 민감 정보는 `.env.local`에 보관하고 Git에 커밋하지 말 것

### 코드 품질
1. **console 사용 금지**: `console.log`, `console.error` 등 사용 금지
   - ✅ 대신 사용: `logError()`, `logWarn()`, `logDebug()` from `@/lib/logger`
   - ⚠️ ESLint가 경고하므로 빌드 전 반드시 확인
2. **미사용 import 정리**: ESLint 경고 무시하지 말 것
3. **하드코딩 지양**: 설정값은 상수나 환경 변수로 관리
4. **catch 블록 처리**: 에러를 캐치만 하고 무시하지 말 것
   ```javascript
   // ❌ Bad
   } catch (e) { /* 에러 무시 */ }

   // ✅ Good
   } catch (error) {
     logError('Operation failed', error);
   }
   ```

---

## 🐛 해결한 주요 에러 (Error Log)

### 1. ESLint 9 설정 문제 (2026-01-02)
**문제**:
- `eslint.config.mjs`의 import 경로에 `.js` 확장자 누락
- ESLint 9는 flat config만 지원하지만, 기존 설정이 호환되지 않음

**해결**:
```javascript
// Before (Error)
import nextVitals from "eslint-config-next/core-web-vitals";

// After (Fixed)
export default [
  {
    ignores: [".next/**", "out/**", "build/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
    },
  },
];
```

**교훈**: ESLint 9는 flat config 형식 필수. 간단한 규칙으로 시작하고 필요시 확장

---

### 2. Firebase 빌드 타임 초기화 에러 (2026-01-02)
**문제**:
```
FirebaseAppError: The default Firebase app does not exist.
Module not found: Can't resolve 'firebase/auth'
```

**원인**:
- 빌드 타임에 환경 변수 (`NEXT_PUBLIC_FIREBASE_API_KEY` 등)가 없음
- Firebase를 즉시 초기화하려 해서 에러 발생

**해결**:
`firebase.js`와 `firebaseAdmin.js`에 **lazy initialization** 패턴 적용:

```javascript
// Before (즉시 초기화 - 빌드 타임 에러!)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// After (lazy initialization - 빌드 성공)
let _app, _auth, _db;

export const app = () => {
    if (!_app && firebaseConfig.apiKey) {
        _app = initializeApp(firebaseConfig);
    }
    return _app;
};

export const auth = () => {
    if (!_auth && app()) _auth = getAuth(app());
    return _auth;
};

export const db = () => {
    if (!_db && app()) _db = getFirestore(app());
    return _db;
};
```

**사용 방법 변경**:
```javascript
// Before
import { db } from '@/lib/firebase';
db.collection('users').get();

// After
import { db } from '@/lib/firebase';
db().collection('users').get();  // 함수로 호출!
```

**교훈**:
1. 빌드 타임에는 환경 변수가 없을 수 있음
2. Firebase 같은 외부 서비스는 lazy initialization 필수
3. export 방식을 함수로 변경하면 런타임에만 초기화

---

## 🎯 프로젝트 특수 규칙

### Yahoo Finance API 사용
- **라이브러리**: `yahoo-finance2` 사용
- **주의사항**: API 호출 빈도 제한이 있으므로 캐싱 고려

### 데이터 구조
- **Google Sheets 연동**: `/src/lib/googleSheets.js` 참조
- **거래 기록**: `/data/` 폴더의 JSON 파일로 관리

---

## 📝 작업 이력

- **2026-01-02**: 에러 로깅 시스템 구축 및 Firebase 빌드 수정
  - ✅ `src/lib/logger.ts` 생성 (TypeScript, 중앙화된 로깅)
  - ✅ console 제거 (14개 파일, 약 25회)
    - Pages: `page.js`, `rebalancing/page.js`
    - Components: `JournalSection.js`
    - API Routes: `trades`, `assets`, `journal`, `firebaseAdmin`
  - ✅ ESLint 9 설정 수정 (flat config 형식)
  - ✅ Firebase lazy initialization 적용
    - `firebase.js`, `firebaseAdmin.js` 수정
    - 모든 API routes에서 `db()` 함수 호출로 변경
  - ✅ **빌드 성공**: npm run build 통과
  - **패턴 확립**: 나머지 38개 파일도 동일한 패턴으로 수정 가능

- **2026-01-01**: lessons.md 초기 생성 - 프로젝트 기본 구조 및 규칙 정의

---

**💡 TIP**: 각 작업 세션이 끝날 때마다 회고(Retrospective)를 통해 이 파일을 업데이트하세요!
