import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAPI from '../services/UserAPI';
import LinearGradient from 'react-native-linear-gradient';

const {width} = Dimensions.get('window');

const ReportDetailScreen = ({route, navigation}) => {
  const {reportId} = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageView, setImageView] = useState('original'); // 'original' or 'annotated'

  useEffect(() => {
    fetchReportDetail();
  }, []);

  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.', [
          {text: '확인', onPress: () => navigation.navigate('Login')},
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
      Alert.alert('오류', error.message || '신고 내역을 불러올 수 없습니다.', [
        {text: '확인', onPress: () => navigation.goBack()},
      ]);
    } finally {
      setLoading(false);
    }
  };

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
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신고 상세 내역</Text>
        <Text style={styles.reportId}>#{report.id}</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollContent}>

      {/* 상태 뱃지 */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(report.status)},
          ]}>
          <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
        </View>
      </View>

      {/* 화재 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 화재 정보</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>화재 유형</Text>
            <Text style={styles.infoValue}>
              {getFireTypeIcon(report.fireType)} {getFireTypeText(report.fireType)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>신뢰도</Text>
            <Text style={styles.infoValue}>{report.confidence}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>위치</Text>
            <Text style={styles.infoValueAddress}>{report.location}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>신고 일시</Text>
            <Text style={styles.infoValue}>
              {new Date(report.createdAt).toLocaleString('ko-KR')}
            </Text>
          </View>
        </View>
      </View>

      {/* 이미지 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 화재 이미지</Text>

        {/* 이미지 토글 버튼 */}
        {report.annotatedImage && (
          <View style={styles.imageToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                imageView === 'original' && styles.toggleButtonActive,
              ]}
              onPress={() => setImageView('original')}>
              <Text
                style={[
                  styles.toggleButtonText,
                  imageView === 'original' && styles.toggleButtonTextActive,
                ]}>
                원본
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                imageView === 'annotated' && styles.toggleButtonActive,
              ]}
              onPress={() => setImageView('annotated')}>
              <Text
                style={[
                  styles.toggleButtonText,
                  imageView === 'annotated' && styles.toggleButtonTextActive,
                ]}>
                분석 결과
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.imageContainer}>
          {imageView === 'original' ? (
            report.imageUrl || report.originalImage ? (
              <Image
                source={{uri: `data:image/jpeg;base64,${report.imageUrl || report.originalImage}`}}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>이미지 없음</Text>
              </View>
            )
          ) : (
            report.annotatedImage ? (
              <Image
                source={{uri: `data:image/jpeg;base64,${report.annotatedImage}`}}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>분석 이미지 없음</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* AI 분석 결과 */}
      {report.sceneAnalysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI 분석 결과</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>산불 가능성</Text>
              <Text style={styles.infoValue}>
                {(report.sceneAnalysis.wildfire_prob * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>도심 화재 가능성</Text>
              <Text style={styles.infoValue}>
                {(report.sceneAnalysis.urban_prob * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>감지된 객체</Text>
              <Text style={styles.infoValue}>
                {report.boxes?.length || 0}개
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 처리 이력 */}
      {report.updatedAt !== report.createdAt && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱ 처리 이력</Text>
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
      <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 30,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  reportId: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: -15,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    flex: 1,
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
    marginVertical: 8,
  },
  imageToggle: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
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
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#F8F9FA',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ReportDetailScreen;
