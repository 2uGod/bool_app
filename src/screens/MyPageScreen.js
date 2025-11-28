import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from '../services/AuthAPI';

const MyPageScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userStr = await AsyncStorage.getItem('user');

      if (!token) {
        console.log('⚠️ No token found, redirecting to Login');
        navigation.replace('Login');
        return;
      }

      // 로컬 저장된 사용자 정보를 먼저 표시 (fallback)
      let localUser = null;
      if (userStr) {
        try {
          localUser = JSON.parse(userStr);
          setUser(localUser);
          console.log('✅ Local user data loaded:', localUser);
        } catch (parseError) {
          console.error('❌ Failed to parse user data:', parseError);
        }
      }

      // 서버에서 최신 프로필 조회
      console.log('📡 Fetching profile from server...');
      const profileResult = await AuthAPI.getProfile(token);

      if (profileResult.success && profileResult.profile) {
        console.log('✅ Server profile loaded:', profileResult.profile);
        setUser(profileResult.profile);

        // 서버 데이터로 AsyncStorage 업데이트
        await AsyncStorage.setItem(
          'user',
          JSON.stringify(profileResult.profile),
        );
      } else {
        console.warn('⚠️ Profile fetch failed:', profileResult.error);

        // 서버 조회 실패 시 로컬 데이터 사용
        if (!localUser) {
          console.error('❌ No local user data available');
          Alert.alert(
            '프로필 로드 실패',
            `서버에서 프로필을 불러올 수 없습니다.\n오류: ${
              profileResult.error || '알 수 없는 오류'
            }`,
            [{ text: '재시도', onPress: loadUserData }, { text: '확인' }],
          );
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading user data:', error);

      // 에러 발생 시에도 로컬 데이터 유지
      setLoading(false);

      Alert.alert('오류', '사용자 정보를 불러오는 중 오류가 발생했습니다.', [
        { text: '재시도', onPress: loadUserData },
        { text: '확인' },
      ]);
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
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
        <ActivityIndicator size="large" color="#E57373" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Detection')}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileIconContainer}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileEmoji}>👤</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user?.name || '사용자'} 님</Text>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuList}>
          <MenuItem
            icon="👤"
            title="계정"
            subtitle="개인정보 설정 및 수정"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <MenuItem
            icon="📍"
            title="대피소 및 피난처"
            subtitle="현재 지역 대피소 및 피난처 위치 확인"
            onPress={() => navigation.navigate('Shelter')}
          />
          <MenuItem
            icon="🔔"
            title="문의 및 건의사항"
            subtitle="capstonedesign2@mju.ac.kr"
            onPress={() => {
              const email = 'capstonedesign2@mju.ac.kr';
              const subject = '문의 및 건의사항';
              const body = '';
              const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              Linking.openURL(mailtoUrl).catch(err =>
                Alert.alert('오류', '메일 앱을 열 수 없습니다.'),
              );
            }}
          />
          <MenuItem
            icon="🚪"
            title="로그아웃"
            subtitle="계정에서 로그아웃합니다."
            onPress={handleLogout}
            isDestructive
          />
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>현재 버전 ver 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const MenuItem = ({ icon, title, subtitle, onPress, isDestructive }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <Text style={styles.menuIcon}>{icon}</Text>
    </View>
    <View style={styles.menuTextContainer}>
      <Text
        style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.menuSubtitle,
            isDestructive && styles.menuSubtitleDestructive,
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFB3BA',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 2,
  },
  profileIconContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: {
    fontSize: 36,
    color: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  editBadgeText: {
    fontSize: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuList: {
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuTitleDestructive: {
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  menuSubtitleDestructive: {
    color: '#999',
  },
  versionContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#999',
  },
});

export default MyPageScreen;
