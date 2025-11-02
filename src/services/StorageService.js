import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'detection_history';

export const saveDetection = async detection => {
  try {
    const history = await loadDetectionHistory();
    const newDetection = {
      ...detection,
      id: Date.now().toString(),
    };
    history.push(newDetection);

    // 최대 100개까지만 저장 (메모리 관리)
    const trimmedHistory = history.slice(-100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));

    return newDetection;
  } catch (error) {
    console.error('Failed to save detection:', error);
    return null;
  }
};

export const loadDetectionHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load detection history:', error);
    return [];
  }
};

export const deleteDetection = async id => {
  try {
    const history = await loadDetectionHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
    return true;
  } catch (error) {
    console.error('Failed to delete detection:', error);
    return false;
  }
};

export const clearAllDetections = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear detections:', error);
    return false;
  }
};

export const getDetectionStats = async () => {
  try {
    const history = await loadDetectionHistory();
    const stats = {
      total: history.length,
      wildfire: history.filter(h => h.category === 'wildfire').length,
      urbanFire: history.filter(h => h.category === 'urban_fire').length,
      uncertain: history.filter(h => h.category === 'uncertain').length,
    };
    return stats;
  } catch (error) {
    console.error('Failed to get detection stats:', error);
    return {total: 0, wildfire: 0, urbanFire: 0, uncertain: 0};
  }
};
