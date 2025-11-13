import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const FireAlert = ({detection, onClose}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 슬라이드 인 애니메이션
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // 펄스 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 자동 닫기 (10초 후)
    const timeout = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [slideAnim, pulseAnim, onClose]);

  const handleEmergencyCall = () => {
    Alert.alert(
      '긴급 신고',
      '119에 신고하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '신고하기',
          onPress: () => {
            // 실제로는 전화 앱 연동
            Alert.alert('신고', '119 긴급 전화로 연결됩니다.');
          },
        },
      ],
    );
  };

  const getCategoryInfo = () => {
    const info = {
      wildfire: {
        title: '산불 감지',
        emoji: '🌲🔥',
        message: '산림 지역에서 화재가 감지되었습니다.',
        color: ['#FF4500', '#FF6347'],
      },
      urban_fire: {
        title: '도심 화재 감지',
        emoji: '🏙️🔥',
        message: '건물 또는 차량 화재가 감지되었습니다.',
        color: ['#FF8C00', '#FFA500'],
      },
      uncertain: {
        title: '화재 의심',
        emoji: '⚠️🔥',
        message: '화재로 의심되는 상황이 감지되었습니다.',
        color: ['#FFD700', '#FFA500'],
      },
    };
    return info[detection.category] || info.uncertain;
  };

  const categoryInfo = getCategoryInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{translateY: slideAnim}, {scale: pulseAnim}]},
      ]}>
      <LinearGradient
        colors={categoryInfo.color}
        style={styles.alertBox}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{categoryInfo.title}</Text>
            <Text style={styles.subtitle}>
              신뢰도: {(detection.confidence * 100).toFixed(1)}%
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>{categoryInfo.message}</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            감지 시간: {new Date(detection.timestamp).toLocaleTimeString('ko-KR')}
          </Text>
          {detection.sceneInfo && (
            <>
              <Text style={styles.detailText}>
                식생 비율: {(detection.sceneInfo.vegetationRatio * 100).toFixed(0)}%
              </Text>
              <Text style={styles.detailText}>
                도심 비율: {(detection.sceneInfo.urbanRatio * 100).toFixed(0)}%
              </Text>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyCall}>
            <Text style={styles.buttonText}>📞 119 신고</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.buttonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  alertBox: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 36,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  detailText: {
    color: '#fff',
    fontSize: 13,
    marginVertical: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FireAlert;
