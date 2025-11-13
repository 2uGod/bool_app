import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import {loadDetectionHistory, deleteDetection} from '../services/StorageService';
import LinearGradient from 'react-native-linear-gradient';

const HistoryScreen = ({navigation}) => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setRefreshing(true);
    const data = await loadDetectionHistory();
    setHistory(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setRefreshing(false);
  };

  const handleDelete = async id => {
    Alert.alert('삭제 확인', '이 기록을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteDetection(id);
          loadHistory();
        },
      },
    ]);
  };

  const getCategoryColors = category => {
    const colors = {
      wildfire: ['#FF4500', '#FF6347'],
      urban_fire: ['#FF8C00', '#FFA500'],
      uncertain: ['#FFD700', '#FFA500'],
    };
    return colors[category] || ['#888', '#AAA'];
  };

  const getCategoryLabel = category => {
    const labels = {
      wildfire: '산불',
      urban_fire: '도심 화재',
      uncertain: '화재 의심',
    };
    return labels[category] || '알 수 없음';
  };

  const getCategoryEmoji = category => {
    const emojis = {
      wildfire: '🌲🔥',
      urban_fire: '🏙️🔥',
      uncertain: '⚠️',
    };
    return emojis[category] || '❓';
  };

  const filteredHistory = history.filter(item => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchText === '' ||
      getCategoryLabel(item.category)
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      new Date(item.timestamp)
        .toLocaleString('ko-KR')
        .includes(searchText);
    return matchesCategory && matchesSearch;
  });

  const getStatistics = () => {
    const total = history.length;
    const wildfire = history.filter(h => h.category === 'wildfire').length;
    const urbanFire = history.filter(h => h.category === 'urban_fire').length;
    const uncertain = history.filter(h => h.category === 'uncertain').length;

    return {total, wildfire, urbanFire, uncertain};
  };

  const stats = getStatistics();

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

  const renderHistoryItem = ({item}) => (
    <TouchableOpacity
      style={styles.historyItem}
      onLongPress={() => handleDelete(item.id)}>
      {/* 썸네일 이미지 */}
      <View style={styles.thumbnailContainer}>
        {item.annotatedImage ? (
          <TouchableOpacity onPress={() => setSelectedImage(item.annotatedImage)}>
            <Image
              source={{uri: `data:image/jpeg;base64,${item.annotatedImage}`}}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.thumbnailEmoji}>
              {getCategoryEmoji(item.category)}
            </Text>
          </View>
        )}
      </View>

      {/* 내용 영역 */}
      <View style={styles.itemContent}>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle}>
            {getCategoryLabel(item.category)} 화재 신고
          </Text>
          <Text style={styles.itemSubtitle}>
            위치: {item.location || '***'} | 상태: {item.status || '***'}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description ||
              `화재 감지 신뢰도 ${(item.confidence * 100).toFixed(0)}%. ${
                item.detections?.length || 0
              }개 객체 탐지됨.`}
          </Text>
        </View>
        <Text style={styles.timeText}>{getRelativeTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

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

      {filteredHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>감지 기록이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadHistory} />
          }
        />
      )}

      {/* 이미지 전체화면 모달 */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}>
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}>
          <Image
            source={{uri: `data:image/jpeg;base64,${selectedImage}`}}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  listContainer: {
    padding: 15,
  },
  historyItem: {
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  thumbnailPlaceholder: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;
