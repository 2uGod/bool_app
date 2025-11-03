import React, {useState} from 'react';
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
} from 'react-native';
import {findEmail, resetPassword} from '../services/AuthAPI';
import LinearGradient from 'react-native-linear-gradient';

const FindAccountScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'password'

  // 이메일 찾기 상태
  const [findName, setFindName] = useState('');
  const [findPhone, setFindPhone] = useState('');
  const [findLoading, setFindLoading] = useState(false);

  // 비밀번호 재설정 상태
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // 이메일 찾기
  const handleFindEmail = async () => {
    if (!findName.trim() || !findPhone.trim()) {
      Alert.alert('입력 오류', '이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    try {
      setFindLoading(true);
      const response = await findEmail(findName, findPhone);

      if (response.success) {
        Alert.alert(
          '이메일 찾기 성공',
          `가입하신 이메일:\n${response.email}`,
          [
            {text: '로그인하기', onPress: () => navigation.navigate('Login')},
            {text: '확인', style: 'cancel'},
          ],
        );
        // 입력 필드 초기화
        setFindName('');
        setFindPhone('');
      } else {
        Alert.alert('찾기 실패', response.message || '일치하는 계정을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('이메일 찾기 실패:', error);
      Alert.alert('오류', '이메일 찾기 중 오류가 발생했습니다.');
    } finally {
      setFindLoading(false);
    }
  };

  // 비밀번호 재설정
  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('입력 오류', '이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setResetLoading(true);
      const response = await resetPassword(resetEmail);

      if (response.success) {
        Alert.alert(
          '비밀번호 재설정 안내',
          '임시 비밀번호가 이메일로 발송되었습니다.\n이메일을 확인해주세요.',
          [
            {text: '로그인하기', onPress: () => navigation.navigate('Login')},
          ],
        );
        setResetEmail('');
      } else {
        Alert.alert('재설정 실패', response.message || '계정을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      Alert.alert('오류', '비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  const formatPhoneNumber = text => {
    // 숫자만 추출
    const cleaned = text.replace(/\D/g, '');

    // 010-1234-5678 형식으로 변환
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          style={styles.header}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>계정 찾기</Text>
          <Text style={styles.headerSubtitle}>
            이메일을 찾거나 비밀번호를 재설정하세요
          </Text>
        </LinearGradient>

        {/* 탭 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'email' && styles.tabActive]}
            onPress={() => setActiveTab('email')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'email' && styles.tabTextActive,
              ]}>
              이메일 찾기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'password' && styles.tabActive]}
            onPress={() => setActiveTab('password')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'password' && styles.tabTextActive,
              ]}>
              비밀번호 재설정
            </Text>
          </TouchableOpacity>
        </View>

        {/* 이메일 찾기 폼 */}
        {activeTab === 'email' && (
          <View style={styles.formContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📧 가입 시 입력한 정보로 이메일을 찾을 수 있습니다
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                placeholder="홍길동"
                placeholderTextColor="#999"
                value={findName}
                onChangeText={setFindName}
                autoCapitalize="words"
                editable={!findLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>전화번호</Text>
              <TextInput
                style={styles.input}
                placeholder="010-1234-5678"
                placeholderTextColor="#999"
                value={findPhone}
                onChangeText={text => setFindPhone(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={13}
                editable={!findLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, findLoading && styles.buttonDisabled]}
              onPress={handleFindEmail}
              disabled={findLoading}>
              {findLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>이메일 찾기</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 비밀번호 재설정 폼 */}
        {activeTab === 'password' && (
          <View style={styles.formContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                🔐 임시 비밀번호가 이메일로 발송됩니다
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#999"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!resetLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, resetLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={resetLoading}>
              {resetLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>비밀번호 재설정</Text>
              )}
            </TouchableOpacity>

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                💡 임시 비밀번호로 로그인 후{'\n'}
                반드시 비밀번호를 변경해주세요
              </Text>
            </View>
          </View>
        )}

        {/* 하단 링크 */}
        <View style={styles.bottomLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>로그인하기</Text>
          </TouchableOpacity>
          <Text style={styles.linkDivider}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  formContainer: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  infoText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notice: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  noticeText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  linkDivider: {
    fontSize: 14,
    color: '#DDD',
    marginHorizontal: 15,
  },
});

export default FindAccountScreen;
