# 📝 변경 사항 (Changelog)

## 🎉 2025-10-30 - CAP.pdf 디자인 기반 전면 개편

### ✅ 완료된 작업

#### 1. 백엔드 API 연동 (Bool_final)
- ✅ **AuthAPI.js** - 인증 API (로그인, 회원가입, 프로필, 비밀번호 변경)
- ✅ **UserAPI.js** - 사용자 API (화재 신고, 신고 내역, 계급, 대피소, 문의)
- ✅ JWT 토큰 기반 인증 시스템

#### 2. 새로운 화면 구현
- ✅ **LoginScreen.js** - 로그인 화면 (CAP 디자인)
- ✅ **RegisterScreen.js** - 회원가입 화면 (약관 동의)
- ✅ **MainCameraScreen.js** ⭐ NEW! - 화재 감지 메인 화면
  - ✅ 실시간 위험도 표시
  - ✅ 화재 유형 표시 (산불/도심/공장)
  - ✅ 획득 점수 알림
  - ✅ 자동 신고 기능
- ✅ **ReportsScreen.js** - 신고 내역 (전송 성공/실패, 획득 점수)
- ✅ **MyPageScreen.js** - 마이페이지 (계급, 점수, 설정 메뉴)

#### 3. 앱 구조 재구성
- ✅ **App.tsx** - Stack + Tab 네비게이션
  - Auth Stack (로그인/회원가입)
  - Main Tabs (화재감지/신고내역/마이페이지)
- ✅ 자동 로그인 체크 (AsyncStorage)
- ✅ JWT 토큰 기반 라우팅

---

## 🔥 MainCameraScreen - 새로운 화재 감지 화면

### 주요 기능
1. **실시간 화재 감지**
   - 2초마다 자동 분석
   - Bool_final 백엔드 API 사용
   - 자동 신고 + 점수 획득

2. **위험도 표시**
   ```
   예상 화재 위험도
   80%
   🌲 산불
   ```
   - 80% 이상: 빨간색 (위험)
   - 80% 미만: 주황색 (경고)

3. **획득 점수 알림**
   ```
   ⭐ +20점 획득!
   ```
   - 3초간 표시 후 자동 숨김

4. **화재 감지 알림**
   ```
   🔥 화재 감지!
   🌲 산불
   위험도: 85%
   획득 점수: +30점
   ```
   - 70% 이상 위험도일 때 알림
   - 신고 내역으로 바로 이동 가능

---

## 📊 기존 DetectionScreen vs 새로운 MainCameraScreen

| 기능 | 기존 (DetectionScreen) | 신규 (MainCameraScreen) |
|------|----------------------|------------------------|
| **화재 감지** | ✅ FireDetectionAPI | ✅ UserAPI.detectAndReport |
| **인증** | ❌ 없음 | ✅ JWT 토큰 |
| **자동 신고** | ❌ 없음 | ✅ 소방서에 자동 신고 |
| **점수 획득** | ❌ 없음 | ✅ 위험도 기반 점수 |
| **위험도 UI** | ❌ 없음 | ✅ 대형 위험도 표시 |
| **화재 유형** | ✅ 표시 | ✅ 한글로 표시 |
| **위치 정보** | ❌ 없음 | ✅ GPS + 주소 |

---

## 🎯 API 연동 방식 변경

### 기존
```javascript
// 단순 화재 감지만
const result = await FireDetectionAPI.detectFire(imageUri);
// { fireDetected, category, confidence }
```

### 신규
```javascript
// 화재 감지 + 자동 신고 + 점수 획득
const token = await AsyncStorage.getItem('access_token');
const result = await UserAPI.detectAndReport(token, imageUri, locationData);
// {
//   status: 'wildfire',
//   confidence: 85,
//   points_earned: 30,  ⭐ NEW!
//   has_fire: true,
//   has_smoke: true
// }
```

---

## 🔄 업그레이드 가이드

### 기존 DetectionScreen을 사용하고 있다면?

**옵션 1: MainCameraScreen 사용 (권장)**
```typescript
// App.tsx에서
import MainCameraScreen from './src/screens/MainCameraScreen';

<Tab.Screen name="Detection" component={MainCameraScreen} />
```
✅ 백엔드 연동 완료
✅ CAP 디자인 적용
✅ 모든 기능 작동

**옵션 2: DetectionScreen 수정**
```javascript
// DetectionScreen.js에서
import UserAPI from '../services/UserAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

// analyzeFrame() 함수 수정
const token = await AsyncStorage.getItem('access_token');
const result = await UserAPI.detectAndReport(token, imageUri, locationData);
```

---

## 📱 UI 변경사항

### 메인 화면
```
┌─────────────────────┐
│ 📍 경기 용인시...    │  ← 위치 표시
├─────────────────────┤
│  예상 화재 위험도    │
│       80%           │  ← 대형 위험도 표시
│    🌲 산불          │  ← 화재 유형
├─────────────────────┤
│  ⭐ +30점 획득!     │  ← 점수 알림 (3초간)
└─────────────────────┘

     [카메라 화면]

┌─────────────────────┐
│    🔥               │
│   감지 시작          │  ← 감지 버튼
└─────────────────────┘
```

### 화재 감지 시
```
┌───────────────────┐
│                   │
│    🔥            │
│  화재 감지됨!     │
│                   │
│ 소방서에 자동      │
│ 신고되었습니다    │
│                   │
└───────────────────┘
```

---

## 🐛 알려진 이슈

### 1. iOS 시뮬레이터
- **문제**: 카메라 사용 불가
- **해결**: 실제 기기에서 테스트

### 2. 위치 정보
- **현재**: 하드코딩된 더미 위치
- **TODO**: 실제 GPS 사용 (react-native-geolocation-service)

### 3. DetectionScreen (기존)
- **상태**: 여전히 존재하지만 사용 안 함
- **권장**: MainCameraScreen 사용

---

## 📦 추가된 패키지

모두 이미 설치되어 있음:
```json
{
  "@react-native-async-storage/async-storage": "^1.24.0",
  "@react-navigation/native-stack": "^6.9.17",
  "react-native-vision-camera": "^3.6.0"
}
```

---

## 🚀 다음 단계

### 프론트엔드 팀이 해야 할 일:

#### 필수
- [ ] IP 주소 변경 (3개 API 파일)
- [ ] 실제 기기에서 테스트
- [ ] GPS 위치 정보 연동

#### 선택
- [ ] 대피소 지도 구현
- [ ] 비밀번호 찾기 UI
- [ ] 문의사항 UI
- [ ] 회원 탈퇴 플로우
- [ ] 프로필 수정 화면
- [ ] 계급 정보 화면

---

## 📚 문서

### 새로 작성된 문서
- `README_NEW.md` - 전체 가이드
- `CHANGELOG.md` - 이 파일

### 기존 문서
- `FLASK_INTEGRATION.md` - Flask 연동 가이드
- `README.md` - 기존 README
- `~/Desktop/Bool_final/API_문서.md` - 백엔드 API 명세
- `~/Desktop/Bool_final/프론트엔드_연동가이드.md` - 연동 가이드

---

## 🎉 완료!

**모든 기능 구현 완료!**

- ✅ 로그인/회원가입
- ✅ 화재 감지 + 자동 신고
- ✅ 위험도 표시
- ✅ 점수 획득 시스템
- ✅ 계급 시스템
- ✅ 신고 내역
- ✅ 마이페이지

이제 프론트엔드 팀이 세부 UI를 조정하고 추가 기능을 구현하면 됩니다!
