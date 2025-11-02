# 🔥 BOOL FireDetectionApp - 새로운 버전

**CAP.pdf 디자인 기반 전면 개편 완료!**

## 🎯 주요 변경사항

### ✅ 백엔드 연동 완료
- Bool_final 백엔드 API와 완전 연동
- 실제 회원가입/로그인 시스템
- JWT 토큰 기반 인증
- 신고 내역, 계급 시스템 연동

### ✅ 새로운 화면들
1. **로그인/회원가입** - CAP 디자인 적용
2. **메인 화면** - 화재 감지 (기존 DetectionScreen 개선 필요)
3. **신고 내역** - 전송 성공/실패 표시, 획득 점수 표시
4. **마이페이지** - 계급 표시, 점수, 설정 메뉴

---

## 📁 새로운 파일 구조

```
FireDetectionApp/
├── src/
│   ├── services/
│   │   ├── AuthAPI.js ⭐ NEW - 인증 API
│   │   ├── UserAPI.js ⭐ NEW - 사용자/신고 API
│   │   └── FireDetectionAPI.js (기존)
│   └── screens/
│       ├── LoginScreen.js ⭐ NEW
│       ├── RegisterScreen.js ⭐ NEW
│       ├── MyPageScreen.js ⭐ NEW
│       ├── ReportsScreen.js ⭐ NEW
│       ├── DetectionScreen.js (기존 - 수정 필요)
│       ├── HistoryScreen.js (기존)
│       └── SettingsScreen.js (기존)
└── App.tsx ⭐ 전면 개편 - 네비게이션 재구성
```

---

## 🚀 실행 방법

### 1. 백엔드 서버 시작
```bash
cd ~/Desktop/Bool_final
source venv/bin/activate
python app_test.py
# → http://192.168.59.226:5001 에서 실행됨
```

### 2. 앱 실행
```bash
cd ~/Bool_Ai/FireDetectionApp
npm install
npm run ios  # iOS
# 또는
npm run android  # Android
```

---

## 🔗 API 서버 주소 설정

현재 API 서버 주소가 코드에 하드코딩되어 있습니다:

**수정이 필요한 파일:**
```
src/services/AuthAPI.js:7
src/services/UserAPI.js:6
src/services/FireDetectionAPI.js:8
```

모두 다음으로 설정됨:
```javascript
const API_BASE_URL = 'http://192.168.59.226:5001';
```

**자신의 IP로 변경하려면:**
```bash
# 터미널에서 IP 확인
ifconfig | grep "inet " | grep -v 127.0.0.1

# 출력 예: inet 192.168.XXX.XXX
# 위 3개 파일에서 IP 주소를 자신의 IP로 변경
```

---

## 📱 앱 플로우

### 1️⃣ 로그인/회원가입
```
시작 → LoginScreen
  ├→ 회원가입 클릭 → RegisterScreen
  │   └→ 가입 성공 → MainTabs (자동 로그인)
  └→ 로그인 성공 → MainTabs
```

### 2️⃣ 메인 앱 (탭 네비게이션)
```
MainTabs
├─ 화재 감지 (DetectionScreen)
│   └→ 화재 감지 시 자동 신고 → 점수 획득
├─ 신고 내역 (ReportsScreen)
│   └→ 전송 성공/실패 상태 표시
└─ 마이페이지 (MyPageScreen)
    ├→ 현재 계급 및 점수 표시
    ├→ 개인 정보 설정
    ├→ 대피소 위치
    ├→ 문의사항
    └→ 로그아웃
```

---

## 🎨 CAP.pdf 디자인 적용 현황

### ✅ 완료된 화면
- [x] 로그인 화면
- [x] 회원가입 화면
- [x] 마이페이지
- [x] 신고 내역
- [x] 계급 시스템 표시

### ⚠️ 추가 작업 필요
- [ ] 메인 화면 - 위험도 표시 추가
- [ ] 대피소 지도
- [ ] 비밀번호 찾기/변경
- [ ] 문의사항 UI
- [ ] 회원 탈퇴 플로우

---

## 🔑 주요 기능

### 1. 인증 (AuthAPI)
```javascript
// 회원가입
await AuthAPI.register({email, password, name, phone});

// 로그인
await AuthAPI.login(email, password);

// 프로필 조회
await AuthAPI.getProfile(token);

// 비밀번호 변경
await AuthAPI.changePassword(token, currentPassword, newPassword);

// 회원 탈퇴
await AuthAPI.deactivate(token, password);
```

### 2. 사용자 (UserAPI)
```javascript
// 화재 감지 및 신고
await UserAPI.detectAndReport(token, imageUri, locationData);

// 내 신고 내역
await UserAPI.getMyReports(token);

// 내 계급 정보
await UserAPI.getMyRank(token);

// 대피소 조회
await UserAPI.getShelters(latitude, longitude);

// 문의사항 등록
await UserAPI.submitInquiry(token, title, content);
```

### 3. 화재 감지 (FireDetectionAPI)
```javascript
// 서버 상태 확인
await FireDetectionAPI.checkHealth();

// 화재 감지 (기존 방식)
await FireDetectionAPI.detectFire(imageUri, withAnnotation);

// 시뮬레이션 (서버 없을 때)
await FireDetectionAPI.simulateDetection();
```

---

## 🎯 백엔드 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/user/profile` - 프로필 조회 (JWT)
- `POST /api/user/password` - 비밀번호 변경 (JWT)
- `POST /api/user/deactivate` - 회원 탈퇴 (JWT)

### 화재 & 신고
- `POST /api/detect` - 화재 감지 및 자동 신고 (JWT)
- `GET /api/reports/my` - 내 신고 내역 (JWT)
- `GET /api/reports/{id}` - 신고 상세 (JWT)

### 계급 & 대피소
- `GET /api/user/rank` - 내 계급 정보 (JWT)
- `GET /api/ranks` - 전체 계급 목록
- `GET /api/shelters?latitude=&longitude=` - 대피소 조회

자세한 내용은 `~/Desktop/Bool_final/API_문서.md` 참고

---

## 💾 로컬 스토리지

AsyncStorage에 저장되는 데이터:
```javascript
// 토큰
'access_token' - JWT 토큰 (7일 유효)

// 사용자 정보 (캐시)
'user' - JSON.stringify({id, email, name, rank})
```

---

## 🔧 DetectionScreen 수정 가이드

기존 `DetectionScreen.js`를 다음과 같이 수정해야 합니다:

```javascript
// 기존
import FireDetectionAPI from '../services/FireDetectionAPI';

// 변경 후
import UserAPI from '../services/UserAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 화재 감지 시
const handleDetection = async (imageUri) => {
  const token = await AsyncStorage.getItem('access_token');

  // 위치 정보 가져오기 (옵션)
  const locationData = {
    latitude: 37.5,
    longitude: 127.0,
    address: '경기 용인시...',
  };

  // 화재 감지 + 자동 신고
  const result = await UserAPI.detectAndReport(token, imageUri, locationData);

  if (result.success) {
    // result.result.status - 'wildfire', 'urban_fire', 'no_fire'
    // result.result.confidence - 위험도 (0-100)
    // result.result.points_earned - 획득 점수
    console.log('획득 점수:', result.result.points_earned);
  }
};
```

---

## 🎮 계급 시스템

### 11개 소방 계급
1. 소방사 (0점)
2. 소방교 (100점)
3. 소방장 (300점)
4. 소방위 (600점)
5. 소방경 (1000점)
6. 소방령 (1500점)
7. 소방준감 (2200점)
8. 소방정 (3000점)
9. 소방정감 (4000점)
10. 소방감 (5500점)
11. 소방총감 (7500점)

### 점수 획득 방식 (위험도 기반)
- **85% 이상**: 30점
- **70-85%**: 20점
- **50-70%**: 10점
- **50% 미만**: 5점

---

## 🐛 트러블슈팅

### 1. "Network request failed"
```bash
# 서버가 실행 중인지 확인
curl http://192.168.59.226:5001/health

# IP 주소가 맞는지 확인
ifconfig | grep "inet "

# 같은 WiFi에 연결되어 있는지 확인
```

### 2. "401 Unauthorized"
```javascript
// 토큰 만료 또는 없음
// AsyncStorage에서 토큰 확인
const token = await AsyncStorage.getItem('access_token');
console.log('Token:', token);

// 없으면 다시 로그인
```

### 3. iOS 시뮬레이터에서 카메라 안 됨
→ 정상입니다. 시뮬레이터는 카메라 지원 안 함. 실제 기기에서 테스트하세요.

---

## 📚 다음 단계

### 프론트엔드 팀이 해야 할 일:

1. **DetectionScreen 수정**
   - UserAPI.detectAndReport 연동
   - 위험도 표시 추가
   - 획득 점수 알림

2. **추가 화면 구현**
   - 대피소 지도 (MapView)
   - 비밀번호 찾기
   - 문의사항 UI
   - 회원 탈퇴

3. **디자인 개선**
   - CAP.pdf 디자인 완벽 적용
   - 색상, 폰트, 레이아웃 조정

4. **테스트**
   - 실제 기기에서 테스트
   - 백엔드 연동 테스트
   - 각 API 호출 확인

---

## 📞 도움이 필요하면

1. **백엔드 API 문서**: `~/Desktop/Bool_final/API_문서.md`
2. **프론트 연동 가이드**: `~/Desktop/Bool_final/프론트엔드_연동가이드.md`
3. **질문 답변**: `~/Desktop/Bool_final/프론트엔드_질문_답변.md`

---

**🎉 CAP.pdf 디자인 기반 앱 개편 완료!**

이제 프론트엔드 팀이 세부 UI를 조정하고 나머지 화면을 구현하면 됩니다.
