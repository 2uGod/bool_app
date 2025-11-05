# BOOL 모바일 앱 (React Native)

화재 감지 및 신고를 위한 모바일 애플리케이션입니다.

## 📱 기술 스택

- React Native 0.82.0
- React Navigation (Stack + Bottom Tabs)
- AsyncStorage (로컬 저장소)
- Vision Camera (카메라 기능)
- TensorFlow.js (추후 온디바이스 AI 기능)

## 🚀 설치 및 실행

### 1. 사전 요구사항

- Node.js 20 이상
- iOS 개발: Xcode 및 CocoaPods (Mac만 가능)
- Android 개발: Android Studio 및 JDK

React Native 환경 설정: [공식 가이드](https://reactnative.dev/docs/set-up-your-environment)

### 2. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd Bool_pj/mobile
npm install
```

### 3. iOS Pod 설치 (Mac만 해당)

```bash
cd ios
pod install
cd ..
```

### 4. 백엔드 서버 주소 설정 ⚠️ 중요!

`src/config/api.js` 파일에서 API 주소가 설정되어 있습니다:

```javascript
// AWS 클라우드 서버
export const API_BASE_URL = 'http://13.125.225.201:3000';
```

**별도 수정 없이 바로 사용 가능합니다!**

### 5. 앱 실행

#### iOS (Mac만 가능)

```bash
npm run ios
```

#### Android

```bash
npm run android
```

## 🔧 HTTP 통신 설정 (이미 완료됨)

### iOS

`ios/FireDetectionApp/Info.plist`에 설정되어 있습니다:
- HTTP 통신 허용 (NSAllowsArbitraryLoads)
- AWS 서버 예외 도메인 설정

### Android

`android/gradle.properties`에 설정되어 있습니다:
```properties
usesCleartextTraffic=true
```

## 📂 프로젝트 구조

```
mobile/
├── src/
│   ├── config/
│   │   └── api.js              # API 주소 설정 ⚠️
│   ├── screens/
│   │   ├── LoginScreen.js      # 로그인
│   │   ├── RegisterScreen.js   # 회원가입
│   │   ├── MainCameraScreen.js # 화재 감지 카메라
│   │   ├── ReportsScreen.js    # 신고 내역
│   │   └── MyPageScreen.js     # 마이페이지
│   ├── services/
│   │   ├── AuthAPI.js          # 인증 API
│   │   ├── UserAPI.js          # 사용자 API
│   │   ├── FireDetectionAPI.js # 화재 감지 API
│   │   └── BackendHealthAPI.js # 서버 헬스 체크
│   └── components/
├── android/                    # Android 네이티브 코드
├── ios/                        # iOS 네이티브 코드
└── App.tsx                     # 앱 엔트리 포인트
```

## 🐛 문제 해결

### "서버 연결 실패" 오류

1. 백엔드 서버가 실행 중인지 확인
2. `src/config/api.js`의 IP 주소가 올바른지 확인
3. 실제 기기 테스트 시: 같은 WiFi 네트워크에 연결되어 있는지 확인

### Metro Bundler 캐시 문제

```bash
npm start -- --reset-cache
```

### iOS 빌드 오류

```bash
cd ios
rm -rf build Pods
pod install
cd ..
```

### Android 빌드 오류

```bash
cd android
./gradlew clean
cd ..
```

### ATS Policy 오류 (iOS)

Info.plist 설정을 확인하고, 필요시 Xcode에서 클린 빌드:
```bash
cd ios
xcodebuild clean
cd ..
```

## 📱 테스트

### 에뮬레이터/시뮬레이터

- iOS Simulator 및 Android Emulator에서 테스트 가능
- AWS 클라우드 서버에 연결되므로 인터넷 연결만 필요

### 실제 기기

- WiFi 또는 모바일 데이터 연결 필요
- AWS 클라우드 서버에 연결되므로 별도 설정 불필요

## 🔐 권한

앱 실행 시 다음 권한이 필요합니다:

- 📷 **카메라**: 화재 감지 기능 (필수)
- 🎤 **마이크**: 비디오 녹화 (선택)
- 📍 **위치**: 화재 신고 위치 정보 (선택)

## 📚 관련 문서

- 백엔드 API: `../backend/README.md`
- API 문서 (Swagger): `http://13.125.225.201:3000/api-docs`
- [React Native 공식 문서](https://reactnative.dev/)

## 🤝 기여

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다
