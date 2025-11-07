import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Geolocation from '@react-native-community/geolocation';
import DetectionOverlay from '../components/DetectionOverlay';
import { saveDetection } from '../services/StorageService';
import YoloInferenceService from '../services/YoloInferenceService';
import FireDetectionAPI from '../services/FireDetectionAPI';

const { width, height } = Dimensions.get('window');

const isSimulator =
  Platform.OS === 'ios' && !Platform.isPad && Platform.isTesting !== true;

const DetectionScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState(false);
  const [cameraTimeout, setCameraTimeout] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [useRealModel, setUseRealModel] = useState(true);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [useFlaskAPI, setUseFlaskAPI] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  useEffect(() => {
    console.log('Available camera devices:', devices);
    console.log('Selected back camera:', device);

    checkServerHealth();
    loadYoloModel();
    requestCameraPermission();
    requestLocationPermission(); // 위치 권한 요청 추가

    const timeout = setTimeout(() => {
      if (!device) {
        setCameraTimeout(true);
        setSimulatorMode(true);
        setHasPermission(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let interval;
    if (isActive && (camera.current || simulatorMode)) {
      interval = setInterval(() => {
        analyzeFrame();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isActive, simulatorMode]);

  // 📍 위치 권한 요청 (iOS용)
  const requestLocationPermission = async () => {
    try {
      console.log('🌍 Requesting location permission...');

      if (Platform.OS === 'ios') {
        // iOS 권한 요청 (Info.plist에 정의된 메시지가 표시됨)
        Geolocation.requestAuthorization('whenInUse');

        // 약간의 지연 후 위치 가져오기 시도
        setTimeout(() => {
          setHasLocationPermission(true);
          getCurrentLocation();
        }, 500);
      } else if (Platform.OS === 'android') {
        // Android 권한 요청
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 필요',
            message: '화재 신고 시 위치 정보가 필요합니다.',
            buttonPositive: '확인',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasLocationPermission(true);
          getCurrentLocation();
        } else {
          Alert.alert('위치 권한 거부', '위치 정보 없이 진행됩니다.');
        }
      }
    } catch (error) {
      console.error('❌ Location permission error:', error);
      Alert.alert('오류', '위치 권한 요청 중 오류가 발생했습니다.');
    }
  };

  // 📍 현재 위치 가져오기
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location acquired:', latitude, longitude);
        setCurrentLocation({
          latitude,
          longitude,
          address: '위치 정보 수신됨', // 주소 변환은 선택사항
        });
      },
      error => {
        console.error('❌ Location error:', error);
        Alert.alert(
          '위치 정보 오류',
          '위치 정보를 가져올 수 없습니다. 기본 위치로 진행됩니다.',
          [{ text: '확인' }],
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const checkServerHealth = async () => {
    try {
      console.log('🏥 Checking Flask API server...');
      const result = await FireDetectionAPI.checkHealth();
      if (result.success) {
        console.log('✅ Flask API server is available');
        setServerAvailable(true);
        setUseFlaskAPI(true);
      } else {
        console.log('❌ Flask API server is not available');
        setServerAvailable(false);
        setUseFlaskAPI(false);
      }
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      setServerAvailable(false);
      setUseFlaskAPI(false);
    }
  };

  const loadYoloModel = async () => {
    try {
      console.log('Loading YOLO model...');
      const loaded = await YoloInferenceService.loadModel();
      setModelLoaded(loaded);
      if (loaded) {
        console.log('YOLO model loaded successfully');
      } else {
        console.log('Failed to load YOLO model, using simulation mode');
        setUseRealModel(false);
      }
    } catch (error) {
      console.error('Error loading YOLO model:', error);
      setUseRealModel(false);
      setModelLoaded(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      const permission = await Camera.requestCameraPermission();
      console.log('Camera permission result:', permission);
      setHasPermission(permission === 'granted');

      if (permission !== 'granted') {
        Alert.alert(
          '카메라 권한 필요',
          '설정 > FireDetectionApp > 카메라 권한을 활성화해주세요.',
          [{ text: '확인' }],
        );
      }
    } catch (error) {
      console.log('Camera error:', error);
      console.log('Camera not available, using simulator mode');
      setSimulatorMode(true);
      setHasPermission(true);
    }
  };

  const analyzeFrame = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    let detection;

    try {
      // 📍 분석 시작 전 최신 위치 업데이트
      if (hasLocationPermission && !currentLocation) {
        getCurrentLocation();
      }

      // 1순위: Flask API 사용 (카메라가 있을 때)
      if (useFlaskAPI && serverAvailable && camera.current && !simulatorMode) {
        try {
          const photo = await camera.current.takePhoto({
            qualityPrioritization: 'speed',
            flash: 'off',
            enableShutterSound: false,
          });

          console.log('📸 Photo captured:', photo.path);
          console.log('📍 Sending with location:', currentLocation);
          console.log('🚀 Calling Flask API...');

          // 📍 위치 정보와 함께 API 호출
          detection = await FireDetectionAPI.detectFire(
            photo.path,
            currentLocation, // 위치 정보 전달
            null, // 토큰 (필요시 AsyncStorage에서 가져오기)
          );

          console.log('✅ Flask API detection result:', detection);
        } catch (apiError) {
          console.error('❌ Flask API error, falling back:', apiError);
          detection = await YoloInferenceService.detectFire();
        }
      }
      // 2순위: 로컬 YOLO 모델 사용
      else if (camera.current && !simulatorMode && modelLoaded) {
        try {
          const photo = await camera.current.takePhoto({
            qualityPrioritization: 'speed',
            flash: 'off',
            enableShutterSound: false,
          });

          console.log('📸 Photo captured:', photo.path);
          console.log('🤖 Using local YOLO model...');

          detection = await YoloInferenceService.detectFire(photo.path);

          console.log('🔥 Local detection result:', detection);
        } catch (error) {
          console.error('❌ Local YOLO error:', error);
          detection = await FireDetectionAPI.simulateDetection();
        }
      }
      // 3순위: 시뮬레이션 모드
      else {
        console.log('🎲 Using simulation mode');
        detection = await FireDetectionAPI.simulateDetection();
      }

      // 박스 좌표를 화면 크기에 맞게 스케일링
      if (detection.detections && detection.imageSize) {
        const { width: imgWidth, height: imgHeight } = detection.imageSize;
        const scaleX = width / imgWidth;
        const scaleY = height / imgHeight;

        detection.detections = detection.detections.map(det => ({
          ...det,
          bbox: {
            x: det.bbox.x * scaleX,
            y: det.bbox.y * scaleY,
            width: det.bbox.width * scaleX,
            height: det.bbox.height * scaleY,
          },
        }));
      }

      setDetectionResult(detection);

      // 화재 감지 시 저장 (위치 정보 포함)
      if (detection.fireDetected) {
        const detectionWithLocation = {
          ...detection,
          location: currentLocation, // 위치 정보 추가
        };
        await saveDetection(detectionWithLocation);

        // 화재 감지 알림
        Alert.alert(
          '🔥 화재 감지!',
          `위치: ${currentLocation?.latitude?.toFixed(
            6,
          )}, ${currentLocation?.longitude?.toFixed(6)}\n신뢰도: ${(
            detection.confidence * 100
          ).toFixed(1)}%`,
          [{ text: '확인' }],
        );
      }
    } catch (error) {
      console.error('❌ Frame analysis error:', error);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const toggleDetection = () => {
    if (!isActive && !currentLocation) {
      // 감지 시작 시 위치 재확인
      getCurrentLocation();
    }

    setIsActive(!isActive);
    if (isActive) {
      setDetectionResult(null);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device && !cameraTimeout) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>카메라 로딩 중...</Text>
        <Text style={styles.simulatorHint}>
          시뮬레이터에서는 3초 후 데모 모드로 전환됩니다
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {device && !simulatorMode ? (
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          photo={true}
        />
      ) : (
        <View style={styles.simulatorBackground}>
          <Text style={styles.simulatorText}>🎥 시뮬레이터 모드</Text>
          <Text style={styles.simulatorSubText}>
            실제 기기에서는 카메라가 작동합니다
          </Text>
        </View>
      )}

      <DetectionOverlay
        detectionResult={detectionResult}
        isProcessing={isProcessing}
      />

      <View style={styles.controlsContainer}>
        {/* 위치 정보 표시 */}
        {currentLocation && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              📍 {currentLocation.latitude.toFixed(4)},{' '}
              {currentLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isActive ? '#00FF00' : '#FF0000' },
            ]}
          />
          <Text style={styles.statusText}>
            {isActive ? '감지 중' : '대기 중'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: isActive ? '#FF4500' : '#00AA00' },
          ]}
          onPress={toggleDetection}
        >
          <Text style={styles.toggleButtonText}>
            {isActive ? '감지 중지' : '감지 시작'}
          </Text>
        </TouchableOpacity>

        {detectionResult && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              상태: {getCategoryText(detectionResult.category)}
            </Text>
            {detectionResult.fireDetected && (
              <Text style={styles.infoText}>
                신뢰도: {(detectionResult.confidence * 100).toFixed(1)}%
              </Text>
            )}
            <Text style={[styles.infoText, { fontSize: 11, opacity: 0.7 }]}>
              {serverAvailable && useFlaskAPI
                ? '🌐 Flask API'
                : modelLoaded && useRealModel
                ? '🤖 로컬 AI'
                : '🎲 시뮬레이션'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getCategoryText = category => {
  const texts = {
    no_fire: '정상',
    wildfire: '산불 감지',
    urban_fire: '도심 화재 감지',
    uncertain: '화재 의심',
  };
  return texts[category] || '알 수 없음';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  simulatorHint: {
    color: '#FFD700',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  simulatorBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatorText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  simulatorSubText: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  locationContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 10,
  },
  locationText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: '80%',
    maxWidth: '90%',
    alignSelf: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 2,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
});

export default DetectionScreen;
