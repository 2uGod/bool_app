import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAPI from '../services/UserAPI';

const ReportsScreen = ({navigation}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const result = await UserAPI.getMyReports(token);
      if (result.success) {
        setReports(result.reports || []);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading reports:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getFireTypeText = fireType => {
    switch (fireType) {
      case 'wildfire':
        return '🌲 산불';
      case 'urban_fire':
        return '🏙️ 도심 화재';
      case 'industrial_fire':
        return '🏭 공장 화재';
      default:
        return '🔥 화재';
    }
  };

  const getStatusBadge = status => {
    const statusMap = {
      success: {text: '전송됨', color: '#4CAF50'},
      failed: {text: '전송실패', color: '#F44336'},
      pending: {text: '대기중', color: '#FF9800'},
    };
    const statusInfo = statusMap[status] || statusMap.pending;

    return (
      <View style={[styles.statusBadge, {backgroundColor: statusInfo.color}]}>
        <Text style={styles.statusText}>{statusInfo.text}</Text>
      </View>
    );
  };

  const getRelativeTime = timestamp => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredReports = reports.filter(item => {
    if (searchText === '') return true;
    const searchLower = searchText.toLowerCase();
    return (
      (item.address || '').toLowerCase().includes(searchLower) ||
      getFireTypeText(item.fire_type).toLowerCase().includes(searchLower)
    );
  });

  const renderReportItem = ({item}) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() =>
        navigation.navigate('ReportDetail', {reportId: item.id})
      }>
      {/* 썸네일 */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailEmoji}>
            {item.fire_type === 'wildfire' ? '🌲🔥' : item.fire_type === 'urban_fire' ? '🏙️🔥' : '🔥'}
          </Text>
        </View>
      </View>

      {/* 내용 영역 */}
      <View style={styles.itemContent}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle}>
            {getFireTypeText(item.fire_type)} 화재 신고
          </Text>
          <Text style={styles.itemSubtitle}>
            위치: {item.address || '***'} | 상태: {item.transmission_status === 'success' ? '전송됨' : item.transmission_status === 'failed' ? '실패' : '대기중'}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            위험도 {item.confidence ? `${(typeof item.confidence === 'number' ? item.confidence : parseFloat(item.confidence) || 0).toFixed(1)}%` : '-'} | 습도: {item.humidity ? `${item.humidity}%` : '-'}
          </Text>
        </View>
        <Text style={styles.timeText}>{getRelativeTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신고내역</Text>
      </View>

      {/* 검색 입력 필드 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="지역별을 검색하세요"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔥</Text>
          <Text style={styles.emptyText}>
            {reports.length === 0 ? '아직 신고 내역이 없습니다' : '검색 결과가 없습니다'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF4500"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFB6C1',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  listContainer: {
    padding: 15,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  thumbnailContainer: {
    marginRight: 15,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailEmoji: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default ReportsScreen;
