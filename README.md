# Portfolio Rebalancing App

개인 포트폴리오 리밸런싱 및 자산 관리를 위한 웹 애플리케이션입니다.

## 시작하기 (Getting Started)

이 프로젝트를 다른 컴퓨터에서 실행하려면 다음 단계를 따르세요.

### 1. 필수 요구사항
- [Node.js](https://nodejs.org/) (버전 18 이상 권장)
- Git

### 2. 설치 및 실행

터미널(명령 프롬프트)을 열고 다음 명령어를 순서대로 입력하세요.

```bash
# 1. 저장소 복제 (Clone)
git clone <저장소 주소>
cd portfolio

# 2. 의존성 설치 (Install Dependencies)
npm install

# 3. 개발 서버 실행 (Run Dev Server)
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 주소로 접속하면 앱을 볼 수 있습니다.

### 3. 프로덕션 모드 실행 (더 빠름)

개발 모드보다 더 빠르게 실행하고 싶다면 다음 명령어를 사용하세요.

```bash
npm run build
npm start
```

## 주요 기능
- **리밸런싱**: 현재 자산과 목표 비중을 비교하여 매수/매도 수량 계산
- **시뮬레이션**: 보유하지 않은 종목을 추가하여 포트폴리오 시뮬레이션
- **자동 데이터**: Yahoo Finance API를 통해 실시간 주가 및 환율 연동
- **투자 일지**: AI를 활용한 투자 일지 생성 (예정)

## 기술 스택
- Next.js 15
- React
- Yahoo Finance API
- Chart.js
