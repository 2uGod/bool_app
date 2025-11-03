/**
 * Backend Health Check API Service
 * NestJS 백엔드 서버 상태 확인
 */

import {API_BASE_URL} from '../config/api';

class BackendHealthAPI {
  /**
   * 백엔드 서버 상태 확인
   * @returns {Promise<{success: boolean, error?: string, data?: any}>}
   */
  static async checkHealth() {
    // 타임아웃을 위해 AbortController 사용 (AbortSignal.timeout은 React Native에서 지원 안 됨)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // NestJS 백엔드는 /api 엔드포인트로 확인 가능
      const response = await fetch(`${API_BASE_URL}/api`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json().catch(() => ({status: 'ok'}));
      console.log('✅ Backend server is available:', data);
      return {success: true, data};
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Backend health check failed:', error);
      
      // 네트워크 오류 상세 정보
      let errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        errorMessage = '서버 응답 시간 초과 (5초)';
      } else if (error.message.includes('Network request failed') || 
                 error.message.includes('Failed to fetch') ||
                 error.message.includes('ECONNREFUSED')) {
        errorMessage = `서버 연결 실패\n\n현재 시도한 주소: ${API_BASE_URL}/api\n\n확인 사항:\n1. 백엔드 서버가 실행 중인지 확인\n2. 같은 WiFi 네트워크에 연결되어 있는지 확인\n3. IP 주소가 올바른지 확인`;
      }
      
      return {success: false, error: errorMessage};
    }
  }

  /**
   * 간단한 연결 테스트 (헤더만 확인)
   * @returns {Promise<boolean>}
   */
  static async quickTest() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${API_BASE_URL}/api`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }
}

export default BackendHealthAPI;

