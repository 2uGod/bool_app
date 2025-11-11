import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileEditScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 토글 스위치 상태
  const [locationServiceEnabled, setLocationServiceEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const userDataStr = await AsyncStorage.getItem('user');

      if (!token || !userDataStr) {
        Alert.alert('오류', '로그인이 필요합니다.', [
          { text: '확인', onPress: () => navigation.navigate('Login') },
        ]);
        return;
      }

      const userData = JSON.parse(userDataStr);
      setEmail(userData.email || '');
      setName(userData.name || '');
      setPhoneNumber(userData.phoneNumber || userData.phone || '');
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      Alert.alert('오류', '프로필 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('입력 오류', '모든 비밀번호 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('입력 오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      setSaving(true);
      // 비밀번호 변경 API 호출
      Alert.alert('성공', '비밀번호가 변경되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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
          onPress={() => navigation.navigate('Main', { screen: 'MyPage' })}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계정</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <View style={styles.profileIconContainer}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileEmoji}>👤</Text>
              </View>
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✏️</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{name || '사용자'} 님</Text>
          </View>

          {/* 이메일 (읽기 전용) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>이메일</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{email}</Text>
            </View>
          </View>

          {/* 전화번호 (읽기 전용) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>전화번호</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{phoneNumber}</Text>
            </View>
          </View>

          {/* 비밀번호 수정 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>비밀번호 수정</Text>
            <TextInput
              style={styles.input}
              placeholder="현재 비밀번호"
              placeholderTextColor="#C0C0C0"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, styles.inputSpacing]}
              placeholder="새로운 비밀번호"
              placeholderTextColor="#C0C0C0"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, styles.inputSpacing]}
              placeholder="새로운 비밀번호 확인"
              placeholderTextColor="#C0C0C0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={handleChangePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.changePasswordButtonText}>
                  비밀번호 수정
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 서비스 동의 */}
          <View style={styles.section}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>위치 기반 서비스 동의</Text>
              <Switch
                value={locationServiceEnabled}
                onValueChange={setLocationServiceEnabled}
                trackColor={{ false: '#E0E0E0', true: '#E57373' }}
                thumbColor={locationServiceEnabled ? '#D84A48' : '#f4f3f4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>카메라 이용 동의</Text>
              <Switch
                value={cameraEnabled}
                onValueChange={setCameraEnabled}
                trackColor={{ false: '#E0E0E0', true: '#E57373' }}
                thumbColor={cameraEnabled ? '#D84A48' : '#f4f3f4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleLabel}>판입 알림 서비스 동의</Text>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: '#E0E0E0', true: '#E57373' }}
                thumbColor={notificationEnabled ? '#D84A48' : '#f4f3f4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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
  scrollView: {
    flex: 1,
  },
  profileSection: {
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
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputDisabledText: {
    fontSize: 15,
    color: '#999',
  },
  inputSpacing: {
    marginTop: 12,
  },
  changePasswordButton: {
    backgroundColor: '#D84A48',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
});

export default ProfileEditScreen;
