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
  Modal,
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
  const [showTermsModal, setShowTermsModal] = useState(false);

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
            <Text style={styles.backIcon}>&lt;</Text>
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
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View
                style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
              >
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>약관에 동의하십니까? </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTermsModal(true)}>
              <Text style={styles.termsLink}>(약관 보러가기)</Text>
            </TouchableOpacity>
          </View>

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

      {/* 약관 모달 */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>개인정보 수집 및 이용 동의서</Text>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.articleTitle}>제1조 (개인정보 수집 및 이용 목적)</Text>
              <Text style={styles.articleText}>
                회사는 다음과 같은 목적으로 이용자의 개인정보를 수집 및 이용합니다.
              </Text>
              <Text style={styles.articleText}>
                • 서비스 제공: 위치 기반 날씨 정보 제공 및 화재 감지 기능 구현
              </Text>
              <Text style={styles.articleText}>
                • 긴급 구조 요청: 화재 감지 시 소방서 측에 이용자의 신원 및 위치 정보 전달
              </Text>
              <Text style={styles.articleText}>
                • 회원 관리: 서비스 이용에 따른 본인 식별, 가입 및 탈퇴 의사 확인
              </Text>
              <Text style={styles.articleText}>
                • 서비스 개선: 앱의 안정성 확보 및 기능 오류 개선
              </Text>

              <Text style={styles.articleTitle}>제2조 (수집하는 개인정보 항목)</Text>
              <Text style={styles.articleText}>
                회사는 원활한 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
              </Text>
              <Text style={styles.articleText}>
                • 필수 항목: 이름, 휴대전화 번호, 주소
              </Text>
              <Text style={styles.articleText}>
                • 민감 정보: GPS 데이터를 활용한 위치 정보, 카메라 데이터를 활용한 화재 감지 정보
              </Text>
              <Text style={styles.articleText}>
                • 자동 수집 정보: 기기 모델명, OS 정보 등 서비스 이용 과정에서 자동으로 생성되는 정보
              </Text>

              <Text style={styles.articleTitle}>제3조 (개인정보의 보유 및 이용 기간)</Text>
              <Text style={styles.articleText}>
                이용자의 개인정보는 회원 탈퇴 시 또는 동의 철회 시까지 보유 및 이용됩니다.{'\n'}
                다만, 관련 법령의 규정에 따라 보존할 필요가 있는 경우 해당 법령이 정한 기간 동안 안전하게 보관합니다.
              </Text>

              <Text style={styles.articleTitle}>제4조 (개인정보 제3자 제공에 대한 동의)</Text>
              <Text style={styles.articleText}>
                회사는 이용자의 생명과 안전을 위해 긴급 상황 발생 시 아래와 같이 개인정보를 제공합니다.
              </Text>
              <Text style={styles.articleText}>
                • 제공받는 자: 관할 소방서 및 긴급구조 기관
              </Text>
              <Text style={styles.articleText}>
                • 제공하는 정보: 이름, 연락처, 주소, GPS 위치
              </Text>
              <Text style={styles.articleText}>
                • 제공 목적: 화재 신고 접수 및 신속한 출동을 위함
              </Text>

              <Text style={styles.articleTitle}>제5조 (동의를 거부할 권리 및 불이익)</Text>
              <Text style={styles.articleText}>
                이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 필수 항목에 대한 동의를 거부할 경우, 앱의 회원 가입 및 핵심 기능(화재 감지, 긴급 구조 요청) 이용이 불가능합니다.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 30,
    color: '#333',
    marginRight: 8,
  },
  backText: {
    fontSize: 20,
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
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    lineHeight: 14,
    marginTop: -2,
  },
  termsText: {
    fontSize: 14,
    color: '#333',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    maxHeight: '70%',
    marginBottom: 15,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  articleText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalButton: {
    backgroundColor: '#EB2F30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
