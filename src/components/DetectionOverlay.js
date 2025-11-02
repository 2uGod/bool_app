import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const DetectionOverlay = ({detectionResult, isProcessing}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (detectionResult?.fireDetected) {
      // 감지되면 박스가 펄스 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [detectionResult?.fireDetected, pulseAnim]);
  if (!detectionResult) {
    return null;
  }

  const {fireDetected, detections, category} = detectionResult;

  return (
    <View style={styles.overlay}>
      {/* 감지된 객체 바운딩 박스 */}
      {fireDetected &&
        detections?.map((detection, index) => (
          <Animated.View
            key={index}
            style={[
              styles.boundingBox,
              {
                left: detection.bbox.x,
                top: detection.bbox.y,
                width: detection.bbox.width,
                height: detection.bbox.height,
                borderColor: detection.class === 'fire' ? '#FF4500' : '#FFD700',
                transform: [{scale: pulseAnim}],
              },
            ]}>
            <View
              style={[
                styles.label,
                {
                  backgroundColor:
                    detection.class === 'fire' ? '#FF4500' : '#FFD700',
                },
              ]}>
              <Text style={styles.labelText}>
                {detection.class === 'fire' ? '🔥 화재' : '💨 연기'} (
                {(detection.confidence * 100).toFixed(0)}%)
              </Text>
            </View>
            {/* 코너 마커 추가 (YOLO 스타일) */}
            <View
              style={[
                styles.cornerTopLeft,
                {
                  borderColor:
                    detection.class === 'fire' ? '#FF4500' : '#FFD700',
                },
              ]}
            />
            <View
              style={[
                styles.cornerTopRight,
                {
                  borderColor:
                    detection.class === 'fire' ? '#FF4500' : '#FFD700',
                },
              ]}
            />
            <View
              style={[
                styles.cornerBottomLeft,
                {
                  borderColor:
                    detection.class === 'fire' ? '#FF4500' : '#FFD700',
                },
              ]}
            />
            <View
              style={[
                styles.cornerBottomRight,
                {
                  borderColor:
                    detection.class === 'fire' ? '#FF4500' : '#FFD700',
                },
              ]}
            />
          </Animated.View>
        ))}

      {/* 처리 중 인디케이터 */}
      {isProcessing && (
        <View style={styles.processingIndicator}>
          <Text style={styles.processingText}>분석 중...</Text>
        </View>
      )}

      {/* 카테고리 배지 */}
      {fireDetected && (
        <LinearGradient
          colors={getCategoryColors(category)}
          style={styles.categoryBadge}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <Text style={styles.categoryText}>{getCategoryEmoji(category)}</Text>
          <Text style={styles.categoryLabel}>
            {getCategoryLabel(category)}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
};

const getCategoryColors = category => {
  const colors = {
    wildfire: ['#FF4500', '#FF6347'],
    urban_fire: ['#FF8C00', '#FFA500'],
    uncertain: ['#FFD700', '#FFA500'],
    no_fire: ['#00AA00', '#00CC00'],
  };
  return colors[category] || ['#888', '#AAA'];
};

const getCategoryEmoji = category => {
  const emojis = {
    wildfire: '🌲🔥',
    urban_fire: '🏙️🔥',
    uncertain: '⚠️',
    no_fire: '✅',
  };
  return emojis[category] || '❓';
};

const getCategoryLabel = category => {
  const labels = {
    wildfire: '산불',
    urban_fire: '도심 화재',
    uncertain: '화재 의심',
    no_fire: '정상',
  };
  return labels[category] || '알 수 없음';
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  label: {
    position: 'absolute',
    top: -32,
    left: -2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  processingIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // YOLO 스타일 코너 마커
  cornerTopLeft: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 24,
    height: 24,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderTopWidth: 5,
    borderRightWidth: 5,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 24,
    height: 24,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },
});

export default DetectionOverlay;
