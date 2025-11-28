/**
 * Shelter API Service
 * 행정안전부 민방위대피소 API (공공데이터포털)
 */
const PUBLIC_DATA_API_KEY = '34cbc6daffd0aa8823a0113e1093ee967f661ada33889aa9f7a32aeea4eb0778';
const SHELTER_API_URL = 'https://api.odcloud.kr/api/civildefense/v1/shelter';

class ShelterAPI {
  static async getShelters(latitude, longitude, radius = 5000) {
    try {
      console.log('🏠 대피소 데이터 조회 (실제 API)');
      console.log(`📍 현재 위치: ${latitude}, ${longitude}`);

      // API 파라미터 설정 (페이지당 100개씩 가져오기)
      const params = new URLSearchParams({
        serviceKey: PUBLIC_DATA_API_KEY,
        page: '1',
        perPage: '1000', // 더 많은 대피소 가져오기
        returnType: 'JSON',
      });

      const url = `${SHELTER_API_URL}?${params.toString()}`;
      console.log('🏠 대피소 API 호출');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📡 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📦 전체 대피소 데이터 개수: ${data.totalCount || 0}`);
      console.log(`📦 현재 페이지 데이터 개수: ${data.currentCount || 0}`);

      if (!data.data || data.data.length === 0) {
        console.log('⚠️ 대피소 목록이 비어있습니다.');
        return { success: true, shelters: [] };
      }

      // 현재 위치 기준으로 거리 계산 및 필터링
      const nearbyShelters = data.data
        .map(shelter => {
          // 위도/경도 파싱 (EPSG4326 좌표계 사용)
          const shelterLat = parseFloat(shelter['위도(EPSG4326)']);
          const shelterLon = parseFloat(shelter['경도(EPSG4326)']);

          if (isNaN(shelterLat) || isNaN(shelterLon)) {
            return null;
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            shelterLat,
            shelterLon,
          );

          return {
            id: shelter['번호'] || Math.random().toString(),
            name: shelter['시설명'] || '대피소',
            address: shelter['도로명전체주소'] || shelter['소재지전체주소'] || '',
            latitude: shelterLat,
            longitude: shelterLon,
            capacity: parseInt(shelter['최대수용인원']) || 0,
            type: getShelterType(shelter['시설구분']),
            distance: distance,
            area: parseFloat(shelter['면적']) || 0,
            facilityType: shelter['시설구분'] || '',
            location: shelter['시설위치'] || '',
            managementNumber: shelter['관리번호'] || '',
          };
        })
        .filter(shelter => shelter !== null)
        .filter(shelter => shelter.distance <= radius / 1000) // radius를 km로 변환
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 50); // 가까운 50개만 반환

      console.log(`✅ 주변 대피소 ${nearbyShelters.length}개 조회 완료`);

      return {
        success: true,
        shelters: nearbyShelters,
      };
    } catch (error) {
      console.error('❌ 대피소 조회 실패:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * XML을 JSON으로 파싱
 */
function parseXMLToJSON(xmlText) {
  return new Promise((resolve, reject) => {
    parseString(xmlText, { explicitArray: true }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function getShelterType(name) {
  if (!name) return '임시대피소';
  if (name.includes('학교') || name.includes('체육관')) return '실내체육관';
  if (name.includes('공원') || name.includes('광장')) return '야외대피소';
  if (
    name.includes('주민센터') ||
    name.includes('시청') ||
    name.includes('구청')
  )
    return '공공시설';
  return '임시대피소';
}

export default ShelterAPI;
