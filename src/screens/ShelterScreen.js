import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  Dimensions,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import ShelterAPI from '../services/ShelterAPI';

const { width, height } = Dimensions.get('window');

const ShelterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [shelters, setShelters] = useState([]);
  const [nearbyShelters, setNearbyShelters] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedShelter, setSelectedShelter] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // 위치 권한 요청
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 요청',
            message: '주변 대피소를 찾기 위해 위치 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '취소',
            buttonPositive: '확인',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('권한 필요', '위치 권한이 필요합니다.');
          return;
        }
      }

      getCurrentLocation();
    } catch (error) {
      console.error('❌ 권한 요청 오류:', error);
    }
  };

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('📍 현재 위치:', latitude, longitude);
        setUserLocation({ latitude, longitude });
        loadShelters(latitude, longitude);
      },
      error => {
        console.error('❌ 위치 가져오기 오류:', error);
        Alert.alert(
          '위치 오류',
          '현재 위치를 가져올 수 없습니다. 기본 위치로 검색합니다.',
        );
        // 기본 위치 (서울시청)
        const defaultLat = 37.5665;
        const defaultLon = 126.978;
        setUserLocation({ latitude: defaultLat, longitude: defaultLon });
        loadShelters(defaultLat, defaultLon);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  // 대피소 데이터 로드
  const loadShelters = async (latitude, longitude) => {
    setLoading(true);
    try {
      const result = await ShelterAPI.getShelters();

      if (result.success && result.data.length > 0) {
        setShelters(result.data);

        // 사용자 위치 기준 가까운 대피소 정렬 (반경 10km 이내)
        const nearby = ShelterAPI.filterByRadius(
          result.data,
          latitude,
          longitude,
          10,
        );

        setNearbyShelters(nearby.slice(0, 50)); // 상위 50개만 표시
        console.log(`✅ 주변 대피소 ${nearby.length}개 발견`);
      } else {
        Alert.alert('오류', '대피소 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 대피소 로드 오류:', error);
      Alert.alert('오류', '대피소 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카카오맵 HTML 생성
  const generateMapHTML = () => {
    console.log('📍 generateMapHTML called');
    console.log('📍 userLocation:', userLocation);
    console.log('📍 nearbyShelters count:', nearbyShelters.length);

    if (!userLocation) {
      console.warn('⚠️ User location not available for map');
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="padding:20px;text-align:center;font-family:sans-serif;">
  <h2>⚠️ 위치 정보 없음</h2>
  <p>위치 권한을 확인해주세요</p>
</body>
</html>`;
    }

    if (nearbyShelters.length === 0) {
      console.warn('⚠️ No shelters available for map');
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="padding:20px;text-align:center;font-family:sans-serif;">
  <h2>📍 주변 대피소 없음</h2>
  <p>반경 10km 이내에 대피소가 없습니다</p>
  <p style="color:#999;font-size:12px;">위치: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}</p>
</body>
</html>`;
    }

    const markersData = nearbyShelters.slice(0, 20).map((shelter, index) => {
      // API 명세서에 따른 정확한 필드명
      const lat = parseFloat(shelter['위도(EPSG4326)'] || shelter['위도'] || 0);
      const lon = parseFloat(shelter['경도(EPSG4326)'] || shelter['경도'] || 0);
      const name = shelter['시설명'] || '대피소';
      const address =
        shelter['도로명전체주소'] ||
        shelter['소재지전체주소'] ||
        shelter['도로명주소'] ||
        shelter['지번주소'] ||
        '';

      console.log(`📍 Shelter ${index + 1}: ${name} (${lat}, ${lon})`);

      return {
        lat,
        lon,
        name,
        address,
        distance: shelter.distanceText,
      };
    });

    console.log(`🗺️ Generating map with ${markersData.length} markers`);
    console.log(`📍 User location: ${userLocation.latitude}, ${userLocation.longitude}`);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; background-color: #f5f5f5; }
        #status {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            font-family: sans-serif;
            font-size: 12px;
        }
        .custom-marker {
            background-color: #E57373;
            border: 2px solid #fff;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
        }
        .user-marker {
            background-color: #4285F4;
            border: 3px solid #fff;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <div id="status">지도 로딩 중...</div>
    <div id="map"></div>
    <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=65f4831b3ba213db5449a19d1bcf1eb1&autoload=false"></script>
    <script>
        const userLat = ${userLocation?.latitude || 37.5665};
        const userLon = ${userLocation?.longitude || 126.978};
        const markers = ${JSON.stringify(markersData)};

        function updateStatus(msg) {
            const status = document.getElementById('status');
            if (status) status.innerHTML = msg;
            console.log(msg);
        }

        function initializeMap() {
            try {
                updateStatus('지도 초기화 중...');
                console.log('🗺️ Starting map initialization...');
                console.log('📍 User position:', userLat, userLon);
                console.log('📍 Markers count:', markers.length);

                if (typeof kakao === 'undefined' || typeof kakao.maps === 'undefined') {
                    throw new Error('Kakao Maps SDK가 로드되지 않았습니다');
                }

                console.log('✅ Kakao Maps SDK loaded');
                updateStatus('지도 생성 중...');

                const container = document.getElementById('map');
                const options = {
                    center: new kakao.maps.LatLng(userLat, userLon),
                    level: 5
                };
                const map = new kakao.maps.Map(container, options);
                console.log('✅ Map created successfully');
                updateStatus('마커 추가 중...');

        // 사용자 위치 마커
        const userPosition = new kakao.maps.LatLng(userLat, userLon);
        const userMarker = new kakao.maps.CustomOverlay({
            position: userPosition,
            content: '<div class="user-marker"></div>',
            yAnchor: 0.5
        });
        userMarker.setMap(map);

        // 대피소 마커들 (번호 동그라미 + 클릭 시 정보 표시)
        markers.forEach((markerData, index) => {
            if (markerData.lat && markerData.lon) {
                const position = new kakao.maps.LatLng(markerData.lat, markerData.lon);

                // 번호 동그라미
                const content = \`<div class="custom-marker" id="marker-\${index}">\${index + 1}</div>\`;
                const customOverlay = new kakao.maps.CustomOverlay({
                    position: position,
                    content: content,
                    yAnchor: 0.5
                });
                customOverlay.setMap(map);

                // 정보창 (처음엔 숨김)
                const infowindow = new kakao.maps.InfoWindow({
                    content: \`<div style="padding:10px;min-width:200px;">
                        <strong>\${markerData.name}</strong><br/>
                        \${markerData.address}<br/>
                        <span style="color:#E57373;">\${markerData.distance}</span>
                    </div>\`,
                    removable: true
                });

                // 클릭 이벤트 (번호 동그라미 클릭 시)
                setTimeout(() => {
                    const markerEl = document.getElementById('marker-' + index);
                    if (markerEl) {
                        markerEl.style.cursor = 'pointer';
                        markerEl.onclick = function() {
                            infowindow.open(map, customOverlay);
                        };
                    }
                }, 100);
            }
        });

                // 지도 범위 조정
                const bounds = new kakao.maps.LatLngBounds();
                bounds.extend(userPosition);
                markers.forEach(m => {
                    if (m.lat && m.lon) {
                        bounds.extend(new kakao.maps.LatLng(m.lat, m.lon));
                    }
                });
                map.setBounds(bounds);
                console.log('✅ Map bounds set successfully');

                // 성공 - 상태 메시지 3초 후 숨김
                updateStatus('✅ 지도 로드 완료 (' + markers.length + '개 대피소)');
                setTimeout(() => {
                    const status = document.getElementById('status');
                    if (status) status.style.display = 'none';
                }, 3000);
            } catch (error) {
                console.error('❌ Map initialization error:', error);
                updateStatus('❌ 오류: ' + error.message);
            }
        }

        // Kakao Maps SDK 로드 및 초기화
        if (typeof kakao !== 'undefined' && kakao.maps) {
            updateStatus('SDK 확인됨, 로드 시작...');
            kakao.maps.load(function() {
                initializeMap();
            });
        } else {
            updateStatus('❌ Kakao Maps SDK를 찾을 수 없습니다');
            setTimeout(() => {
                // SDK가 비동기로 로드되는 경우를 위해 재시도
                if (typeof kakao !== 'undefined' && kakao.maps) {
                    kakao.maps.load(initializeMap);
                } else {
                    updateStatus('❌ SDK 로드 실패 - 네트워크를 확인해주세요');
                }
            }, 1000);
        }
    </script>
</body>
</html>
    `;
  };

  // 길찾기 기능
  const handleNavigation = (item) => {
    const lat = parseFloat(
      item['위도(EPSG4326)'] || item['위도'] || 0
    );
    const lon = parseFloat(
      item['경도(EPSG4326)'] || item['경도'] || 0
    );
    const name = item['시설명'] || '대피소';

    if (lat === 0 || lon === 0) {
      Alert.alert('오류', '대피소의 위치 정보가 없습니다.');
      return;
    }

    Alert.alert(
      '길찾기',
      `${name}까지 길찾기를 시작하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '카카오맵',
          onPress: () => {
            const url = `kakaomap://route?ep=${lat},${lon}&by=CAR`;
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                // 카카오맵 앱이 없으면 웹으로
                Linking.openURL(
                  `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lon}`
                );
              }
            });
          },
        },
        {
          text: '네이버지도',
          onPress: () => {
            const url = `nmap://route/car?dlat=${lat}&dlng=${lon}&dname=${encodeURIComponent(name)}&appname=com.bool`;
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                // 네이버지도 앱이 없으면 웹으로
                Linking.openURL(
                  `https://map.naver.com/v5/directions/-/-/-/car?c=${lon},${lat},15,0,0,0,dh`
                );
              }
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 대피소 아이템 렌더링
  const renderShelterItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.shelterItem}
      onPress={() => handleNavigation(item)}
    >
      <View style={styles.shelterHeader}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>
        <View style={styles.shelterInfo}>
          <Text style={styles.shelterName}>{item['시설명'] || '대피소'}</Text>
          <Text style={styles.shelterDistance}>{item.distanceText}</Text>
        </View>
      </View>
      <Text style={styles.shelterAddress}>
        {item['도로명전체주소'] ||
          item['소재지전체주소'] ||
          item['도로명주소'] ||
          item['지번주소'] ||
          '주소 정보 없음'}
      </Text>
      <View style={styles.shelterDetails}>
        <Text style={styles.shelterDetailText}>
          면적: {item['시설면적(㎡)'] || item['면적'] || '-'}㎡
        </Text>
        <Text style={styles.shelterDetailText}>
          수용인원: {item['최대수용인원'] || item['수용인원'] || '-'}명
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E57373" />
        <Text style={styles.loadingText}>주변 대피소를 검색 중입니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주변 대피소</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            if (userLocation) {
              loadShelters(userLocation.latitude, userLocation.longitude);
            }
          }}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* 탭 전환 버튼 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            viewMode === 'list' && styles.tabButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.tabButtonText,
              viewMode === 'list' && styles.tabButtonTextActive,
            ]}
          >
            목록 ({nearbyShelters.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            viewMode === 'map' && styles.tabButtonActive,
          ]}
          onPress={() => setViewMode('map')}
        >
          <Text
            style={[
              styles.tabButtonText,
              viewMode === 'map' && styles.tabButtonTextActive,
            ]}
          >
            지도
          </Text>
        </TouchableOpacity>
      </View>

      {/* 디버그 정보 */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>📊 상태 정보</Text>
        <Text style={styles.debugText}>
          📍 위치: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : '❌ 없음'}
        </Text>
        <Text style={styles.debugText}>
          🏠 대피소: {nearbyShelters.length}개 로드됨
        </Text>
        <Text style={styles.debugText}>
          👁️ 현재 모드: {viewMode === 'list' ? '목록' : '지도'}
        </Text>
        <Text style={styles.debugText}>
          🗺️ 지도 엔진: {Platform.OS === 'ios' ? 'Apple Maps' : 'Kakao Maps'}
        </Text>
      </View>

      {/* 컨텐츠 */}
      {viewMode === 'list' ? (
        nearbyShelters.length > 0 ? (
          <FlatList
            data={nearbyShelters}
            renderItem={renderShelterItem}
            keyExtractor={(item, index) => `shelter-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>주변 대피소가 없습니다.</Text>
          </View>
        )
      ) : Platform.OS === 'ios' ? (
        // iOS: Apple Maps 사용
        userLocation && nearbyShelters.length > 0 ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {nearbyShelters.slice(0, 20).map((shelter, index) => {
              const lat = parseFloat(shelter['위도(EPSG4326)'] || shelter['위도'] || 0);
              const lon = parseFloat(shelter['경도(EPSG4326)'] || shelter['경도'] || 0);

              if (lat === 0 || lon === 0) return null;

              return (
                <Marker
                  key={`marker-${index}`}
                  coordinate={{ latitude: lat, longitude: lon }}
                  title={shelter['시설명'] || '대피소'}
                  description={`${shelter.distanceText} | ${shelter['도로명전체주소'] || shelter['소재지전체주소'] || ''}`}
                  pinColor="#E57373"
                  onCalloutPress={() => handleNavigation(shelter)}
                />
              );
            })}
          </MapView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>지도를 표시할 수 없습니다</Text>
          </View>
        )
      ) : (
        // Android: Kakao Maps WebView 사용
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={false}
          originWhitelist={['*']}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onMessage={(event) => {
            console.log('📨 WebView message:', event.nativeEvent.data);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
          }}
          onLoadStart={() => {
            console.log('🔄 WebView loading started');
          }}
          onLoadEnd={() => {
            console.log('✅ WebView loaded successfully');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ HTTP error:', nativeEvent);
          }}
          renderLoading={() => (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color="#E57373" />
              <Text style={{marginTop: 10, color: '#666'}}>지도 로딩 중...</Text>
            </View>
          )}
          injectedJavaScript={`
            (function() {
              const originalLog = console.log;
              console.log = function(...args) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'log', data: args}));
                originalLog.apply(console, args);
              };
              const originalError = console.error;
              console.error = function(...args) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', data: args}));
                originalError.apply(console, args);
              };
            })();
            true;
          `}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFB3BA',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
    width: 40,
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#E57373',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#E57373',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  shelterItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shelterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E57373',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shelterInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shelterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  shelterDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E57373',
  },
  shelterAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 44,
  },
  shelterDetails: {
    flexDirection: 'row',
    paddingLeft: 44,
    gap: 15,
  },
  shelterDetailText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFAFA',
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  debugPanel: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FFC107',
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ShelterScreen;
