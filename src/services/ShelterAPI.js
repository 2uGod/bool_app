/**
 * 행정안전부 민방위대피시설 API 서비스
 */

const API_KEY =
  '4b268ed7fd6465178564984b72bb2dea2f8658d79bede6993bed1aadba63b6e7';
const BASE_URL = 'http://api.odcloud.kr/api/civildefense/v1/shelter';

class ShelterAPI {
  /**
   * 단일 페이지 대피소 목록 조회
   * @param {number} page - 페이지 번호 (기본값: 1)
   * @param {number} perPage - 페이지당 데이터 수 (기본값: 1000)
   * @returns {Promise<Object>} API 응답
   */
  static async getSheltersPage(page = 1, perPage = 1000) {
    try {
      const url = `${BASE_URL}?page=${page}&perPage=${perPage}&serviceKey=${API_KEY}`;

      console.log(`📡 대피소 데이터 요청 중... (페이지 ${page})`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || [],
        totalCount: data.totalCount || 0,
        currentCount: data.currentCount || 0,
        matchCount: data.matchCount || 0,
        page: data.page || page,
        perPage: data.perPage || perPage,
      };
    } catch (error) {
      console.error(`❌ 페이지 ${page} 조회 실패:`, error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * 전국 모든 대피소 목록 조회 (모든 페이지 순회)
   * @returns {Promise<Object>} 전체 대피소 데이터
   */
  static async getShelters() {
    try {
      console.log('📡 전국 대피소 데이터 로딩 시작...');
      const allShelters = [];
      let page = 1;
      const perPage = 1000;
      let totalCount = 0;

      // 첫 페이지 조회로 전체 개수 파악
      const firstPage = await this.getSheltersPage(page, perPage);
      if (!firstPage.success) {
        return firstPage;
      }

      allShelters.push(...firstPage.data);
      totalCount = firstPage.totalCount || firstPage.matchCount || 0;
      console.log(`✅ 전체 대피소 수: ${totalCount}개`);
      console.log(`✅ 페이지 ${page}: ${firstPage.data.length}개 수신`);

      // 첫 번째 항목의 필드명 확인
      if (firstPage.data.length > 0) {
        console.log(
          '📋 첫 번째 대피소 데이터 샘플:',
          JSON.stringify(firstPage.data[0], null, 2),
        );
      }

      // 나머지 페이지 순회
      const totalPages = Math.ceil(totalCount / perPage);
      console.log(`📄 총 페이지 수: ${totalPages}`);

      for (page = 2; page <= totalPages; page++) {
        const pageResult = await this.getSheltersPage(page, perPage);
        if (pageResult.success && pageResult.data.length > 0) {
          allShelters.push(...pageResult.data);
          console.log(`✅ 페이지 ${page}: ${pageResult.data.length}개 수신 (누적: ${allShelters.length}개)`);
        } else {
          console.warn(`⚠️ 페이지 ${page} 조회 실패 또는 데이터 없음`);
        }

        // API 부하 방지를 위한 약간의 딜레이
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ 전국 대피소 데이터 로딩 완료: 총 ${allShelters.length}개`);

      return {
        success: true,
        data: allShelters,
        totalCount: allShelters.length,
      };
    } catch (error) {
      console.error('❌ 전체 대피소 데이터 조회 실패:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * 두 지점 간 거리 계산 (Haversine formula)
   * @param {number} lat1 - 위도1
   * @param {number} lon1 - 경도1
   * @param {number} lat2 - 위도2
   * @param {number} lon2 - 경도2
   * @returns {number} 거리(km)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * 사용자 위치 기반 가까운 대피소 정렬
   * @param {Array} shelters - 대피소 목록
   * @param {number} userLat - 사용자 위도
   * @param {number} userLon - 사용자 경도
   * @returns {Array} 거리순으로 정렬된 대피소 목록
   */
  static sortByDistance(shelters, userLat, userLon) {
    return shelters
      .map(shelter => {
        // API 명세서에 따른 정확한 필드명 사용
        const lat = parseFloat(
          shelter['위도(EPSG4326)'] || shelter['위도'] || shelter.latitude || 0,
        );
        const lon = parseFloat(
          shelter['경도(EPSG4326)'] ||
            shelter['경도'] ||
            shelter.longitude ||
            0,
        );

        // 좌표가 유효한지 확인
        if (lat === 0 || lon === 0) {
          console.warn('⚠️ 유효하지 않은 좌표:', shelter['시설명']);
        }

        const distance = this.calculateDistance(userLat, userLon, lat, lon);

        return {
          ...shelter,
          distance: distance,
          distanceText:
            distance < 1
              ? `${Math.round(distance * 1000)}m`
              : `${distance.toFixed(2)}km`,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * 반경 내 대피소 필터링
   * @param {Array} shelters - 대피소 목록
   * @param {number} userLat - 사용자 위도
   * @param {number} userLon - 사용자 경도
   * @param {number} radiusKm - 반경 (km)
   * @returns {Array} 필터링된 대피소 목록
   */
  static filterByRadius(shelters, userLat, userLon, radiusKm = 10) {
    return this.sortByDistance(shelters, userLat, userLon).filter(
      shelter => shelter.distance <= radiusKm,
    );
  }
}

export default ShelterAPI;
