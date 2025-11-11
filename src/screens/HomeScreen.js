import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userName, setUserName] = useState('사용자');

  useEffect(() => {
    requestLocationPermission();
    loadUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasLocationPermission && !currentLocation) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocationPermission]);

  const loadUserInfo = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserName(user.name || '사용자');
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('🌍 Reverse geocoding:', latitude, longitude);
      const KAKAO_API_KEY = 'e09f9f4073488d1ef17cef8618960d76';
      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];

          // 도로명 주소 우선
          if (doc.road_address) {
            const road = doc.road_address;
            let addressParts = [
              road.region_2depth_name,
              road.region_3depth_name,
              road.road_name,
            ].filter(Boolean);

            if (road.building_name) {
              addressParts.push(road.building_name);
            }

            return addressParts.join(' ').trim();
          }
          // 지번 주소
          else if (doc.address) {
            const address = doc.address;
            return `${address.region_2depth_name} ${address.region_3depth_name}`.trim();
          }
        }
      }
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
    }

    return '위치 정보를 가져올 수 없습니다';
  };

  const getWeatherData = async (latitude, longitude) => {
    try {
      const WEATHER_API_KEY = 'YOUR_WEATHER_API_KEY'; // OpenWeatherMap API 키
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
        });
      }
    } catch (error) {
      console.error('❌ Weather API error:', error);
      // 날씨 정보 실패 시 기본값
      setWeather({
        temp: 0,
        description: '정보 없음',
        icon: '01d',
      });
    }
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
        await getWeatherData(latitude, longitude);
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
        const authStatus = await Geolocation.requestAuthorization('whenInUse');
        const granted = authStatus === 'granted';
        setHasLocationPermission(granted);
        if (granted) {
          getCurrentLocation();
        }
        return granted;
      }

      if (Platform.OS === 'android') {
        const locationPermissionGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (locationPermissionGranted) {
          console.log('✅ Location permission already granted');
          setHasLocationPermission(true);
          getCurrentLocation();
          return true;
        }

        console.log('📍 Requesting location permission...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 필요',
            message: '현재 위치 정보를 표시하기 위해 위치 권한이 필요합니다.',
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

  const handleFireReport = () => {
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/applogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.userNameText}>{userName} 님</Text>
      </View>

      {/* 날씨 정보 카드 */}
      {weather && (
        <View style={styles.weatherCard}>
          <Text style={styles.weatherIcon}>☀️</Text>
          <Text style={styles.weatherText}>
            현재 교촌치킨 날씨에 대한 신뢰도 {weather.temp}%
          </Text>
        </View>
      )}

      {/* 주소 카드 */}
      <View style={styles.addressCard}>
        <Text style={styles.addressIcon}>📍</Text>
        <Text style={styles.addressText}>
          {currentLocation && currentLocation.address
            ? currentLocation.address
            : '위치 정보를 가져오는 중...'}
        </Text>
      </View>

      {/* 실물신고 버튼 */}
      <View style={styles.fireButtonContainer}>
        <TouchableOpacity style={styles.fireButton} onPress={handleFireReport}>
          <View style={styles.fireButtonInner}>
            <Text style={styles.fireButtonTitle}>화재 신고</Text>
            <View style={styles.fireIconContainer}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text style={styles.mountainEmoji}>⛰️</Text>
              <Text style={styles.fireEmoji2}>🔥</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: {
    width: 90,
    height: 40,
  },
  userNameText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid', // 'solid', 'double', 'dotted', 'dashed'
    textDecorationColor: '#1A1A1A', // 밑줄 색상
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: '#FFB300',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  weatherText: {
    fontSize: 14,
    color: '#5D4037',
    flex: 1,
    fontWeight: '500',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addressIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
    fontWeight: '500',
  },
  fireButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 80,
  },
  fireButton: {
    width: '70%',
    aspectRatio: 1,
    maxWidth: 300,
  },
  fireButtonInner: {
    flex: 1,
    backgroundColor: '#D84A48',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    shadowColor: '#D84A48',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  fireButtonTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: 2,
  },
  fireIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 42,
    marginHorizontal: 6,
  },
  mountainEmoji: {
    fontSize: 52,
    marginHorizontal: 6,
  },
  fireEmoji2: {
    fontSize: 42,
    marginHorizontal: 6,
  },
});

export default HomeScreen;
