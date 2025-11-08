import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const LocationTestScreen = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 LocationTestScreen mounted');
    requestLocation();
  }, []);

  const requestLocation = () => {
    console.log('📍 Requesting location permission...');

    // iOS 권한 요청 (콜백 함수 제공)
    Geolocation.requestAuthorization(() => {
      console.log('📍 Permission granted, getting location...');
      getLocation();
    });

    // 권한 없이도 시도 (이미 허용된 경우)
    setTimeout(() => {
      getLocation();
    }, 500);
  };

  const getLocation = () => {
    console.log('📍 Getting current position...');

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location success:', latitude, longitude);
        setLocation({ latitude, longitude });

        Alert.alert(
          '위치 확인 성공!',
          `위도: ${latitude.toFixed(6)}\n경도: ${longitude.toFixed(6)}`,
        );
      },
      error => {
        console.error('❌ Location error:', error);
        setError(error.message);

        Alert.alert('위치 오류', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>위치 테스트</Text>

      {location ? (
        <View style={styles.infoBox}>
          <Text style={styles.label}>✅ 위치 정보:</Text>
          <Text style={styles.value}>위도: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.value}>
            경도: {location.longitude.toFixed(6)}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ 오류: {error}</Text>
        </View>
      ) : (
        <Text style={styles.loading}>위치 정보 가져오는 중...</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={requestLocation}>
        <Text style={styles.buttonText}>다시 시도</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d32',
  },
  value: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
  },
  loading: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LocationTestScreen;
