import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAPI from '../services/UserAPI';
import FireDetectionAPI from '../services/FireDetectionAPI';
import BackendHealthAPI from '../services/BackendHealthAPI';

const MainCameraScreen = ({navigation}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fireDetected, setFireDetected] = useState(false);
  const [riskLevel, setRiskLevel] = useState(0); // 위험도
  const [fireType, setFireType] = useState(''); // 화재 유형
  const [serverOnline, setServerOnline] = useState(true); // 서버 연결 상태

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  useEffect(() => {
    requestCameraPermission();
    checkServerStatus();
  }, []);

  // 서버 상태 확인
  const checkServerStatus = async () => {
    const result = await BackendHealthAPI.checkHealth();
    setServerOnline(result.success);
    
    if (!result.success) {
      console.warn('⚠️ 백엔드 서버 연결 실패:', result.error);
    }
  };

  useEffect(() => {
    let interval;
    if (isActive && camera.current) {
      // 2초마다 화재 감지
      interval = setInterval(() => {
        detectAndReport();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const requestCameraPermission = async () => {
    try {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');

      if (permission !== 'granted') {
        Alert.alert(
          '카메라 권한 필요',
          '설정에서 카메라 권한을 활성화해주세요.',
        );
      }
    } catch (error) {
      console.error('Camera permission error:', error);
    }
  };

  const detectAndReport = async () => {
    if (isProcessing || !camera.current) return;

    setIsProcessing(true);

    try {
      // 사진 촬영
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        enableShutterSound: false,
      });

      console.log('📸 Photo captured:', photo.path);

      // 토큰 가져오기
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다');
        navigation.replace('Login');
        return;
      }

      // 위치 정보 (TODO: 실제 GPS 사용)
      const locationData = {
        latitude: 37.5,
        longitude: 127.0,
        address: '경기 용인시 처인구 명지로 116',
      };

      // 서버 상태 재확인 (연결 실패 시)
      if (!serverOnline) {
        await checkServerStatus();
      }

      // 화재 감지 + 자동 신고
      console.log('🔥 Detecting and reporting...');
      const result = await UserAPI.detectAndReport(
        token,
        `file://${photo.path}`,
        locationData,
      );

      if (result.success) {
        setServerOnline(true); // 성공 시 서버 온라인으로 설정
        const data = result.result;

        console.log('✅ Detection result:', data);

        // 화재 감지 여부 (연기는 제외, 화재만 신고)
        const detected = data.has_fire;
        setFireDetected(detected);

        // 위험도
        setRiskLevel(Math.round(data.confidence || 0));

        // 화재 유형
        const typeMap = {
          wildfire: '🌲 산불',
          urban_fire: '🏙️ 도심 화재',
          industrial_fire: '🏭 공장 화재',
        };
        setFireType(typeMap[data.status] || data.status);

        // 화재 감지 시 알림 및 촬영 중지 (연기는 신고하지 않음)
        if (data.has_fire && data.confidence >= 70) {
          // 촬영 자동 중지
          setIsActive(false);

          Alert.alert(
            '🔥 화재 감지!',
            `${typeMap[data.status]}\n위험도: ${Math.round(data.confidence)}%\n\n화재가 신고되어 촬영이 중지되었습니다.`,
            [
              {
                text: '신고 내역 보기',
                onPress: () => navigation.navigate('Reports'),
              },
              {text: '확인'},
            ],
          );
        }
      } else {
        console.error('❌ Detection failed:', result.error);
        setServerOnline(false); // 서버 오프라인으로 설정
        
        // 네트워크 연결 오류인지 확인
        const isNetworkError = result.error && (
          result.error.includes('서버에 연결할 수 없습니다') ||
          result.error.includes('Network request failed') ||
          result.error.includes('Failed to fetch')
        );

        if (isNetworkError) {
          Alert.alert(
            '서버 연결 실패',
            `${result.error}\n\n확인 사항:\n1. 백엔드 서버가 실행 중인지 확인\n2. 같은 WiFi 네트워크에 연결되어 있는지 확인\n3. IP 주소가 올바른지 확인`,
            [
              {
                text: '서버 상태 확인',
                onPress: checkServerStatus,
              },
              {
                text: '시뮬레이션 모드',
                onPress: async () => {
                  const simResult = await FireDetectionAPI.simulateDetection();
                  setFireDetected(simResult.fireDetected);
                  setRiskLevel(Math.round((simResult.confidence || 0) * 100));
                  setFireType(simResult.category);
                },
              },
              {text: '확인'},
            ],
          );
        } else {
          // 기타 오류
          Alert.alert('화재 감지 실패', result.error || '알 수 없는 오류가 발생했습니다');
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('오류', '화재 감지 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDetection = () => {
    setIsActive(!isActive);
    if (!isActive) {
      setFireDetected(false);
      setRiskLevel(0);
      setFireType('');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라를 사용할 수 없습니다</Text>
        <Text style={styles.subtitleText}>실제 기기에서 실행해주세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && hasPermission}
        photo={true}
      />

      {/* 위치 표시 (상단) */}
      <View style={styles.topOverlay}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>📍 경기 용인시 처인구 명지로 116</Text>
        </View>

        {/* 서버 연결 상태 표시 */}
        {!serverOnline && (
          <View style={styles.serverStatusBadge}>
            <Text style={styles.serverStatusText}>⚠️ 서버 연결 안 됨</Text>
          </View>
        )}
      </View>

      {/* 화재 감지 상태 (위험도 + 신고 정보 통합) */}
      {fireDetected && (
        <View style={styles.alertOverlay}>
          <View style={[
            styles.alertBox,
            riskLevel >= 80 ? styles.alertBoxHigh : styles.alertBoxMedium
          ]}>
            <Text style={styles.alertEmoji}>🔥</Text>
            <Text style={styles.alertText}>화재 감지됨!</Text>

            {/* 위험도 */}
            <View style={styles.riskInfoContainer}>
              <Text style={styles.riskLabel}>예상 화재 위험도</Text>
              <Text style={styles.riskValue}>{riskLevel}%</Text>
              {fireType && <Text style={styles.fireTypeInAlert}>{fireType}</Text>}
            </View>

            <Text style={styles.alertSubtext}>소방서에 자동 신고되었습니다</Text>

            <TouchableOpacity
              style={styles.alertCloseButton}
              onPress={() => setFireDetected(false)}>
              <Text style={styles.alertCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 감지 버튼 (하단) */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          style={[
            styles.detectionButton,
            isActive && styles.detectionButtonActive,
            isProcessing && styles.detectionButtonProcessing,
          ]}
          onPress={toggleDetection}
          disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonEmoji}>
                {isActive ? '⏸️' : '🔥'}
              </Text>
              <Text style={styles.buttonLabel}>
                {isActive ? '감지 중지' : '감지 시작'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {isActive && (
          <Text style={styles.statusText}>
            {isProcessing ? '분석 중...' : '카메라 활성화됨'}
          </Text>
        )}
      </View>
    </View>
  );
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
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitleText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  locationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  alertBox: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  alertBoxHigh: {
    borderWidth: 4,
    borderColor: '#F44336',
  },
  alertBoxMedium: {
    borderWidth: 4,
    borderColor: '#FF9800',
  },
  alertEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  alertText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 20,
  },
  riskInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    width: '100%',
  },
  riskLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  riskValue: {
    color: '#F44336',
    fontSize: 48,
    fontWeight: 'bold',
  },
  fireTypeInAlert: {
    color: '#333',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '600',
  },
  alertSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  alertCloseButton: {
    marginTop: 15,
    backgroundColor: '#FF4500',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  alertCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  detectionButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 69, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#fff',
  },
  detectionButtonActive: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  detectionButtonProcessing: {
    opacity: 0.7,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  serverStatusBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
  },
  serverStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MainCameraScreen;
