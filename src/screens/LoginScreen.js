import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from '../services/AuthAPI';
import BackendHealthAPI from '../services/BackendHealthAPI';

const LoginScreen = ({ navigation }) => {
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('naver.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [autoLogin, setAutoLogin] = useState(false);
  const [showDomainPicker, setShowDomainPicker] = useState(false);

  const emailDomains = ['naver.com', 'gmail.com', 'daum.net', 'hanmail.net'];

  // 앱 시작 시 서버 연결 상태 확인
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    setServerStatus('checking');
    const result = await BackendHealthAPI.checkHealth();
    setServerStatus(result.success ? 'online' : 'offline');

    if (!result.success) {
      console.warn('⚠️ 백엔드 서버 연결 실패:', result.error);
    }
  };

  const handleLogin = async () => {
    const email = `${emailId}@${emailDomain}`;

    if (!emailId || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    const result = await AuthAPI.login(email, password);
    setLoading(false);

    if (result.success) {
      // 토큰 저장
      await AsyncStorage.setItem('access_token', result.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));

      // 자동 로그인 설정 저장
      if (autoLogin) {
        await AsyncStorage.setItem('auto_login', 'true');
      }

      Alert.alert('성공', '로그인되었습니다', [
        {
          text: '확인',
          onPress: () => navigation.replace('Main'),
        },
      ]);
    } else {
      Alert.alert('로그인 실패', result.error);
    }
  };

  const handleKakaoLogin = () => {
    Alert.alert('알림', '카카오 로그인 기능은 준비 중입니다.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/applogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.slogan}>
              " 새로운 시선으로 {'\n'} 우리의 것을 지킨다 "
            </Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.formContainer}>
            {/* 이메일 라벨 */}
            <Text style={styles.label}>이메일</Text>

            {/* 이메일 입력 (아이디 + 도메인) */}
            <View style={styles.emailContainer}>
              <TextInput
                style={styles.emailInput}
                placeholder="이메일 아이디"
                placeholderTextColor="#999"
                value={emailId}
                onChangeText={setEmailId}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.atSymbol}>@</Text>
              <TouchableOpacity
                style={styles.domainSelector}
                onPress={() => setShowDomainPicker(true)}
              >
                <Text style={styles.domainText}>{emailDomain}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* 비밀번호 라벨 */}
            <Text style={styles.label}>비밀번호</Text>

            {/* 비밀번호 입력 */}
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* 자동 로그인 체크박스 */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAutoLogin(!autoLogin)}
            >
              <View
                style={[styles.checkbox, autoLogin && styles.checkboxChecked]}
              >
                {autoLogin && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>자동 로그인</Text>
            </TouchableOpacity>

            {/* 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            {/* 회원가입 버튼 */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>회원가입</Text>
            </TouchableOpacity>

            {/* 카카오 로그인 버튼 */}
            <TouchableOpacity
              style={styles.kakaoButton}
              onPress={handleKakaoLogin}
            >
              <Text style={styles.kakaoButtonText}>💬 카카오 로그인</Text>
            </TouchableOpacity>

            {/* 아이디/비밀번호 찾기 */}
            <TouchableOpacity
              style={styles.findButton}
              onPress={() => navigation.navigate('FindAccount')}
            >
              <Text style={styles.findButtonText}>아이디 | 비밀번호 찾기</Text>
            </TouchableOpacity>

            {/* 서버 연결 상태 표시 */}
            <View style={styles.serverStatusContainer}>
              {serverStatus === 'checking' && (
                <View style={styles.serverStatus}>
                  <ActivityIndicator size="small" color="#FF9800" />
                  <Text style={styles.serverStatusText}>
                    서버 연결 확인 중...
                  </Text>
                </View>
              )}
              {serverStatus === 'offline' && (
                <TouchableOpacity
                  style={styles.serverStatus}
                  onPress={checkServerConnection}
                >
                  <Text style={[styles.serverStatusText, styles.serverOffline]}>
                    ⚠️ 서버 연결 실패 (탭하여 재확인)
                  </Text>
                </TouchableOpacity>
              )}
              {serverStatus === 'online' && (
                <Text style={[styles.serverStatusText, styles.serverOnline]}>
                  ✅ 서버 연결됨
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 도메인 선택 모달 */}
      <Modal
        visible={showDomainPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDomainPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDomainPicker(false)}
        >
          <View style={styles.modalContent}>
            {emailDomains.map(domain => (
              <TouchableOpacity
                key={domain}
                style={styles.domainOption}
                onPress={() => {
                  setEmailDomain(domain);
                  setShowDomainPicker(false);
                }}
              >
                <Text style={styles.domainOptionText}>{domain}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  slogan: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  atSymbol: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  domainSelector: {
    flex: 0.3,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666',
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#EB2F30',
    borderColor: '#EB2F30',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
    marginTop: -2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#EB2F30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  kakaoButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  findButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  findButtonText: {
    color: '#999',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  serverStatusContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverStatusText: {
    fontSize: 12,
    color: '#666',
  },
  serverOnline: {
    color: '#4CAF50',
  },
  serverOffline: {
    color: '#F44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: 200,
    maxHeight: 300,
  },
  domainOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  domainOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default LoginScreen;
