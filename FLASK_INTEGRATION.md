# 🔥 Flask API 서버 연동 가이드

React Native 앱을 Flask API 서버와 연동하는 방법입니다.

## 📋 사전 준비

### 1. Flask API 서버 실행

```bash
cd ~/Desktop/Bool_final
source venv/bin/activate
python app.py
```

서버가 **http://192.168.219.102:5001** 에서 실행됩니다.

### 2. 네트워크 확인

앱과 서버가 **같은 WiFi 네트워크**에 연결되어 있어야 합니다.

내 IP 확인:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## ⚙️ 앱 설정

### API 서버 주소 변경

`src/services/FireDetectionAPI.js` 파일에서 서버 주소를 변경하세요:

```javascript
// 실제 기기에서 사용할 IP 주소로 변경
const API_BASE_URL = 'http://YOUR_SERVER_IP:5001';

// 예시:
// const API_BASE_URL = 'http://192.168.219.102:5001';
```

## 🚀 앱 실행

### iOS (macOS)

```bash
cd /Users/leeyushin/Bool_Ai/FireDetectionApp

# 의존성 설치
npm install
cd ios && pod install && cd ..

# 앱 실행
npm run ios
```

### Android

```bash
cd /Users/leeyushin/Bool_Ai/FireDetectionApp

# 의존성 설치
npm install

# Android 앱 실행
npm run android
```

## 📱 앱 사용 방법

### 1. Detection 탭

- **감지 시작** 버튼을 누르면 카메라가 활성화됩니다
- 2초마다 프레임을 캡처하여 Flask API로 전송합니다
- 화재가 감지되면 화면에 표시됩니다

### 2. 감지 모드

앱은 3가지 모드로 동작합니다:

1. **🌐 Flask API** (최우선)
   - 카메라 프레임을 Flask API로 전송
   - YOLOv8 + CLIP 모델로 분석
   - 가장 정확한 결과 제공

2. **🤖 로컬 AI** (폴백)
   - Flask API 사용 불가 시 자동 전환
   - 로컬 TFLite 모델 사용

3. **🎲 시뮬레이션** (데모)
   - 카메라 없거나 모델 없을 때
   - 시뮬레이터에서 테스트용

### 3. 화재 분류

Flask API는 4가지로 분류합니다:

- 🌲🔥 **산불** (wildfire) - 숲/초원 화재
- 🏙️🔥 **도심 화재** (urban_fire) - 건물/도로 화재
- 🏭🔥 **공장 화재** (industrial_fire) - 산업 시설 화재
- ⚠️ **화재 의심** (uncertain) - 판단 불명확

## 🧪 테스트

### 서버 연결 확인

앱을 실행하면 콘솔에 다음 로그가 표시됩니다:

```
🏥 Checking Flask API server...
✅ Flask API server is available
```

서버 연결 실패 시:
```
❌ Flask API server is not available
```

### 감지 테스트

1. **감지 시작** 버튼 클릭
2. 카메라가 화재/연기를 향하도록 조정
3. 2초마다 자동 분석
4. 결과가 화면 하단에 표시:
   ```
   상태: 도심 화재 감지
   신뢰도: 89.5%
   🌐 Flask API
   ```

## 🔧 트러블슈팅

### 1. "Server not available" 에러

**원인:**
- Flask 서버가 실행되지 않음
- 다른 WiFi 네트워크 사용 중
- 방화벽 차단

**해결:**
```bash
# 1. 서버 실행 확인
cd ~/Desktop/Bool_final
source venv/bin/activate
python app.py

# 2. 서버 접속 테스트 (다른 터미널)
curl http://192.168.219.102:5001/health

# 3. 방화벽 확인 (macOS)
# 시스템 환경설정 > 보안 > 방화벽
```

### 2. 카메라 권한 에러

**iOS:**
```
설정 > FireDetectionApp > 카메라 > 허용
```

**Android:**
```
설정 > 앱 > FireDetectionApp > 권한 > 카메라 > 허용
```

### 3. 느린 응답 속도

**원인:** CPU에서 YOLO + CLIP 실행 시 느림

**해결:**
```python
# Flask 서버에서 GPU 사용 (CUDA 지원 시)
# app.py 자동으로 GPU 감지하여 사용
```

**또는 감지 간격 조정:**
```javascript
// DetectionScreen.js
interval = setInterval(() => {
  analyzeFrame();
}, 3000); // 2초 → 3초로 변경
```

### 4. iOS 시뮬레이터에서 카메라 없음

**정상 동작입니다.**
- 시뮬레이터는 카메라 지원 안 함
- 자동으로 시뮬레이션 모드로 전환됨
- 실제 기기에서 테스트하세요

## 📊 API 응답 형식

Flask API는 다음 형식으로 응답합니다:

```json
{
  "status": "urban_fire",
  "has_fire": false,
  "has_smoke": true,
  "boxes": [
    {
      "x1": 894,
      "y1": 167,
      "x2": 2531,
      "y2": 724,
      "confidence": 0.48,
      "class": "smoke"
    }
  ],
  "scene_analysis": {
    "scene_type": "urban_fire",
    "wildfire_prob": 0.01,
    "urban_prob": 0.99,
    "industrial_prob": 0.00,
    "confidence": 0.99
  },
  "timestamp": 1698765432.123
}
```

## 🎯 개선 사항

### 성능 최적화

1. **이미지 압축**
```javascript
// FireDetectionAPI.js
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'fire_detection.jpg',
  // 압축 옵션 추가 (react-native-image-resizer)
});
```

2. **배치 처리**
- 여러 프레임을 모아서 한 번에 전송
- 네트워크 오버헤드 감소

3. **캐싱**
- 최근 결과 캐싱
- 동일한 장면에서 중복 API 호출 방지

### 오프라인 지원

```javascript
// 네트워크 상태 체크
import NetInfo from '@react-native-community/netinfo';

NetInfo.fetch().then(state => {
  if (!state.isConnected) {
    // 로컬 모델로 폴백
  }
});
```

## 📚 관련 파일

- `src/services/FireDetectionAPI.js` - Flask API 클라이언트
- `src/screens/DetectionScreen.js` - 화재 감지 화면
- `src/screens/HistoryScreen.js` - 감지 기록
- `~/Desktop/Bool_final/app.py` - Flask API 서버

## 🔗 참고 링크

- [Flask API README](../Desktop/Bool_final/README.md)
- [React Native Vision Camera](https://github.com/mrousavy/react-native-vision-camera)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**문제가 발생하면 콘솔 로그를 확인하세요:**
- iOS: Xcode Console
- Android: `adb logcat`
- React Native: Metro Bundler 터미널
