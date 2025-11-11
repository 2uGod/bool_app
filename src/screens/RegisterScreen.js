import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from '../services/AuthAPI';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // 유효성 검사
    if (!email || !password || !name || !phone) {
      Alert.alert('오류', '모든 필드를 입력해주세요');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('오류', '약관에 동의해주세요');
      return;
    }

    setLoading(true);
    const result = await AuthAPI.register({
      email,
      password,
      name,
      phone,
    });
    setLoading(false);

    if (result.success) {
      // 토큰 저장
      await AsyncStorage.setItem('access_token', result.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));

      Alert.alert('성공', '회원가입이 완료되었습니다', [
        {
          text: '확인',
          onPress: () => navigation.replace('Main'),
        },
      ]);
    } else {
      Alert.alert('회원가입 실패', result.error);
    }
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
          </View>

          {/* 뒤로가기 버튼 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>회원가입</Text>
          </TouchableOpacity>

          {/* 이름 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력해 주세요"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 이메일 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력해 주세요"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 전화번호 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>전화번호</Text>
            <View style={styles.phoneContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="010 - #### - ####"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.verifyButton}>
                <Text style={styles.verifyButtonText}>인증번호</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력해 주세요"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 재확인</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 한 번 입력해 주세요"
              placeholderTextColor="#999"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
            />
          </View>

          {/* 약관 동의 */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              약관에 동의하십니까?{' '}
              <Text style={styles.termsLink}>(약관 보러가기)</Text>
            </Text>
          </TouchableOpacity>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>다음</Text>
            )}
          </TouchableOpacity>

          {/* 로그인으로 이동 */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLinkBold}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoImage: {
    width: 120,
    height: 50,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 5,
  },
  backIcon: {
    fontSize: 22,
    color: '#333',
    marginRight: 8,
  },
  backText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
  },
  verifyButton: {
    backgroundColor: '#EB2F30',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 25,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
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
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  termsLink: {
    color: '#EB2F30',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#EB2F30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#EB2F30',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
