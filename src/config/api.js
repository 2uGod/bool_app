/**
 * API Configuration
 * 여기서만 IP 주소를 수정하면 됩니다!
 */

// ⚠️ IP 주소 변경 시 여기만 수정하세요
// AWS EC2 Public IP로 설정됨
// NestJS Backend Server (포트 3000)
// EC2 Public IP: 13.125.225.201
export const API_BASE_URL = 'http://13.125.224.210:3000';

// API 엔드포인트
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  PROFILE: '/api/users/profile',
  CHANGE_PASSWORD: '/api/user/password',
  DEACTIVATE: '/api/user/deactivate',

  // Detection & Reports
  DETECT: '/api/detect',
  MY_REPORTS: '/api/reports/my',
  REPORT_DETAIL: '/api/reports',

  // User
  MY_RANK: '/api/user/rank',
  ALL_RANKS: '/api/ranks',
  SHELTERS: '/api/shelters',
  INQUIRY: '/api/inquiry',

  // Fire Detection (Flask)
  HEALTH: '/health',
  FIRE_DETECT: '/detect',
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};
