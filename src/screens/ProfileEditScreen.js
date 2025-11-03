import React, {useState, useEffect} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthAPI from '../services/AuthAPI';
import LinearGradient from 'react-native-linear-gradient';

const ProfileEditScreen = ({navigation}) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const userDataStr = await AsyncStorage.getItem('user');

      if (!token || !userDataStr) {
        Alert.alert('오류', '로그인이 필요합니다.', [
          {text: '확인', onPress: () => navigation.navigate('Login')},
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

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요.');
      return false;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('입력 오류', '전화번호를 입력해주세요.');
      return false;
    }

    // 전화번호 형식 검증 (010-1234-5678)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('입력 오류', '올바른 전화번호 형식을 입력해주세요. (010-1234-5678)');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.navigate('Login');
        return;
      }

      const response = await AuthAPI.updateProfile(token, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (response.success) {
        // 업데이트된 사용자 정보를 AsyncStorage에 저장
        const updatedUser = response.user;
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        Alert.alert(
          '수정 완료',
          '프로필이 성공적으로 수정되었습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('수정 실패', response.error || '프로필 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      Alert.alert('오류', '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>프로필 정보 불러오는 중...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>프로필 수정</Text>
          <Text style={styles.headerSubtitle}>
            개인정보를 수정할 수 있습니다
          </Text>
        </LinearGradient>

        {/* 폼 */}
        <View style={styles.formContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 이메일은 변경할 수 없습니다
            </Text>
          </View>

          {/* 이메일 (읽기 전용) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{email}</Text>
            </View>
            <Text style={styles.helpText}>이메일은 변경할 수 없습니다</Text>
          </View>

          {/* 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={styles.input}
              placeholder="홍길동"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!saving}
            />
          </View>

          {/* 전화번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호 *</Text>
            <TextInput
              style={styles.input}
              placeholder="010-1234-5678"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={text => setPhoneNumber(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              maxLength={13}
              editable={!saving}
            />
            <Text style={styles.helpText}>010-1234-5678 형식으로 입력</Text>
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>저장하기</Text>
            )}
          </TouchableOpacity>

          {/* 안내 */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              🔒 비밀번호 변경은 마이페이지에서{'\n'}
              별도로 진행할 수 있습니다
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputDisabledText: {
    fontSize: 16,
    color: '#999',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
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
});

export default ProfileEditScreen;
