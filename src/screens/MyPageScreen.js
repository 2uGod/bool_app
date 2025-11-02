import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from '../services/AuthAPI';
import UserAPI from '../services/UserAPI';

const MyPageScreen = ({navigation}) => {
  const [user, setUser] = useState(null);
  const [rankInfo, setRankInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userStr = await AsyncStorage.getItem('user');

      if (!token || !userStr) {
        navigation.replace('Login');
        return;
      }

      // 프로필 조회
      const profileResult = await AuthAPI.getProfile(token);
      if (profileResult.success) {
        setUser(profileResult.profile);
      }

      // 계급 정보 조회
      const rankResult = await UserAPI.getMyRank(token);
      if (rankResult.success) {
        setRankInfo(rankResult.rankInfo);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: async () => {
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('user');
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 */}
      <View style={styles.profileHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankEmoji}>🔥</Text>
          <Text style={styles.rankName}>
            {rankInfo?.current_rank?.name || '소방사'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || '사용자'} 님</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        {rankInfo && (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>
              현재 점수: {rankInfo.user_points}점
            </Text>
            {rankInfo.next_rank && (
              <Text style={styles.nextRankText}>
                {rankInfo.next_rank.name}까지 {rankInfo.points_to_next}점 남음
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 메뉴 */}
      <View style={styles.menuContainer}>
        <MenuItem
          icon="📝"
          title="개인 정보 설정 및 수정"
          onPress={() => navigation.navigate('ProfileEdit')}
        />
        <MenuItem
          icon="🏠"
          title="현재 지역 대피소 및 피난처 위치"
          onPress={() => navigation.navigate('Shelters')}
        />
        <MenuItem
          icon="🏅"
          title="소방 등급 확인"
          onPress={() => navigation.navigate('RankInfo')}
        />
        <MenuItem
          icon="💬"
          title="문의 및 건의사항"
          onPress={() => navigation.navigate('Inquiry')}
        />
        <MenuItem
          icon="⚙️"
          title="설정"
          onPress={() => navigation.navigate('Settings')}
        />
        <MenuItem
          icon="🚪"
          title="로그아웃"
          onPress={handleLogout}
          isDestructive
        />
      </View>

      {/* 버전 정보 */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>현재 버전 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const MenuItem = ({icon, title, onPress, isDestructive}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text
        style={[
          styles.menuTitle,
          isDestructive && styles.menuTitleDestructive,
        ]}>
        {title}
      </Text>
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  rankEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  rankName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  nextRankText: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  menuTitleDestructive: {
    color: '#FF4500',
  },
  menuArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  versionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default MyPageScreen;
