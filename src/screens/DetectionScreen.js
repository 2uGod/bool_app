import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {Camera, useCameraDevices, useFrameProcessor} from 'react-native-vision-camera';
import DetectionOverlay from '../components/DetectionOverlay';
import {saveDetection} from '../services/StorageService';
import YoloInferenceService from '../services/YoloInferenceService';
import FireDetectionAPI from '../services/FireDetectionAPI';

const {width, height} = Dimensions.get('window');

// 시뮬레이터 감지
const isSimulator = Platform.OS === 'ios' && !Platform.isPad && Platform.isTesting !== true;

const DetectionScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState(false);
  const [cameraTimeout, setCameraTimeout] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [useRealModel, setUseRealModel] = useState(true);
  const [serverAvailable, setServerAvailable] = useState(false);
  const [useFlaskAPI, setUseFlaskAPI] = useState(true); // Flask API 사용 여부

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  useEffect(() => {
    console.log('Available camera devices:', devices);
    console.log('Selected back camera:', device);

    // Check Flask API server
    checkServerHealth();

    // Load YOLO model (fallback)
    loadYoloModel();

    requestCameraPermission();

    // 3초 후에도 카메라가 없으면 시뮬레이터 모드 활성화
    const timeout = setTimeout(() => {
      if (!device) {
        setCameraTimeout(true);
        setSimulatorMode(true);
        setHasPermission(true); // 시뮬레이터에서는 권한 통과
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let interval;
    if (isActive && (camera.current || simulatorMode)) {
      // 프레임 분석 시뮬레이션 (실제로는 TFLite 모델 연동)
      interval = setInterval(() => {
        analyzeFrame();
      }, 2000); // 2초마다 분석
    }
    return () => clearInterval(interval);
  }, [isActive, simulatorMode]);

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
          [{text: '확인'}]
        );
      }
    } catch (error) {
      // 시뮬레이터에서 에러 발생 시 시뮬레이터 모드 활성화
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
      // 1순위: Flask API 사용 (카메라가 있을 때)
      if (useFlaskAPI && serverAvailable && camera.current && !simulatorMode) {
        try {
          // 카메라에서 프레임 캡처
          const photo = await camera.current.takePhoto({
            qualityPrioritization: 'speed',
            flash: 'off',
            enableShutterSound: false,
          });

          console.log('📸 Photo captured:', photo.path);
          console.log('🚀 Calling Flask API...');

          // Flask API 호출
          detection = await FireDetectionAPI.detectFire(photo.path, false);

          console.log('✅ Flask API detection result:', detection);
        } catch (apiError) {
          console.error('❌ Flask API error, falling back:', apiError);
          // Flask API 실패 시 로컬 모델로 폴백
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
        const {width: imgWidth, height: imgHeight} = detection.imageSize;
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

      // 화재 감지 시 저장
      if (detection.fireDetected) {
        await saveDetection(detection);
      }
    } catch (error) {
      console.error('❌ Frame analysis error:', error);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const simulateDetection = () => {
    // 실제로는 YOLOv8 + SegFormer 모델 결과
    const hasFireSmoke = Math.random() > 0.85; // 15% 확률로 화재/연기 감지

    if (!hasFireSmoke) {
      return {
        fireDetected: false,
        category: 'no_fire',
        confidence: 0.0,
        timestamp: new Date().toISOString(),
      };
    }

    const categories = ['wildfire', 'urban_fire', 'uncertain'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      fireDetected: true,
      category: category,
      confidence: 0.7 + Math.random() * 0.25, // 0.7-0.95
      detections: [
        {
          class: Math.random() > 0.5 ? 'fire' : 'smoke',
          confidence: 0.8 + Math.random() * 0.15,
          bbox: {
            x: Math.random() * 0.5 * width,
            y: Math.random() * 0.5 * height,
            width: 100 + Math.random() * 100,
            height: 100 + Math.random() * 100,
          },
        },
      ],
      sceneInfo: {
        vegetationRatio: category === 'wildfire' ? 0.7 : 0.2,
        urbanRatio: category === 'urban_fire' ? 0.8 : 0.1,
      },
      timestamp: new Date().toISOString(),
    };
  };

  const toggleDetection = () => {
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
          onPress={requestCameraPermission}>
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
      {/* 실제 카메라 또는 시뮬레이터 배경 */}
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
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              {backgroundColor: isActive ? '#00FF00' : '#FF0000'},
            ]}
          />
          <Text style={styles.statusText}>
            {isActive ? '감지 중' : '대기 중'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {backgroundColor: isActive ? '#FF4500' : '#00AA00'},
          ]}
          onPress={toggleDetection}>
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
            <Text style={[styles.infoText, {fontSize: 11, opacity: 0.7}]}>
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
    shadowOffset: {width: 0, height: 2},
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
