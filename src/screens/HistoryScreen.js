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
} from 'react-native';
import {loadDetectionHistory, deleteDetection} from '../services/StorageService';
import LinearGradient from 'react-native-linear-gradient';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

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

  const filteredHistory =
    selectedCategory === 'all'
      ? history
      : history.filter(item => item.category === selectedCategory);

  const getStatistics = () => {
    const total = history.length;
    const wildfire = history.filter(h => h.category === 'wildfire').length;
    const urbanFire = history.filter(h => h.category === 'urban_fire').length;
    const uncertain = history.filter(h => h.category === 'uncertain').length;

    return {total, wildfire, urbanFire, uncertain};
  };

  const stats = getStatistics();

  const renderHistoryItem = ({item}) => (
    <View style={styles.historyItem}>
      <LinearGradient
        colors={getCategoryColors(item.category)}
        style={styles.categoryStrip}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      />

      {/* 스크린샷 썸네일 */}
      {item.annotatedImage && (
        <TouchableOpacity
          style={styles.thumbnailContainer}
          onPress={() => setSelectedImage(item.annotatedImage)}>
          <Image
            source={{uri: `data:image/jpeg;base64,${item.annotatedImage}`}}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.itemContent}
        onLongPress={() => handleDelete(item.id)}>
        <View style={styles.itemHeader}>
          <Text style={styles.categoryEmoji}>
            {getCategoryEmoji(item.category)}
          </Text>
          <View style={styles.itemInfo}>
            <Text style={styles.categoryText}>
              {getCategoryLabel(item.category)}
            </Text>
            <Text style={styles.timestampText}>
              {new Date(item.timestamp).toLocaleString('ko-KR')}
            </Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {(item.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {item.detections && item.detections.length > 0 && (
          <View style={styles.detectionsContainer}>
            {item.detections.map((detection, index) => (
              <View key={index} style={styles.detectionTag}>
                <Text style={styles.detectionTagText}>
                  {detection.class === 'fire' ? '🔥' : '💨'}{' '}
                  {(detection.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {item.sceneInfo && (
          <View style={styles.sceneInfo}>
            <Text style={styles.sceneInfoText}>
              식생: {(item.sceneInfo.vegetationRatio * 100).toFixed(0)}% | 도심:{' '}
              {(item.sceneInfo.urbanRatio * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>전체 감지</Text>
        </View>
        <View style={[styles.statBox, styles.wildfireBox]}>
          <Text style={styles.statNumber}>{stats.wildfire}</Text>
          <Text style={styles.statLabel}>산불</Text>
        </View>
        <View style={[styles.statBox, styles.urbanBox]}>
          <Text style={styles.statNumber}>{stats.urbanFire}</Text>
          <Text style={styles.statLabel}>도심 화재</Text>
        </View>
        <View style={[styles.statBox, styles.uncertainBox]}>
          <Text style={styles.statNumber}>{stats.uncertain}</Text>
          <Text style={styles.statLabel}>의심</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedCategory('all')}>
          <Text
            style={[
              styles.filterButtonText,
              selectedCategory === 'all' && styles.filterButtonTextActive,
            ]}>
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory === 'wildfire' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedCategory('wildfire')}>
          <Text
            style={[
              styles.filterButtonText,
              selectedCategory === 'wildfire' && styles.filterButtonTextActive,
            ]}>
            산불
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory === 'urban_fire' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedCategory('urban_fire')}>
          <Text
            style={[
              styles.filterButtonText,
              selectedCategory === 'urban_fire' && styles.filterButtonTextActive,
            ]}>
            도심 화재
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory === 'uncertain' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedCategory('uncertain')}>
          <Text
            style={[
              styles.filterButtonText,
              selectedCategory === 'uncertain' && styles.filterButtonTextActive,
            ]}>
            의심
          </Text>
        </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  wildfireBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#FF4500',
  },
  urbanBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#FF8C00',
  },
  uncertainBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#FFD700',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF4500',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  categoryStrip: {
    width: 6,
    alignSelf: 'stretch',
  },
  itemContent: {
    flex: 1,
    padding: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  detectionsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  detectionTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  detectionTagText: {
    fontSize: 12,
    color: '#333',
  },
  sceneInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sceneInfoText: {
    fontSize: 12,
    color: '#666',
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
  thumbnailContainer: {
    width: 100,
    height: 100,
    marginLeft: 10,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
