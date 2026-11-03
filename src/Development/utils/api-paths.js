import institutionData from '../constants';

const apiPaths = {
  getProducts: `/any/products/${institutionData.InstitutionId}`,
  getInstructors: `/any/instructor-list/${institutionData.InstitutionId}`,
  getUpcomingSchedule: `/user/upcoming-schedule/${institutionData.InstitutionId}`,
  getPreviousScedule: `/user/previous-schedule/${institutionData.InstitutionId}`,
  getMembers: `/admin/profile-list/${institutionData.InstitutionId}`,
  getStreak: `/user/streak-get/${institutionData.InstitutionId}`,
  getRating: `/admin/rating-fetch/${institutionData.InstitutionId}`,
  getUserLocation: "/user/check-user-location",
  listAttendance: `/admin/list-attendance/${institutionData.InstitutionId}`,
  getInstructorSubscriptions: `/instructor/subscriptions/${institutionData.InstitutionId}`,
  getCurrentInstructorOfHybridPage: `/instructor/current-instructor/${institutionData.InstitutionId}`,
  achievementCertificate: `/milestone-certificate/${institutionData.InstitutionId}`,
  macyClassVideos: `/user/videos`,
  macyClassVideoUrl: `/user/videos/url`,
  createShortLink: "/hybrid/share-link",
  getInstructorDashboard: `/instructor/dashboard/${institutionData.InstitutionId}`,
};

export default apiPaths;