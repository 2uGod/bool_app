import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAPI from '../services/UserAPI';
import FireDetectionAPI from '../services/FireDetectionAPI';
import BackendHealthAPI from '../services/BackendHealthAPI';
import DetectionOverlay from '../components/DetectionOverlay';

const MainCameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fireDetected, setFireDetected] = useState(false);
  const [riskLevel, setRiskLevel] = useState(0); // 위험도
  const [fireType, setFireType] = useState(''); // 화재 유형
  const [serverOnline, setServerOnline] = useState(true); // 서버 연결 상태
  const [currentLocation, setCurrentLocation] = useState(null); // 현재 위치
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [reportSent, setReportSent] = useState(false); // 신고 완료 플래그
  const [detectionResult, setDetectionResult] = useState(null); // 감지 결과 (바운딩 박스용)

  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  useEffect(() => {
    requestCameraPermission();
    requestLocationPermission();
    checkServerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 위치 정보 주기적으로 갱신
  useEffect(() => {
    if (hasLocationPermission && !currentLocation) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocationPermission, currentLocation]);

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
      // 3.5초마다 화재 감지 (실시간 감지와 서버 부하의 최적 균형)
      interval = setInterval(() => {
        detectAndReport();
      }, 3500);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('🌍 Reverse geocoding:', latitude, longitude);
      const KAKAO_API_KEY = 'e09f9f4073488d1ef17cef8618960d76';
      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;
      console.log('📡 Kakao API URL:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Kakao API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(
          '✅ Kakao API response data:',
          JSON.stringify(data, null, 2),
        );

        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];

          // 도로명 주소 우선
          if (doc.road_address) {
            const road = doc.road_address;
            // 도로명 주소 전체를 구성 (지번 번호까지 포함)
            let addressParts = [
              road.region_1depth_name,
              road.region_2depth_name,
              road.region_3depth_name,
              road.road_name,
            ].filter(Boolean);

            // 건물번호가 있으면 추가
            if (road.building_name) {
              addressParts.push(road.building_name);
            } else if (road.main_building_no) {
              addressParts.push(road.main_building_no);
            }

            const addressString = addressParts.join(' ').trim();
            console.log('✅ Road address:', addressString);
            return addressString;
          }
          // 지번 주소
          else if (doc.address) {
            const address = doc.address;
            const addressString =
              `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name}`.trim();
            console.log('✅ Jibun address:', addressString);
            return addressString;
          }
        } else {
          console.warn('⚠️ No documents in Kakao API response');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Kakao API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
    }

    // 역지오코딩 실패 시 좌표 반환
    const fallback = `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(
      4,
    )}`;
    console.log('⚠️ Using fallback address:', fallback);
    return fallback;
  };

  const getCurrentLocation = async () => {
    console.log('📍 Getting current location...');
    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Current location:', latitude, longitude);

        const address = await reverseGeocode(latitude, longitude);
        console.log('✅ Address:', address);

        const locationData = {
          latitude,
          longitude,
          address,
        };

        setCurrentLocation(locationData);
      },
      error => {
        console.error('❌ Get location error:', error.code, error.message);
        setCurrentLocation({
          latitude: 37.5665,
          longitude: 126.978,
          address: '위치 정보를 가져올 수 없습니다',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        forceRequestLocation: true,
      },
    );
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS: 이미 권한이 있는지 먼저 확인
        const authStatus = await Geolocation.requestAuthorization('whenInUse');
        const granted = authStatus === 'granted';
        setHasLocationPermission(granted);
        if (granted) {
          getCurrentLocation();
        }
        return granted;
      }

      if (Platform.OS === 'android') {
        // Android: 이미 권한이 있는지 먼저 확인
        const locationPermissionGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (locationPermissionGranted) {
          console.log('✅ Location permission already granted');
          setHasLocationPermission(true);
          getCurrentLocation();
          return true;
        }

        // 권한이 없으면 요청
        console.log('📍 Requesting location permission...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 필요',
            message:
              '화재 신고 시 정확한 위치 정보를 전송하기 위해 위치 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          },
        );
        const permissionGranted =
          granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasLocationPermission(permissionGranted);
        if (permissionGranted) {
          getCurrentLocation();
        }
        return permissionGranted;
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setHasLocationPermission(false);
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      // 이미 권한이 있는지 먼저 확인
      const currentPermission = await Camera.getCameraPermissionStatus();

      if (currentPermission === 'granted') {
        console.log('✅ Camera permission already granted');
        setHasPermission(true);
        return;
      }

      // 권한이 없으면 요청
      console.log('📸 Requesting camera permission...');
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
    if (isProcessing || !camera.current || reportSent) return;

    setIsProcessing(true);

    try {
      // 사진 촬영 (해상도 최적화)
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed', // 속도 우선
        flash: 'off',
        enableShutterSound: false,
        skipMetadata: true, // 메타데이터 제거로 파일 크기 감소
      });

      console.log('📸 Photo captured:', photo.path);

      // 토큰 가져오기
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다');
        navigation.replace('Login');
        return;
      }

      // 위치 정보 (실제 GPS 사용)
      const locationData = currentLocation || {
        latitude: 37.5665,
        longitude: 126.978,
        address: '위치 정보 없음',
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

        // 화재 유형 매핑
        const typeMap = {
          wildfire: '🌲 산불',
          urban_fire: '🏙️ 도심 화재',
          industrial_fire: '🏭 공장 화재',
          smoke: '💨 연기',
        };

        // 연기 또는 화재 감지 여부 (화면 표시용)
        const hasFireOrSmoke = data.has_fire || data.has_smoke;
        setFireDetected(hasFireOrSmoke);

        // 위험도
        setRiskLevel(Math.round(data.confidence || 0));

        // 감지된 유형 (화재 또는 연기)
        setFireType(typeMap[data.status] || data.status);

        // 바운딩 박스 데이터 저장
        if (hasFireOrSmoke && data.boxes && data.boxes.length > 0) {
          const detections = data.boxes.map(box => ({
            bbox: {
              x: box.x1 || 0,
              y: box.y1 || 0,
              width: (box.x2 - box.x1) || 0,
              height: (box.y2 - box.y1) || 0,
            },
            confidence: box.confidence || 0,
            class: box.class || 'fire',
          }));

          setDetectionResult({
            fireDetected: hasFireOrSmoke,
            detections: detections,
            category: data.status,
          });
        } else {
          // 화재/연기가 없으면 detection 결과 초기화
          setDetectionResult(null);
        }

        // 화재 감지 시에만 신고 및 촬영 중지
        if (data.has_fire && data.confidence >= 70) {
          // 신고 완료 플래그 설정 (중복 신고 방지)
          setReportSent(true);

          // 촬영 즉시 중지
          setIsActive(false);

          Alert.alert(
            '🔥 화재 신고 완료!',
            `${typeMap[data.status]}\n위험도: ${Math.round(
              data.confidence,
            )}%\n\n소방서에 신고가 접수되어 촬영이 중지되었습니다.`,
            [
              {
                text: '신고 내역 보기',
                onPress: () => navigation.navigate('Reports'),
              },
              { text: '확인' },
            ],
          );
        }
        // 연기만 감지된 경우 (신고하지 않고 표시만)
        else if (data.has_smoke) {
          console.log('💨 연기 감지됨 (신고하지 않음)');
          // 연기는 화면에만 표시되고 신고되지 않음
        }
      } else {
        console.error('❌ Detection failed:', result.error);
        setServerOnline(false); // 서버 오프라인으로 설정

        // 네트워크 연결 오류인지 확인
        const isNetworkError =
          result.error &&
          (result.error.includes('서버에 연결할 수 없습니다') ||
            result.error.includes('Network request failed') ||
            result.error.includes('Failed to fetch'));

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
              { text: '확인' },
            ],
          );
        } else {
          // 기타 오류
          Alert.alert(
            '화재 감지 실패',
            result.error || '알 수 없는 오류가 발생했습니다',
          );
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
      // 감지 시작 시 상태 초기화
      setFireDetected(false);
      setRiskLevel(0);
      setFireType('');
      setReportSent(false); // 신고 플래그 초기화
      setDetectionResult(null); // 바운딩 박스 초기화
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestCameraPermission}
        >
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

      {/* 바운딩 박스 오버레이 */}
      <DetectionOverlay
        detectionResult={detectionResult}
        isProcessing={isProcessing}
      />

      {/* 위치 표시 (상단) */}
      <View style={styles.topOverlay}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>
            📍{' '}
            {currentLocation && currentLocation.address
              ? currentLocation.address
              : '위치 정보 가져오는 중...'}
          </Text>
          {!hasLocationPermission && (
            <TouchableOpacity
              style={styles.locationPermissionButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.locationPermissionText}>
                위치 권한 허용하기
              </Text>
            </TouchableOpacity>
          )}
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
          <View
            style={[
              styles.alertBox,
              riskLevel >= 80 ? styles.alertBoxHigh : styles.alertBoxMedium,
            ]}
          >
            <Text style={styles.alertEmoji}>
              {fireType === '💨 연기' ? '💨' : '🔥'}
            </Text>
            <Text style={styles.alertText}>
              {fireType === '💨 연기' ? '연기 감지됨!' : '화재 감지됨!'}
            </Text>

            {/* 위험도 */}
            <View style={styles.riskInfoContainer}>
              <Text style={styles.riskLabel}>
                {fireType === '💨 연기' ? '연기 감지 확률' : '예상 화재 위험도'}
              </Text>
              <Text style={styles.riskValue}>{riskLevel}%</Text>
              {fireType && (
                <Text style={styles.fireTypeInAlert}>{fireType}</Text>
              )}
            </View>

            {/* 연기일 때와 화재일 때 메시지 구분 */}
            {fireType !== '💨 연기' && (
              <Text style={styles.alertSubtext}>
                소방서에 자동 신고되었습니다
              </Text>
            )}
            {fireType === '💨 연기' && (
              <Text style={styles.alertSubtext}>
                연기가 감지되었습니다 (신고되지 않음)
              </Text>
            )}

            <TouchableOpacity
              style={styles.alertCloseButton}
              onPress={() => setFireDetected(false)}
            >
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
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonEmoji}>{isActive ? '⏸️' : '🔥'}</Text>
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
    textAlign: 'center',
  },
  locationPermissionButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  locationPermissionText: {
    color: '#fff',
    fontSize: 12,
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
