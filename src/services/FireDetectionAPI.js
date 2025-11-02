/**
 * Fire Detection API Service
 * Flask 서버와 통신하는 서비스
 */

import {API_BASE_URL} from '../config/api';

class FireDetectionAPI {
  /**
   * 서버 상태 확인
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Server health:', data);
      return {success: true, data};
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * 화재 감지 API 호출
   * @param {string} imageUri - 이미지 파일 경로 (file:// URI)
   * @param {object} location - 위치 정보 {latitude, longitude, address}
   * @param {string} token - 인증 토큰
   */
  static async detectFire(imageUri, location = null, token = null) {
    try {
      console.log('📤 Uploading image to NestJS API:', imageUri);

      // FormData 생성
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'fire_detection.jpg',
      });

      // 위치 정보 추가 (기본값 사용)
      const lat = location?.latitude || 37.5665;
      const lng = location?.longitude || 126.9780;
      const addr = location?.address || '위치 정보 없음';

      formData.append('latitude', lat.toString());
      formData.append('longitude', lng.toString());
      formData.append('address', addr);

      // API 호출 (NestJS를 통한 화재 감지)
      const url = `${API_BASE_URL}/api/reports/detect`;

      const headers = {
        'Content-Type': 'multipart/form-data',
      };

      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Detection result:', result);

      // 결과를 앱 포맷으로 변환
      return this.transformResult(result);
    } catch (error) {
      console.error('❌ API call failed:', error);
      throw error;
    }
  }

  /**
   * API 응답을 앱 내부 포맷으로 변환
   */
  static transformResult(apiResult) {
    const {
      status,
      has_fire,
      has_smoke,
      boxes,
      scene_analysis,
      annotated_image,
      image_size,
      timestamp,
    } = apiResult;

    // 화재 감지 여부
    const fireDetected = has_fire || has_smoke;

    // 카테고리 매핑
    let category = 'no_fire';
    if (status === 'wildfire') {
      category = 'wildfire';
    } else if (status === 'urban_fire') {
      category = 'urban_fire';
    } else if (status === 'uncertain') {
      category = 'uncertain';
    }

    // 박스 데이터 변환
    const detections = boxes.map(box => ({
      class: box.class,
      confidence: box.confidence,
      bbox: {
        x: box.x1,
        y: box.y1,
        width: box.x2 - box.x1,
        height: box.y2 - box.y1,
      },
    }));

    // Scene 분석 정보
    const sceneInfo = scene_analysis
      ? {
          sceneType: scene_analysis.scene_type,
          wildfireProb: scene_analysis.wildfire_prob,
          urbanProb: scene_analysis.urban_prob,
          confidence: scene_analysis.confidence,
        }
      : null;

    return {
      fireDetected,
      category,
      confidence: sceneInfo ? sceneInfo.confidence : 0,
      detections,
      sceneInfo,
      imageSize: image_size, // 이미지 크기 정보
      annotatedImage: annotated_image, // base64 string
      timestamp: new Date(timestamp * 1000).toISOString(),
      apiResponse: apiResult, // 원본 응답 보관
    };
  }

  /**
   * 테스트용 시뮬레이션 데이터 생성
   */
  static async simulateDetection() {
    console.log('🎲 Using simulation mode (server not available)');

    await new Promise(resolve => setTimeout(resolve, 500)); // 지연 시뮬레이션

    const hasFireSmoke = Math.random() > 0.7;

    if (!hasFireSmoke) {
      return {
        fireDetected: false,
        category: 'no_fire',
        confidence: 0.0,
        detections: [],
        sceneInfo: null,
        timestamp: new Date().toISOString(),
        simulation: true,
      };
    }

    const categories = ['wildfire', 'urban_fire', 'uncertain'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      fireDetected: true,
      category,
      confidence: 0.75 + Math.random() * 0.2,
      detections: [
        {
          class: Math.random() > 0.5 ? 'fire' : 'smoke',
          confidence: 0.8 + Math.random() * 0.15,
          bbox: {
            x: Math.random() * 200,
            y: Math.random() * 200,
            width: 100 + Math.random() * 100,
            height: 100 + Math.random() * 100,
          },
        },
      ],
      sceneInfo: {
        sceneType: category,
        wildfireProb: category === 'wildfire' ? 0.8 : 0.1,
        urbanProb: category === 'urban_fire' ? 0.9 : 0.2,
        confidence: 0.85,
      },
      timestamp: new Date().toISOString(),
      simulation: true,
    };
  }
}

export default FireDetectionAPI;
