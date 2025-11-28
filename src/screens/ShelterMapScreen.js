import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import ShelterAPI from '../services/ShelterAPI';

const KAKAO_API_KEY = 'e09f9f4073488d1ef17cef8618960d76';

const ShelterMapScreen = ({ visible, onClose }) => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      loadShelters();
    }
  }, [visible]);

  const loadShelters = async () => {
    try {
      setLoading(true);

      // 현재 위치 가져오기
      Geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;

          setCurrentLocation({ latitude, longitude });

          // 대피소 데이터 조회
          const result = await ShelterAPI.getShelters(latitude, longitude);

          if (result.success && result.shelters) {
            setShelters(result.shelters);
          } else {
            // API 실패 시 데모 데이터 사용
            setShelters(getDemoShelters(latitude, longitude));
          }

          setLoading(false);
        },
        error => {
          console.error('위치 조회 실패:', error);
          // 기본 위치로 대피소 조회
          loadDefaultShelters();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    } catch (error) {
      console.error('대피소 조회 실패:', error);
      loadDefaultShelters();
    }
  };

  const loadDefaultShelters = async () => {
    try {
      const result = await ShelterAPI.getShelters(37.5665, 126.978);

      if (result.success && result.shelters) {
        setShelters(result.shelters);
      } else {
        setShelters(getDemoShelters(37.5665, 126.978));
      }

      setCurrentLocation({ latitude: 37.5665, longitude: 126.978 });
      setLoading(false);
    } catch (error) {
      console.error('기본 대피소 조회 실패:', error);
      setShelters(getDemoShelters(37.5665, 126.978));
      setCurrentLocation({ latitude: 37.5665, longitude: 126.978 });
      setLoading(false);
    }
  };

  const getDemoShelters = (lat, lng) => {
    return [
      {
        id: 1,
        name: '명지대학교 체육관',
        address: '경기도 용인시 처인구 명지로 116',
        latitude: lat + 0.01,
        longitude: lng + 0.01,
        capacity: 500,
        type: '실내체육관',
        distance: 1.2,
      },
      {
        id: 2,
        name: '용인시청 대강당',
        address: '경기도 용인시 처인구 중부대로 1199',
        latitude: lat - 0.015,
        longitude: lng + 0.02,
        capacity: 300,
        type: '공공시설',
        distance: 2.5,
      },
      {
        id: 3,
        name: '남사면사무소 대피소',
        address: '경기도 용인시 처인구 남사읍',
        latitude: lat + 0.02,
        longitude: lng - 0.01,
        capacity: 200,
        type: '임시대피소',
        distance: 1.8,
      },
    ];
  };

  const handleMarkerPress = shelter => {
    setSelectedShelter(shelter);
  };

  const handleCloseDetail = () => {
    setSelectedShelter(null);
  };

  const getMarkerColor = type => {
    switch (type) {
      case '실내체육관':
        return '#4CAF50';
      case '공공시설':
        return '#2196F3';
      case '임시대피소':
        return '#FF9800';
      default:
        return '#F44336';
    }
  };

  // 카카오맵 HTML 생성
  const generateMapHTML = () => {
    const center = currentLocation || { latitude: 37.5665, longitude: 126.978 };
    const sheltersJSON = JSON.stringify(shelters);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>대피소 지도</title>
    <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}"></script>
    <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background-color: #e8f5e9; }
        #map { width: 100%; height: 100%; }
        #debug { position: absolute; top: 10px; left: 10px; background: white; padding: 10px; z-index: 1000; font-size: 12px; }
    </style>
</head>
<body>
    <div id="debug">Loading...</div>
    <div id="map"></div>
    <script>
        var debugEl = document.getElementById('debug');
        debugEl.innerText = 'Script started';

        // 카카오 SDK 로드를 기다립니다
        function initMap() {
            try {
                debugEl.innerText = 'Initializing map...';

                if (typeof kakao === 'undefined') {
                    debugEl.innerText = 'Kakao SDK not loaded';
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Kakao SDK not loaded' }));
                    return;
                }

                debugEl.innerText = 'Kakao SDK loaded';

                // 지도 생성
                var mapContainer = document.getElementById('map');
                var mapOption = {
                    center: new kakao.maps.LatLng(${center.latitude}, ${center.longitude}),
                    level: 5
                };
                var map = new kakao.maps.Map(mapContainer, mapOption);

                // 현재 위치 마커
                var currentPosition = new kakao.maps.LatLng(${center.latitude}, ${center.longitude});
                var currentMarker = new kakao.maps.Marker({
                    position: currentPosition,
                    map: map
                });

                // 대피소 데이터
                var shelters = ${sheltersJSON};

                // 마커 이미지 설정
                var markerColors = {
                    '실내체육관': '#4CAF50',
                    '공공시설': '#2196F3',
                    '임시대피소': '#FF9800'
                };

                // 대피소 마커 추가
                shelters.forEach(function(shelter, index) {
                    var markerPosition = new kakao.maps.LatLng(shelter.latitude, shelter.longitude);

                    // 커스텀 오버레이로 마커 생성 (이모지 사용)
                    var content = '<div id="marker-' + index + '" style="' +
                        'width: 40px; height: 40px; ' +
                        'background-color: ' + (markerColors[shelter.type] || '#F44336') + '; ' +
                        'border: 3px solid white; ' +
                        'border-radius: 50%; ' +
                        'display: flex; ' +
                        'align-items: center; ' +
                        'justify-content: center; ' +
                        'font-size: 20px; ' +
                        'box-shadow: 0 2px 6px rgba(0,0,0,0.3); ' +
                        'cursor: pointer;' +
                        '">🏠</div>';

                    var customOverlay = new kakao.maps.CustomOverlay({
                        position: markerPosition,
                        content: content,
                        yAnchor: 0.5
                    });

                    customOverlay.setMap(map);

                    // 마커 클릭 이벤트를 DOM 요소에 직접 추가
                    setTimeout(function() {
                        var markerElement = document.getElementById('marker-' + index);
                        if (markerElement) {
                            markerElement.onclick = function() {
                                var message = JSON.stringify({
                                    type: 'markerClick',
                                    shelter: shelter
                                });
                                window.ReactNativeWebView.postMessage(message);
                            };
                        }
                    }, 100);
                });

                // 지도 클릭 시 상세 정보 닫기
                kakao.maps.event.addListener(map, 'click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapClick' }));
                });

                debugEl.innerText = 'Map loaded successfully';
                // 3초 후 디버그 정보 숨기기
                setTimeout(function() {
                    debugEl.style.display = 'none';
                }, 3000);

            } catch (error) {
                debugEl.innerText = 'Error: ' + error.message;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: error.message,
                    stack: error.stack
                }));
            }
        }

        // 카카오 SDK 로드 완료 후 initMap 호출
        if (window.kakao && window.kakao.maps) {
            debugEl.innerText = 'Kakao SDK already loaded';
            kakao.maps.load(function() {
                initMap();
            });
        } else {
            debugEl.innerText = 'Waiting for Kakao SDK...';
            // SDK 로드를 체크하는 interval
            var checkInterval = setInterval(function() {
                if (window.kakao && window.kakao.maps) {
                    clearInterval(checkInterval);
                    debugEl.innerText = 'Kakao SDK detected';
                    kakao.maps.load(function() {
                        initMap();
                    });
                }
            }, 100);

            // 10초 후에도 로드 안되면 에러
            setTimeout(function() {
                if (typeof kakao === 'undefined') {
                    clearInterval(checkInterval);
                    debugEl.innerText = 'Timeout: Kakao SDK failed to load';
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'error',
                        message: 'Kakao SDK timeout'
                    }));
                }
            }, 10000);
        }
    </script>
</body>
</html>
    `;
  };

  // WebView에서 메시지 수신
  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        setSelectedShelter(data.shelter);
      } else if (data.type === 'mapClick') {
        setSelectedShelter(null);
      } else if (data.type === 'error') {
        console.error('WebView error:', data.message);
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏠 대피소 및 피난처</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>확인</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>대피소 정보를 불러오는 중...</Text>
          </View>
        ) : (
          <>
            {/* 카카오맵 WebView */}
            <WebView
              ref={webViewRef}
              source={{
                html: generateMapHTML(),
                baseUrl: 'https://dapi.kakao.com'
              }}
              originWhitelist={['*']}
              style={styles.map}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              mixedContentMode="always"
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
              }}
              onLoadEnd={() => {
                console.log('WebView loaded');
              }}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B6B" />
                </View>
              )}
            />

            {/* 대피소 목록 */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>
                📍 주변 대피소 ({shelters.length}개)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.shelterList}
              >
                {shelters.map(shelter => (
                  <TouchableOpacity
                    key={shelter.id}
                    style={[
                      styles.shelterCard,
                      selectedShelter?.id === shelter.id &&
                        styles.shelterCardSelected,
                    ]}
                    onPress={() => handleMarkerPress(shelter)}
                  >
                    <View style={styles.shelterHeader}>
                      <Text style={styles.shelterName} numberOfLines={1}>
                        {shelter.name}
                      </Text>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: getMarkerColor(shelter.type) },
                        ]}
                      >
                        <Text style={styles.typeBadgeText}>{shelter.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.shelterAddress} numberOfLines={2}>
                      {shelter.address}
                    </Text>
                    <View style={styles.shelterInfo}>
                      <Text style={styles.shelterDistance}>
                        📍 {shelter.distance}km
                      </Text>
                      <Text style={styles.shelterCapacity}>
                        👥 {shelter.capacity}명
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 선택된 대피소 상세 정보 */}
            {selectedShelter && (
              <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                  <TouchableOpacity
                    style={styles.detailCloseButton}
                    onPress={handleCloseDetail}
                  >
                    <Text style={styles.detailCloseText}>✕</Text>
                  </TouchableOpacity>

                  <Text style={styles.detailTitle}>{selectedShelter.name}</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 주소</Text>
                    <Text style={styles.detailValue}>
                      {selectedShelter.address}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🏷️ 유형</Text>
                    <Text style={styles.detailValue}>
                      {selectedShelter.type}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👥 수용인원</Text>
                    <Text style={styles.detailValue}>
                      {selectedShelter.capacity}명
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📏 거리</Text>
                    <Text style={styles.detailValue}>
                      약 {selectedShelter.distance}km
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: '#FFB3BA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  shelterList: {
    paddingHorizontal: 15,
  },
  shelterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    width: 200,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  shelterCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  shelterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shelterName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  shelterAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  shelterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shelterDistance: {
    fontSize: 12,
    color: '#999',
  },
  shelterCapacity: {
    fontSize: 12,
    color: '#999',
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  detailCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    paddingRight: 30,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
});

export default ShelterMapScreen;
