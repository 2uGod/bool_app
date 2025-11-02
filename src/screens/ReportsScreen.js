import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAPI from '../services/UserAPI';

const ReportsScreen = ({navigation}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
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

  const renderReportItem = ({item}) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() =>
        navigation.navigate('ReportDetail', {reportId: item.id})
      }>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{getFireTypeText(item.fire_type)}</Text>
        {getStatusBadge(item.transmission_status)}
      </View>

      <View style={styles.reportInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 위치:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.address || '위치 정보 없음'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>💧 습도:</Text>
          <Text style={styles.infoValue}>
            {item.humidity ? `${item.humidity}%` : '-'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🎯 위험도:</Text>
          <Text
            style={[
              styles.infoValue,
              styles.confidenceValue,
              item.confidence >= 80 && styles.highConfidence,
            ]}>
            {item.confidence ? `${item.confidence.toFixed(1)}%` : '-'}
          </Text>
        </View>

        {item.points_earned && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⭐ 획득 점수:</Text>
            <Text style={[styles.infoValue, styles.pointsValue]}>
              +{item.points_earned}점
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.reportDate}>
        {new Date(item.created_at).toLocaleString('ko-KR')}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔥</Text>
        <Text style={styles.emptyText}>아직 신고 내역이 없습니다</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reports}
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
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#f5f5f5',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  confidenceValue: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  highConfidence: {
    color: '#F44336',
  },
  pointsValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 10,
  },
});

export default ReportsScreen;
