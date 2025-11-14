import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAPI from '../services/UserAPI';

const { width } = Dimensions.get('window');

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageView, setImageView] = useState('original'); // 'original' or 'annotated'

  useEffect(() => {
    const fetchReportDetail = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('access_token');

        if (!token) {
          Alert.alert('오류', '로그인이 필요합니다.', [
            { text: '확인', onPress: () => navigation.navigate('Login') },
          ]);
          return;
        }

        const result = await UserAPI.getReportDetail(token, reportId);

        if (result.success) {
          setReport(result.report);
        } else {
          throw new Error(result.error || '신고 내역을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('신고 상세 조회 실패:', error);
        Alert.alert(
          '오류',
          error.message || '신고 내역을 불러올 수 없습니다.',
          [{ text: '확인', onPress: () => navigation.goBack() }],
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetail();
  }, [reportId, navigation]);

  const getStatusText = status => {
    const statusMap = {
      pending: '대기 중',
      confirmed: '확인됨',
      in_progress: '처리 중',
      resolved: '해결됨',
      false_alarm: '오신고',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = status => {
    const colorMap = {
      pending: '#FFA500',
      confirmed: '#FF6B6B',
      in_progress: '#4ECDC4',
      resolved: '#95E1D3',
      false_alarm: '#999',
    };
    return colorMap[status] || '#999';
  };

  const getFireTypeText = type => {
    const typeMap = {
      wildfire: '산불',
      urban_fire: '도심 화재',
      industrial_fire: '공장 화재',
      no_fire: '화재 없음',
    };
    return typeMap[type] || type;
  };

  const getFireTypeIcon = type => {
    const iconMap = {
      wildfire: '🌲🔥',
      urban_fire: '🏢🔥',
      industrial_fire: '🏭🔥',
      no_fire: '✅',
    };
    return iconMap[type] || '🔥';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>신고 내역 조회 중...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>신고 내역을 찾을 수 없습니다</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
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
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신고 상세 내역</Text>
        <View style={styles.headerRight}>
          <Text style={styles.reportId}>#{report.id}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* 상태 뱃지 */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(report.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(report.status)}
            </Text>
          </View>
        </View>

        {/* 화재 정보 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔥</Text>
            <Text style={styles.sectionTitle}>화재 정보</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>화재 유형</Text>
              <Text style={styles.infoValue}>
                {getFireTypeIcon(report.fireType)}{' '}
                {getFireTypeText(report.fireType)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>위험도</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${report.confidence}%` },
                    ]}
                  />
                </View>
                <Text style={styles.infoValue}>{report.confidence}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 날씨 정보 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌤️</Text>
            <Text style={styles.sectionTitle}>기상 정보</Text>
          </View>
          <View style={styles.weatherCard}>
            <View style={styles.weatherRow}>
              <Text style={styles.weatherIcon}>💧</Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherLabel}>습도</Text>
                <Text style={styles.weatherValue}>
                  {report.humidity ? `${report.humidity}%` : '-'}
                </Text>
              </View>
            </View>

            {report.windDirection && (
              <>
                <View style={styles.weatherDivider} />
                <View style={styles.weatherRow}>
                  <Text style={styles.weatherIcon}>🧭</Text>
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherLabel}>풍향</Text>
                    <Text style={styles.weatherValue}>
                      {report.windDirection || '-'}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {report.windSpeed !== undefined && report.windSpeed !== null && (
              <>
                <View style={styles.weatherDivider} />
                <View style={styles.weatherRow}>
                  <Text style={styles.weatherIcon}>💨</Text>
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherLabel}>풍속</Text>
                    <Text style={styles.weatherValue}>
                      {`${report.windSpeed} m/s`}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {report.humidity ||
            report.windDirection ||
            report.windSpeed !== undefined}
        </View>

        {/* 위치 정보 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>위치 정보</Text>
          </View>
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>{report.location}</Text>
            <Text style={styles.timeText}>
              {new Date(report.createdAt).toLocaleString('ko-KR')}
            </Text>
          </View>
        </View>

        {/* 이미지 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📸</Text>
            <Text style={styles.sectionTitle}>화재 이미지</Text>
          </View>

          {/* 이미지 토글 버튼 */}
          {report.annotatedImage && (
            <View style={styles.imageToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  imageView === 'original' && styles.toggleButtonActive,
                ]}
                onPress={() => setImageView('original')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    imageView === 'original' && styles.toggleButtonTextActive,
                  ]}
                >
                  원본
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  imageView === 'annotated' && styles.toggleButtonActive,
                ]}
                onPress={() => setImageView('annotated')}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    imageView === 'annotated' && styles.toggleButtonTextActive,
                  ]}
                >
                  분석 결과
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageContainer}>
            {imageView === 'original' ? (
              report.imageUrl || report.originalImage ? (
                <Image
                  source={{
                    uri: `data:image/jpeg;base64,${
                      report.imageUrl || report.originalImage
                    }`,
                  }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>이미지 없음</Text>
                </View>
              )
            ) : report.annotatedImage ? (
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${report.annotatedImage}`,
                }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>분석 이미지 없음</Text>
              </View>
            )}
          </View>
        </View>

        {/* AI 분석 결과 */}
        {report.sceneAnalysis && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🤖</Text>
              <Text style={styles.sectionTitle}>AI 분석 결과</Text>
            </View>
            <View style={styles.aiCard}>
              <View style={styles.aiRow}>
                <View style={styles.aiIconContainer}>
                  <Text style={styles.aiEmoji}>🌲</Text>
                </View>
                <View style={styles.aiInfo}>
                  <Text style={styles.aiLabel}>산불 가능성</Text>
                  <Text style={styles.aiValue}>
                    {(report.sceneAnalysis.wildfire_prob * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.aiRow}>
                <View style={styles.aiIconContainer}>
                  <Text style={styles.aiEmoji}>🏙️</Text>
                </View>
                <View style={styles.aiInfo}>
                  <Text style={styles.aiLabel}>도심 화재 가능성</Text>
                  <Text style={styles.aiValue}>
                    {(report.sceneAnalysis.urban_prob * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.aiRow}>
                <View style={styles.aiIconContainer}>
                  <Text style={styles.aiEmoji}>🎯</Text>
                </View>
                <View style={styles.aiInfo}>
                  <Text style={styles.aiLabel}>감지된 객체</Text>
                  <Text style={styles.aiValue}>
                    {report.boxes?.length || 0}개
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 처리 이력 */}
        {report.updatedAt !== report.createdAt && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⏱</Text>
              <Text style={styles.sectionTitle}>처리 이력</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>최종 업데이트</Text>
                <Text style={styles.infoValue}>
                  {new Date(report.updatedAt).toLocaleString('ko-KR')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    color: '#333',
    fontSize: 28,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    backgroundColor: '#FFB6C1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  reportId: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    marginLeft: 10,
  },
  infoValueAddress: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  confidenceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  weatherCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherLabel: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: '500',
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 18,
    color: '#5D4037',
    fontWeight: '700',
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#999',
  },
  aiCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  aiIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  aiEmoji: {
    fontSize: 24,
  },
  aiInfo: {
    flex: 1,
  },
  aiLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  aiValue: {
    fontSize: 17,
    color: '#333',
    fontWeight: '700',
  },
  imageToggle: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  imageContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  image: {
    width: '100%',
    height: width * 0.75,
  },
  noImage: {
    width: '100%',
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ReportDetailScreen;
