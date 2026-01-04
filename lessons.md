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

### 3. Vercel 배포 404 에러 (2026-01-02)
**문제**:
- 배포 성공 (`200 OK`) 로그가 뜨지만, 실제 사이트 접속 시 404 페이지 표시
- Vercel이 빌드 결과물을 올바른 경로에서 찾지 못함

**원인**:
- **Root Directory 설정 오류**: 프로젝트가 레포지토리 최상위(`root`)에 있는데, Vercel 설정에서 `portfolio`라는 하위 폴더를 바라보게 설정됨
- `package.json`이 있는 위치가 Root Directory여야 함

**해결**:
1. Vercel Dashboard > Settings > Build and Deployment
2. **Root Directory** 항목을 **빈칸**으로 수정 (기본값)
3. Redeploy

**교훈**:
- "Root Directory"는 `package.json`이 있는 위치를 기준
- 모노레포가 아니라면 보통 빈칸이 정답

---

### 4. Firebase Admin 환경 변수 미설정 (2026-01-02)
**문제**:
```
GET /api/assets 500 (Internal Server Error)
{error: "Failed to read assets"}
```

**원인**:
- API routes가 Firebase Admin SDK를 사용하려 했으나 서버 측 환경 변수 미설정
- `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` 누락
- 로컬 개발 환경에서 `db()`가 `undefined` 반환

**해결**:
Firebase Admin 대신 **로컬 JSON 파일 저장소**로 전환:

```javascript
// Before (Firebase Admin - 환경 변수 필요)
import { db } from '@/lib/firebaseAdmin';
const snapshot = await db().collection('trades').get();

// After (Local JSON - 환경 변수 불필요)
import { promises as fs } from 'fs';
const data = await fs.readFile('data/trades.json', 'utf8');
const trades = JSON.parse(data);
```

**영향받은 파일**:
- `/api/assets/route.js`
- `/api/liabilities/route.js`
- `/api/trades/route.js`
- `/api/history/route.js`

**교훈**:
1. 로컬 개발 환경에서는 간단한 파일 시스템이 더 효율적
2. 배포 환경과 개발 환경을 분리해서 관리
3. API 에러 시 서버 로그를 먼저 확인

---

### 5. Yahoo Finance Rate Limit 초과 (2026-01-02)
**문제**:
- Yahoo Finance API에서 빈 응답 반환
- 무료 API라 명시적 rate limit은 없지만 과도한 요청 시 차단

**해결**:
**Alpha Vantage**로 전환 + 공격적인 캐싱:

```javascript
// 캐시 전략
setCachedPrice(ticker, data, 3600); // 1시간 캐시

// API 한도: 25 calls/day
// 1시간 캐시 = 하루 최대 24회 호출 = 안전
```

**교훈**:
- 무료 API는 항상 백업 플랜 필요
- 캐싱은 성능뿐 아니라 생존 전략
- API 한도를 문서화하고 모니터링

---

### 6. Python 경로 문제 (Windows) (2026-01-02)
**문제**:
```
Error: Python script exited with code 9
```

**원인**:
- Node.js에서 `python3` 명령어 실행 시도
- Windows에서는 `python3`가 아닌 `python` 사용

**해결**:
```javascript
// Before
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';

// After (Windows 호환)
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
```

**교훈**:
1. 크로스 플랫폼 호환성 고려
2. 환경 변수로 유연하게 설정 가능하도록
3. 에러 코드로 문제 원인 추적

---

### 7. Array.isArray() 검증 누락 (2026-01-02)
**문제**:
```
TypeError: manualAssets.filter is not a function
```

**원인**:
- API 응답이 실패하면 객체 `{error: "..."}` 반환
- 클라이언트가 배열이라 가정하고 `.filter()` 호출

**해결**:
```javascript
// Before
setManualAssets(await resAssets.json());

// After (방어 코드)
const assetsData = await resAssets.json();
setManualAssets(Array.isArray(assetsData) ? assetsData : []);
```

**영향범위**: `trades`, `history`, `manualAssets`, `liabilities` 모든 state

**교훈**:
- API 응답은 항상 검증
- 타입 안전성 확보 (TypeScript 사용 시 더 좋음)
- 에러 객체와 정상 데이터 구조 통일

---

## 🎯 프로젝트 특수 규칙

### 가격 데이터 API 사용
- **미국 주식**: Alpha Vantage (`yahoo-finance2` → `alphavantage` 전환)
  - 한도: 25 calls/day
  - 캐시: 1시간
- **한국 주식**: PyKRX (Python 라이브러리)
  - 한도: 무제한
  - 캐시: 15분
- **암호화폐**: CoinMarketCap
  - 한도: 10,000 calls/month (Basic plan)
  - 캐시: 30분
- **주의사항**: 캐싱은 필수! API 한도 초과 방지

### 데이터 구조
- **Google Sheets 연동**: `/src/lib/googleSheets.js` 참조
- **거래 기록**: `/data/` 폴더의 JSON 파일로 관리 (로컬 개발)

### Python 통합 (한국 주식)
- **스크립트**: `/python/fetch_kr_prices.py`
- **의존성**: PyKRX, pandas, numpy
- **호출 방식**: Node.js `child_process.spawn()`
- **환경 변수**: `PYTHON_PATH` (기본값: `python`)

---

## 📝 작업 이력

- **2026-01-02 (오후)**: 멀티소스 가격 API 아키텍처 구축
  - ✅ 티커 자동 분류 시스템 (`tickerUtils.js`)
  - ✅ 3개 Price Provider 구현:
    - `alphaVantage.js` - 미국 주식 (1시간 캐시)
    - `koreanStocks.js` - 한국 주식 + Python 통합 (15분 캐시)
    - `coinMarketCap.js` - 암호화폐 (30분 캐시)
  - ✅ Python 백엔드 통합 (PyKRX)
    - `python/fetch_kr_prices.py` 생성
    - `python/requirements.txt` 생성
    - setuptools 설치 (Python 3.13 호환성)
  - ✅ 캐싱 레이어 개선 (맞춤 TTL 지원)
  - ✅ 메인 API 리팩토링 (`/api/prices/route.js`)
  - ✅ 테스트 완료: 6개 자산 × 3개 소스 = 18개 경로 검증
  - **성과**: API 비용 $0, 모든 자산군 실시간 가격 조회 성공

- **2026-01-02 (오전)**: Firebase 환경 변수 설정 및 로컬 데이터 마이그레이션
  - ✅ `.env.local` 파일 생성 (Firebase client 설정)
  - ✅ Firebase 초기화 검증 로직 추가
  - ✅ Firebase Admin → 로컬 JSON 파일로 전환 (4개 API)
  - ✅ 배열 검증 로직 추가 (`Array.isArray()`)
  - **성과**: 로컬 개발 서버 정상 작동

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

### 8. Private Key 환경 변수 처리 (2026-01-02)
**문제**:
```
Error: 16 UNAUTHENTICATED: Request had invalid authentication credentials.
```
- `.env` 파일에 RSA Private Key(`-----BEGIN...`)를 저장할 때 줄바꿈(`\n`) 처리가 깨짐.
- Copy/Paste 과정에서 공백이 들어가거나 개행이 문자열로 취급됨.

**해결**:
1. **파일 직접 로드**: `serviceAccountKey.json` 파일을 `.gitignore` 처리 후 직접 읽기.
2. **Base64 인코딩**: Private Key 전체를 Base64로 인코딩해서 환경 변수에 저장하고 코드에서 디코딩.

**교훈**:
- 다중 라인 비밀키(Certificate 등)는 환경 변수로 다루기 까다롭다.
- 개발 환경에서는 보안이 보장된다면(gitignore) JSON 키 파일을 직접 쓰는 것이 정신 건강에 이롭다.

---

### 9. Provider 패턴의 유용성 (2026-01-02)
**상황**:
- Yahoo Finance rate limit 문제로 Alpha Vantage로 교체했으나, 하루 25회 제한으로 다시 문제 발생.
- 결국 Yahoo Finance로 다시 복귀 결정.

**성과**:
- `fetchUSStocks` 함수 인터페이스를 동일하게 유지한 덕분에, `route.js`의 변경 없이 Provider 모듈(`import`)만 교체하여 해결.
- **Dependency Inversion** 원칙이 실무에서 빛을 발함.

**교훈**:
- 외부 API는 언제든 바뀔 수 있다. 반드시 추상화 계층(Wrapper)을 두어라.

---

## 🎯 프로젝트 특수 규칙

### 가격 데이터 API 사용
- **미국 주식/지수/환율**: **Yahoo Finance** (`yahoo-finance2`) - *Main*
- **한국 주식**: PyKRX (Python 라이브러리)
- **암호화폐**: CoinMarketCap (Basic plan)
- **Alpha Vantage**: *Deprecated* (Backup용으로 보존)

### 데이터 구조
- **Google Sheets 연동**: `/src/lib/googleSheets.js` 참조
- **거래 기록**: `/data/` 폴더의 JSON 파일로 관리 (로컬 개발)
  - **복구 가이드**: `scripts/sync-trades.js`를 사용하여 Firestore와 동기화 가능.

### Python 통합 (한국 주식)
- **스크립트**: `/python/fetch_kr_prices.py`
- **의존성**: PyKRX, pandas, numpy
- **호출 방식**: Node.js `child_process.spawn()`
- **환경 변수**: `PYTHON_PATH` (기본값: `python`)

---

## 📝 작업 이력

- **2026-01-02 (저녁)**: 데이터 복구 및 Yahoo Finance 복귀
  - ✅ **Yahoo Finance 재도입**: Alpha Vantage 한도 문제 해결, 지수/환율 데이터 확보.
  - ✅ **데이터 복구**: Firestore 동기화 스크립트 작성, 12/26~30 누락 데이터 15건 복구.
  - ✅ **인증 해결**: 환경 변수 대신 JSON 키 파일 로드 방식으로 Firebase Admin 인증 성공.

- **2026-01-02 (오후)**: 멀티소스 가격 API 아키텍처 구축
  - ✅ 티커 자동 분류 시스템 (`tickerUtils.js`)
  - ✅ 3개 Price Provider 구현:
    - Alpha Vantage, Korean Stocks, CoinMarketCap

### 10. Dual Storage & Sync Pattern (2026-01-03)
**상황**:
- 사용자가 데스크탑과 노트북을 번갈아 사용하면서 데이터 동기화를 원함.
- 단순히 클라우드 드라이브(OneDrive 등)에 프로젝트 폴더를 넣는 것은 `node_modules` 충돌 위험.

**해결**:
1. **Dual Write**: 로컬 JSON 파일과 Firebase Firestore에 동시 저장 (`dataService.js`).
2. **Local First**: 읽기는 항상 로컬 JSON을 사용하여 속도 보장.
3. **Sync API**: 데이터 불일치 시 `/api/sync`를 통해 클라우드 데이터를 로컬로 덮어쓰기 기능 제공.

**교훈**:
- 물리적 파일 동기화보다 애플리케이션 레벨의 동기화가 훨씬 안정적이다.
- 특히 `node_modules` 같은 무거운 종속성이 있는 프로젝트는 더더욱 그렇다.

### 11. Ghost Data (유령 데이터) 위험성 (2026-01-03)
**상황**:
- 포트폴리오 수익률이 갑자기 -48%로 표기됨.
- 원인을 찾기 위해 코드를 뒤졌으나, 범인은 `trades.json`에 숨어있던 "TEST" 종목 데이터.

**해결**:
- 디버그 스크립트로 데이터 전체 스캔 후 문제 데이터 삭제.

**교훈**:
- 테스트를 위한 더미 데이터는 반드시 `db:seed` 스크립트 등을 통해 관리하고, 운영 데이터 파일에 직접 넣지 말 것.
- JSON 파일 기반 DB는 데이터 무결성 검증 도구가 없으므로 정기적인 검사 필요.

### 12. Next.js API Imports (2026-01-03)
**상황**:
- `/api/ai-data` 호출 시 500 에러 발생, 로그 확인 불가.
- 원인은 `portfolioUtils`에서 `categorizeTickers`를 import 하려 했으나, 해당 함수는 `tickerUtils`에 존재.

**교훈**:
- 자동 완성을 맹신하지 말고 Import 경로를 항상 확인.
- Next.js API Routes에서 500 에러 시, `try/catch` 블록에서 `error.message`와 `stack`을 응답으로 내려주면 `curl`로 디버깅 가능.

### 13. Journal API 500 Error - Dual Storage 누락 (2026-01-04)
**문제**:
```
POST /api/journal 500 (Internal Server Error)
{"error":"Internal Server Error"}
```
- `JournalSection`에서 저장 버튼 클릭 시 500 에러 발생.

**원인**:
- `/api/journal/route.js`가 Firebase Admin SDK(`db()`)를 직접 사용.
- 로컬 환경에서 Firebase credentials 미설정 시 `db()`가 `undefined` 반환.
- 다른 API들(`trades`, `history`)은 이미 Dual Storage 패턴을 사용 중이었으나, `journal` API는 누락.

**해결**:
```javascript
// Before (Firebase 직접 사용 - credentials 없으면 에러)
const snapshot = await db().collection('journals').where('date', '==', date).get();

// After (Local-first + Firebase background sync)
const journals = await getLocalJournals(); // data/journals.json
const index = journals.findIndex(j => j.date === date);
// ... upsert logic ...
await saveLocalJournals(journals);
syncToFirebase(newEntry).catch(err => logError('Firebase Sync Error', err));
```

**교훈**:
1. 새 API route 작성 시 기존 패턴(Dual Storage)을 따르는지 확인.
2. Firebase 의존 코드는 항상 fallback 로직 필요.
3. `db()`가 `undefined`일 수 있음을 전제로 코딩.

---

## 📝 작업 이력 (계속)

- **2026-01-04**: Journal API 500 에러 수정
  - ✅ **Dual Storage 적용**: `/api/journal/route.js`에 로컬 JSON + Firebase sync 패턴 적용.
  - ✅ **lessons.md 회고**: 교훈 #13 추가.

- **2026-01-03 (오전/오후)**: 포트폴리오 안정화 및 AI 기능 추가
  - ✅ **Dual Storage 구축**: 로컬+클라우드 하이브리드 저장소.
  - ✅ **AI Context API**: LLM 전용 데이터 요약 엔드포인트 완성.
  - ✅ **Startup Script**: 원클릭 실행 배치 파일(`start-portfolio.bat`) 제공.
  - ✅ **Bug Fix**: `0093D0` 티커 인식 문제 및 Ghost Data("TEST") 삭제.
