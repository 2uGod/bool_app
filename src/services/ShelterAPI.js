/**
 * Shelter API Service
 * 행정안전부 민방위대피소 API + 카카오 지오코딩
 */
import { parseString } from 'react-native-xml2js';
const PUBLIC_DATA_API_KEY = 'RD9SFQPZ-RD9S-RD9S-RD9S-RD9SFQPZHY';
const SHELTER_API_URL = 'http://safemap.go.kr/openapi2/IF_0122';
const KAKAO_API_KEY = 'e09f9f4073488d1ef17cef8618960d76'; // 기존 앱에서 사용

class ShelterAPI {
  static async getShelters(latitude, longitude, radius = 5000) {
    try {
      const params = new URLSearchParams({
        serviceKey: decodeURIComponent(PUBLIC_DATA_API_KEY),
        pageNo: '1',
        numOfRows: '100',
        // type 파라미터 제거 (XML로 받기)
      });

      const url = `${SHELTER_API_URL}?${params.toString()}`;
      console.log('🏠 대피소 API 호출:', url);

      const response = await fetch(url, {
        method: 'GET',
      });

      console.log('📡 응답 상태:', response.status);

      // 응답을 텍스트로 받기
      const responseText = await response.text();
      console.log(
        '📡 API 원본 응답 (처음 500자):',
        responseText.substring(0, 500),
      );

      // XML을 JSON으로 파싱
      const data = await parseXMLToJSON(responseText);
      console.log('📡 파싱된 데이터:', JSON.stringify(data, null, 2));

      // XML 에러 체크
      if (data.response?.header?.[0]?.resultCode?.[0] !== '00') {
        const errorMsg =
          data.response?.header?.[0]?.resultMsg?.[0] || '알 수 없는 오류';
        throw new Error(`API 오류: ${errorMsg}`);
      }

      // 대피소 목록 추출
      let shelterList = [];
      if (data.response?.body?.[0]?.items?.[0]?.item) {
        shelterList = data.response.body[0].items[0].item;
      }

      console.log(`📦 대피소 원본 데이터 개수: ${shelterList.length}`);

      if (shelterList.length === 0) {
        console.log('⚠️ 대피소 목록이 비어있습니다.');
        return { success: true, shelters: [] };
      }

      // 현재 위치 기준으로 거리 계산 및 필터링
      const nearbyShelters = shelterList
        .map(shelter => {
          const shelterLat = parseFloat(shelter.ycord?.[0]);
          const shelterLon = parseFloat(shelter.xcord?.[0]);

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
            id:
              shelter.id?.[0] || shelter.rnum?.[0] || Math.random().toString(),
            name: shelter.vt_acmdfclty_nm?.[0] || '대피소',
            address: shelter.dtl_adres?.[0] || shelter.rdnmadr_nm?.[0] || '',
            latitude: shelterLat,
            longitude: shelterLon,
            capacity: parseInt(shelter.xcptn_psvr_nmpr?.[0]) || 0,
            type: getShelterType(shelter.vt_acmdfclty_nm?.[0]),
            distance: distance,
            area: parseFloat(shelter.ar?.[0]) || 0,
            facilityType: shelter.fclty_se_nm?.[0] || '',
            managementAgency: shelter.mngps_nm?.[0] || '',
          };
        })
        .filter(shelter => shelter !== null)
        .filter(shelter => shelter.distance <= radius / 1000)
        .sort((a, b) => a.distance - b.distance);

      console.log(`✅ 대피소 ${nearbyShelters.length}개 조회 완료`);

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
