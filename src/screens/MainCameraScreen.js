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

const MainCameraScreen = ({navigation}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fireDetected, setFireDetected] = useState(false);
  const [riskLevel, setRiskLevel] = useState(0); // 위험도
  const [fireType, setFireType] = useState(''); // 화재 유형
  const [lastEarnedPoints, setLastEarnedPoints] = useState(null); // 획득 점수

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  useEffect(() => {
    requestCameraPermission();
  }, []);

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

      // 화재 감지 + 자동 신고
      console.log('🔥 Detecting and reporting...');
      const result = await UserAPI.detectAndReport(
        token,
        `file://${photo.path}`,
        locationData,
      );

      if (result.success) {
        const data = result.result;

        console.log('✅ Detection result:', data);

        // 화재 감지 여부
        const detected = data.has_fire || data.has_smoke;
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

        // 획득 점수
        if (data.points_earned) {
          setLastEarnedPoints(data.points_earned);
          // 3초 후에 점수 알림 숨기기
          setTimeout(() => setLastEarnedPoints(null), 3000);
        }

        // 화재 감지 시 알림
        if (detected && data.confidence >= 70) {
          Alert.alert(
            '🔥 화재 감지!',
            `${typeMap[data.status]}\n위험도: ${Math.round(data.confidence)}%\n획득 점수: +${data.points_earned}점`,
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
        Alert.alert('서버 연결 실패', `에러: ${result.error}\n\n시뮬레이션 모드로 전환합니다.`);
        // 에러 시 시뮬레이션 사용
        const simResult = await FireDetectionAPI.simulateDetection();
        setFireDetected(simResult.fireDetected);
        setRiskLevel(Math.round((simResult.confidence || 0) * 100));
        setFireType(simResult.category);
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
      setLastEarnedPoints(null);
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

      {/* 위험도 표시 (상단) */}
      <View style={styles.topOverlay}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>📍 경기 용인시 처인구 명지로 116</Text>
        </View>

        {riskLevel > 0 && (
          <View
            style={[
              styles.riskContainer,
              riskLevel >= 80 ? styles.riskHigh : styles.riskMedium,
            ]}>
            <Text style={styles.riskLabel}>예상 화재 위험도</Text>
            <Text style={styles.riskValue}>{riskLevel}%</Text>
            {fireType && <Text style={styles.fireType}>{fireType}</Text>}
          </View>
        )}

        {/* 획득 점수 알림 */}
        {lastEarnedPoints && (
          <View style={styles.pointsNotification}>
            <Text style={styles.pointsText}>⭐ +{lastEarnedPoints}점 획득!</Text>
          </View>
        )}
      </View>

      {/* 화재 감지 상태 */}
      {fireDetected && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertEmoji}>🔥</Text>
            <Text style={styles.alertText}>화재 감지됨!</Text>
            <Text style={styles.alertSubtext}>소방서에 자동 신고되었습니다</Text>
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
  riskContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 200,
  },
  riskHigh: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  riskMedium: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
  },
  riskLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  riskValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  fireType: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
    fontWeight: '600',
  },
  pointsNotification: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 15,
  },
  pointsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  alertEmoji: {
    fontSize: 64,
    marginBottom: 15,
  },
  alertText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
  },
  alertSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
});

export default MainCameraScreen;
