/**
 * User API Service
 * 신고 내역, 계급, 문의 등 사용자 관련 API
 */

import {API_BASE_URL} from '../config/api';

class UserAPI {
  /**
   * 화재 감지 및 신고 (메인 API)
   * @param {string} token - JWT 토큰
   * @param {string} imageUri - 이미지 URI
   * @param {Object} locationData - { latitude, longitude, address }
   */
  static async detectAndReport(token, imageUri, locationData) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'fire.jpg',
      });

      if (locationData) {
        formData.append('latitude', locationData.latitude);
        formData.append('longitude', locationData.longitude);
        formData.append('address', locationData.address || '');
      }

      const response = await fetch(`${API_BASE_URL}/api/reports/detect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // 응답이 JSON인지 확인
      let data;
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (isJson) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('❌ JSON parse error:', jsonError);
          throw new Error('서버 응답을 파싱할 수 없습니다.');
        }
      } else {
        const text = await response.text();
        throw new Error(`서버 오류: ${response.status} - ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `서버 오류: ${response.status}`;
        throw new Error(errorMsg);
      }

      console.log('✅ Fire detection and report:', data);
      return {success: true, result: data};
    } catch (error) {
      console.error('❌ Detect and report failed:', error);

      // 네트워크 연결 오류 체크
      if (error.message.includes('Network request failed') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: `서버에 연결할 수 없습니다.\n\n확인 사항:\n1. 백엔드 서버가 실행 중인지 확인 (포트 3000)\n2. 같은 WiFi 네트워크에 연결되어 있는지 확인\n3. IP 주소가 올바른지 확인 (현재: ${API_BASE_URL})`
        };
      }

      return {success: false, error: error.message};
    }
  }

  /**
   * 내 신고 내역 조회
   * @param {string} token - JWT 토큰
   */
  static async getMyReports(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/my`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '신고 내역 조회 실패');
      }

      console.log('✅ My reports loaded:', data);
      return {success: true, reports: data.reports};
    } catch (error) {
      console.error('❌ Get reports failed:', error);
      
      // 네트워크 연결 오류 체크
      if (error.message.includes('Network request failed') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('ECONNREFUSED')) {
        return {
          success: false, 
          error: `서버 연결 실패\n\n서버가 실행 중인지 확인해주세요.\n(현재 IP: ${API_BASE_URL})`
        };
      }
      
      return {success: false, error: error.message};
    }
  }

  /**
   * 신고 상세 조회
   * @param {string} token - JWT 토큰
   * @param {number} reportId - 신고 ID
   */
  static async getReportDetail(token, reportId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '신고 상세 조회 실패');
      }

      console.log('✅ Report detail loaded:', data);
      return {success: true, report: data};
    } catch (error) {
      console.error('❌ Get report detail failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 내 계급 정보 조회
   * @param {string} token - JWT 토큰
   */
  static async getMyRank(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/rank`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '계급 정보 조회 실패');
      }

      console.log('✅ Rank info loaded:', data);
      return {success: true, rankInfo: data};
    } catch (error) {
      console.error('❌ Get rank failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 모든 계급 정보 조회
   */
  static async getAllRanks() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ranks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '계급 목록 조회 실패');
      }

      console.log('✅ All ranks loaded:', data);
      return {success: true, ranks: data};
    } catch (error) {
      console.error('❌ Get all ranks failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 대피소 조회 (현재 위치 기반)
   * @param {number} latitude
   * @param {number} longitude
   */
  static async getShelters(latitude, longitude) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/shelters?latitude=${latitude}&longitude=${longitude}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '대피소 조회 실패');
      }

      console.log('✅ Shelters loaded:', data);
      return {success: true, shelters: data};
    } catch (error) {
      console.error('❌ Get shelters failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 문의사항 등록
   * @param {string} token - JWT 토큰
   * @param {string} title - 제목
   * @param {string} content - 내용
   */
  static async submitInquiry(token, title, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, content}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '문의 등록 실패');
      }

      console.log('✅ Inquiry submitted:', data);
      return {success: true, inquiry: data.inquiry};
    } catch (error) {
      console.error('❌ Submit inquiry failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 내 문의사항 목록 조회
   * @param {string} token - JWT 토큰
   */
  static async getMyInquiries(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '문의 목록 조회 실패');
      }

      console.log('✅ Inquiries loaded:', data);
      return {success: true, inquiries: data};
    } catch (error) {
      console.error('❌ Get inquiries failed:', error);
      return {success: false, error: error.message};
    }
  }
}

// Named exports for convenience
export const detectAndReport = UserAPI.detectAndReport.bind(UserAPI);
export const getMyReports = UserAPI.getMyReports.bind(UserAPI);
export const getReportDetail = UserAPI.getReportDetail.bind(UserAPI);
export const getMyRank = UserAPI.getMyRank.bind(UserAPI);
export const getAllRanks = UserAPI.getAllRanks.bind(UserAPI);
export const getShelters = UserAPI.getShelters.bind(UserAPI);
export const submitInquiry = UserAPI.submitInquiry.bind(UserAPI);
export const getMyInquiries = UserAPI.getMyInquiries.bind(UserAPI);

export default UserAPI;
