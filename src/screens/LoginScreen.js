import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from '../services/AuthAPI';
import BackendHealthAPI from '../services/BackendHealthAPI';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

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
    if (!email || !password) {
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        {/* 로고 */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🔥 BOOL</Text>
          <Text style={styles.slogan}>새로운 시선으로,{'\n'}우리의 것을 지킨다</Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerButtonText}>회원가입</Text>
          </TouchableOpacity>

          {/* 아이디/비밀번호 찾기 */}
          <TouchableOpacity
            style={styles.findButton}
            onPress={() => navigation.navigate('FindAccount')}>
            <Text style={styles.findButtonText}>
              아이디 | 비밀번호 찾기
            </Text>
          </TouchableOpacity>

          {/* 서버 연결 상태 표시 */}
          <View style={styles.serverStatusContainer}>
            {serverStatus === 'checking' && (
              <View style={styles.serverStatus}>
                <ActivityIndicator size="small" color="#FF9800" />
                <Text style={styles.serverStatusText}>서버 연결 확인 중...</Text>
              </View>
            )}
            {serverStatus === 'offline' && (
              <TouchableOpacity 
                style={styles.serverStatus}
                onPress={checkServerConnection}>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 20,
  },
  slogan: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    backgroundColor: '#FF4500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    borderWidth: 1,
    borderColor: '#FF4500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  registerButtonText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  findButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  findButtonText: {
    color: '#666',
    fontSize: 14,
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
});

export default LoginScreen;
