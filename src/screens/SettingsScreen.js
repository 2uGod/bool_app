import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    autoDetection: true,
    soundAlerts: true,
    vibrationAlerts: true,
    saveScreenshots: true,
    confidenceThreshold: 0.7,
    detectionInterval: 2.0,
    emergency119: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async newSettings => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const toggleSetting = key => {
    const newSettings = {...settings, [key]: !settings[key]};
    saveSettings(newSettings);
  };

  const adjustThreshold = increase => {
    let newThreshold = settings.confidenceThreshold;
    if (increase) {
      newThreshold = Math.min(0.95, newThreshold + 0.05);
    } else {
      newThreshold = Math.max(0.5, newThreshold - 0.05);
    }
    saveSettings({...settings, confidenceThreshold: newThreshold});
  };

  const adjustInterval = increase => {
    let newInterval = settings.detectionInterval;
    if (increase) {
      newInterval = Math.min(5.0, newInterval + 0.5);
    } else {
      newInterval = Math.max(1.0, newInterval - 0.5);
    }
    saveSettings({...settings, detectionInterval: newInterval});
  };

  const clearData = () => {
    Alert.alert(
      '데이터 초기화',
      '모든 감지 기록을 삭제하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('detection_history');
              Alert.alert('완료', '감지 기록이 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '데이터 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>화재 감지 설정</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>자동 감지</Text>
            <Text style={styles.settingDescription}>
              앱 실행 시 자동으로 감지 시작
            </Text>
          </View>
          <Switch
            value={settings.autoDetection}
            onValueChange={() => toggleSetting('autoDetection')}
            trackColor={{false: '#767577', true: '#FF8C00'}}
            thumbColor={settings.autoDetection ? '#FF4500' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>신뢰도 임계값</Text>
            <Text style={styles.settingDescription}>
              화재로 판단하는 최소 신뢰도: {(settings.confidenceThreshold * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.adjustButtons}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustThreshold(false)}>
              <Text style={styles.adjustButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustThreshold(true)}>
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>감지 주기</Text>
            <Text style={styles.settingDescription}>
              프레임 분석 간격: {settings.detectionInterval.toFixed(1)}초
            </Text>
          </View>
          <View style={styles.adjustButtons}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustInterval(false)}>
              <Text style={styles.adjustButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => adjustInterval(true)}>
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>소리 알림</Text>
            <Text style={styles.settingDescription}>
              화재 감지 시 소리로 알림
            </Text>
          </View>
          <Switch
            value={settings.soundAlerts}
            onValueChange={() => toggleSetting('soundAlerts')}
            trackColor={{false: '#767577', true: '#FF8C00'}}
            thumbColor={settings.soundAlerts ? '#FF4500' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>진동 알림</Text>
            <Text style={styles.settingDescription}>
              화재 감지 시 진동으로 알림
            </Text>
          </View>
          <Switch
            value={settings.vibrationAlerts}
            onValueChange={() => toggleSetting('vibrationAlerts')}
            trackColor={{false: '#767577', true: '#FF8C00'}}
            thumbColor={settings.vibrationAlerts ? '#FF4500' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>데이터 설정</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>스크린샷 저장</Text>
            <Text style={styles.settingDescription}>
              화재 감지 시 스크린샷 자동 저장
            </Text>
          </View>
          <Switch
            value={settings.saveScreenshots}
            onValueChange={() => toggleSetting('saveScreenshots')}
            trackColor={{false: '#767577', true: '#FF8C00'}}
            thumbColor={settings.saveScreenshots ? '#FF4500' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={clearData}>
          <Text style={styles.dangerButtonText}>🗑️ 감지 기록 삭제</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>긴급 연락</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>119 빠른 신고</Text>
            <Text style={styles.settingDescription}>
              화재 알림에 119 신고 버튼 표시
            </Text>
          </View>
          <Switch
            value={settings.emergency119}
            onValueChange={() => toggleSetting('emergency119')}
            trackColor={{false: '#767577', true: '#FF8C00'}}
            thumbColor={settings.emergency119 ? '#FF4500' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>앱 정보</Text>
        <Text style={styles.infoText}>버전: 1.0.0</Text>
        <Text style={styles.infoText}>모델: YOLOv8 + SegFormer</Text>
        <Text style={styles.infoText}>
          산불과 도심 화재를 구분하여 감지합니다.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  adjustButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FF4500',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#FF4500',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 3,
  },
});

export default SettingsScreen;
