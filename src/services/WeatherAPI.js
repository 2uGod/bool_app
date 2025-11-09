/**
 * 기상청 API 서비스
 * 위치 기반 실시간 날씨 정보 조회
 */

const WEATHER_API_KEY =
  '4b268ed7fd6465178564984b72bb2dea2f8658d79bede6993bed1aadba63b6e7';
const WEATHER_API_URL =
  'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

class WeatherAPI {
  /**
   * 위도/경도를 기상청 격자 좌표로 변환
   */
  static convertToGrid(lat, lon) {
    const RE = 6371.00877;
    const GRID = 5.0;
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 126.0;
    const OLAT = 38.0;
    const XO = 43;
    const YO = 136;

    const DEGRAD = Math.PI / 180.0;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn =
      Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
      Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);

    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = (re * sf) / Math.pow(ra, sn);

    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { nx, ny };
  }

  /**
   * 현재 시각 기준 기준 날짜/시간 계산
   */
  static getBaseDateTime() {
    const now = new Date();

    // 1시간 전 데이터 조회 (API 업데이트 지연 고려)
    now.setHours(now.getHours() - 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');

    const baseDate = `${year}${month}${day}`;
    const baseTime = `${hour}00`;

    return { baseDate, baseTime };
  }

  /**
   * 풍향 각도를 한글로 변환
   */
  static convertWindDirection(deg) {
    const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  /**
   * 위도/경도 기반 실시간 날씨 정보 조회
   * @param {number} latitude - 위도
   * @param {number} longitude - 경도
   * @returns {Promise<{humidity: number, windDirection: string, windSpeed: number}>}
   */
  static async getWeather(latitude, longitude) {
    try {
      const { nx, ny } = this.convertToGrid(latitude, longitude);
      const { baseDate, baseTime } = this.getBaseDateTime();

      console.log(
        `[Weather] 날씨 조회: 좌표(${latitude}, ${longitude}) -> 격자(${nx}, ${ny}), 기준시각: ${baseDate} ${baseTime}`,
      );

      const url = `${WEATHER_API_URL}/getUltraSrtNcst?serviceKey=${WEATHER_API_KEY}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

      const response = await fetch(url);
      const data = await response.json();

      console.log('[Weather] API 응답:', data);

      if (
        !data?.response?.body?.items?.item ||
        data.response.body.items.item.length === 0
      ) {
        console.warn(
          '[Weather] 기상청 API 응답 데이터가 없습니다. 기본값을 반환합니다.',
        );
        return this.getDefaultWeather();
      }

      const items = data.response.body.items.item;
      const weatherData = {
        humidity: 50,
        windDirection: '북',
        windSpeed: 0,
      };

      // 응답 데이터 파싱
      items.forEach(item => {
        switch (item.category) {
          case 'REH': // 습도 (%)
            weatherData.humidity = parseFloat(item.obsrValue);
            break;
          case 'VEC': // 풍향 (deg)
            weatherData.windDirection = this.convertWindDirection(
              parseFloat(item.obsrValue),
            );
            break;
          case 'WSD': // 풍속 (m/s)
            weatherData.windSpeed = parseFloat(item.obsrValue);
            break;
        }
      });

      console.log('[Weather] 날씨 조회 성공:', weatherData);
      return weatherData;
    } catch (error) {
      console.error('[Weather] 기상청 API 호출 실패:', error);
      return this.getDefaultWeather();
    }
  }

  /**
   * 기본 날씨 정보 반환 (API 호출 실패 시)
   */
  static getDefaultWeather() {
    return {
      humidity: 50,
      windDirection: '북',
      windSpeed: 2.0,
    };
  }
}

export default WeatherAPI;
