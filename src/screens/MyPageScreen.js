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
import ShelterMapScreen from './ShelterMapScreen';

<<<<<<< Updated upstream
const MyPageScreen = ({navigation}) => {
=======
const MyPageScreen = ({ navigation }) => {
  const [showShelterMap, setShowShelterMap] = useState(false);
>>>>>>> Stashed changes
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
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
        await AsyncStorage.setItem('user', JSON.stringify(profileResult.profile));
      } else {
        console.warn('⚠️ Profile fetch failed:', profileResult.error);

        // 서버 조회 실패 시 로컬 데이터 사용
        if (!localUser) {
          console.error('❌ No local user data available');
          Alert.alert(
            '프로필 로드 실패',
            `서버에서 프로필을 불러올 수 없습니다.\n오류: ${profileResult.error || '알 수 없는 오류'}`,
            [
              { text: '재시도', onPress: loadUserData },
              { text: '확인' }
            ]
          );
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading user data:', error);

      // 에러 발생 시에도 로컬 데이터 유지
      setLoading(false);

      Alert.alert(
        '오류',
        '사용자 정보를 불러오는 중 오류가 발생했습니다.',
        [
          { text: '재시도', onPress: loadUserData },
          { text: '확인' }
        ]
      );
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
        <View style={styles.profileIcon}>
          <Text style={styles.profileEmoji}>👤</Text>
        </View>
        <Text style={styles.userName}>{user?.name || '사용자'} 님</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      {/* 메뉴 */}
      <View style={styles.menuContainer}>
        <MenuItem
          icon="📝"
          title="개인 정보 설정 및 수정"
          onPress={() => navigation.navigate('ProfileEdit')}
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

<<<<<<< Updated upstream
      {/* 버전 정보 */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>현재 버전 v1.0.0</Text>
      </View>
    </ScrollView>
=======
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
            onPress={() => setShowShelterMap(true)}
          />

          <MenuItem
            icon="🔔"
            title="문의 및 건의사항"
            subtitle="capstonedesign2@mju.ac.kr"
            onPress={() => {
              const email = 'capstonedesign2@mju.ac.kr';
              const subject = '문의 및 건의사항';
              const body = '';
              const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
                subject,
              )}&body=${encodeURIComponent(body)}`;
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
      {/* 대피소 지도 모달 */}
      <ShelterMapScreen
        visible={showShelterMap}
        onClose={() => setShowShelterMap(false)}
      />
    </View>
>>>>>>> Stashed changes
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
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  profileEmoji: {
    fontSize: 40,
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
