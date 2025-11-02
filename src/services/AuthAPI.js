/**
 * Authentication API Service
 * Bool_final 백엔드와 통신하는 인증 서비스
 */

import {API_BASE_URL} from '../config/api';

class AuthAPI {
  /**
   * 회원가입
   * @param {Object} userData - { email, password, name, phone }
   */
  static async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입 실패');
      }

      console.log('✅ Register success:', data);
      return {success: true, user: data.user, token: data.access_token};
    } catch (error) {
      console.error('❌ Register failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 로그인
   * @param {string} email
   * @param {string} password
   */
  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email, password}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인 실패');
      }

      console.log('✅ Login success:', data);
      return {success: true, user: data.user, token: data.access_token};
    } catch (error) {
      console.error('❌ Login failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 프로필 조회
   * @param {string} token - JWT 토큰
   */
  static async getProfile(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 조회 실패');
      }

      console.log('✅ Profile loaded:', data);
      return {success: true, profile: data};
    } catch (error) {
      console.error('❌ Get profile failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 비밀번호 변경
   * @param {string} token - JWT 토큰
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  static async changePassword(token, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 변경 실패');
      }

      console.log('✅ Password changed');
      return {success: true, message: data.message};
    } catch (error) {
      console.error('❌ Change password failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 회원 탈퇴
   * @param {string} token - JWT 토큰
   * @param {string} password - 확인용 비밀번호
   */
  static async deactivate(token, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({password}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원 탈퇴 실패');
      }

      console.log('✅ Account deactivated');
      return {success: true, message: data.message};
    } catch (error) {
      console.error('❌ Deactivate failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 이메일 찾기
   * @param {string} name
   * @param {string} phone
   */
  static async findEmail(name, phone) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/find-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name, phone}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '이메일 찾기 실패');
      }

      console.log('✅ Email found:', data.email);
      return {success: true, email: data.email};
    } catch (error) {
      console.error('❌ Find email failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 비밀번호 재설정
   * @param {string} email
   * @param {string} phone
   * @param {string} newPassword
   */
  static async resetPassword(email, phone, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 재설정 실패');
      }

      console.log('✅ Password reset');
      return {success: true, message: data.message};
    } catch (error) {
      console.error('❌ Reset password failed:', error);
      return {success: false, error: error.message};
    }
  }
}

export default AuthAPI;
