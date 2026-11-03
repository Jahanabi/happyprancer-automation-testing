/**
 * Happy Prancer Automation & AI Test Generation Configuration
 */

export interface ModuleMapping {
  name: string;
  category: 'public' | 'private' | 'auth' | 'core';
  patterns: RegExp[];
  pageObject: string;
  route: string;
  description: string;
  criticalSelectors: { [key: string]: string };
}

export const HAPPY_PRANCER_MODULES: Record<string, ModuleMapping> = {
  login: {
    name: 'Login',
    category: 'auth',
    patterns: [
      /src\/Development\/pages\/Auth\/Login/i,
      /src\/Development\/pages\/Auth\/ForgotPassword/i,
      /src\/Development\/pages\/Auth\/dev/i,
      /src\/Development\/pages\/Auth\/phone/i,
    ],
    pageObject: 'LoginPage',
    route: '/login',
    description: 'User authentication, email login, Google OAuth, password recovery, session handling',
    criticalSelectors: {
      emailInput: '#login-email',
      passwordInput: '#login-password',
      continueButton: 'button:has-text("Continue")',
      forgotPasswordLink: 'a[href="/forgot-password"]',
      signupLink: 'a[href="/signup"]',
    },
  },
  signup: {
    name: 'Signup',
    category: 'auth',
    patterns: [
      /src\/Development\/pages\/Auth\/Signup/i,
      /src\/Development\/pages\/Auth\/phone/i,
    ],
    pageObject: 'SignupPage',
    route: '/signup',
    description: 'New account registration, name, country, phone, password, referral codes, plan preselection',
    criticalSelectors: {
      nameInput: '#signup-name',
      emailInput: '#signup-email',
      countrySelect: '#signup-country',
      phoneInput: '#signup-phone',
      passwordInput: '#signup-password',
      referralInput: '#signup-referral',
      createAccountButton: 'button:has-text("Create Account")',
    },
  },
  home: {
    name: 'Home',
    category: 'public',
    patterns: [
      /src\/Development\/pages\/public\/Home/i,
      /src\/App\.jsx/i,
      /src\/Development\/components\/Header/i,
      /src\/Development\/components\/Footer/i,
    ],
    pageObject: 'HomePage',
    route: '/',
    description: 'Landing hero, class highlights, perks, plans/subscriptions, FAQs, testimonials',
    criticalSelectors: {
      heroHeading: 'h1, h2',
      pricingPlans: 'text=Membership Plan',
      navigationBar: 'nav',
      loginNavBtn: 'a[href="/login"]',
    },
  },
  instructors: {
    name: 'Instructors',
    category: 'public',
    patterns: [
      /src\/Development\/pages\/public\/Instructors/i,
      /src\/Development\/pages\/private\/Dashboard\/UsersList\/InstructorCalendarPage/i,
    ],
    pageObject: 'InstructorsPage',
    route: '/instructors',
    description: 'Instructor directory, instructor cards, profile modal, experience & ratings',
    criticalSelectors: {
      instructorCard: '[data-testid="instructor-card"], .instructor-card, div.cursor-pointer',
      searchBar: 'input[placeholder*="search" i]',
    },
  },
  gallery: {
    name: 'Gallery',
    category: 'public',
    patterns: [
      /src\/Development\/pages\/public\/Gallery/i,
    ],
    pageObject: 'GalleryPage',
    route: '/gallery',
    description: 'Fitness and dance photo gallery, image modals, descriptions, alt text verification',
    criticalSelectors: {
      galleryImage: 'img[alt*="HappyPrancer"], img[alt*="Instructor"], div.gallery-grid img',
    },
  },
  schedule: {
    name: 'Schedule',
    category: 'public',
    patterns: [
      /src\/Development\/pages\/public\/Schedule/i,
    ],
    pageObject: 'SchedulePage',
    route: '/schedule',
    description: 'Weekly dance schedule, timing filters, class booking actions',
    criticalSelectors: {
      scheduleTimetable: 'div.schedule-container, [data-testid="schedule-table"]',
    },
  },
  upcomingClasses: {
    name: 'Upcoming Classes',
    category: 'private',
    patterns: [
      /src\/Development\/pages\/private\/Dashboard\/UpcomingSessions/i,
      /src\/Development\/pages\/private\/Dashboard\/Choreography/i,
    ],
    pageObject: 'DashboardPage',
    route: '/dashboard/upcoming-sessions',
    description: 'Member upcoming live dance sessions, join links, calendar integration',
    criticalSelectors: {
      sessionCard: '[data-testid="upcoming-session"], .session-card',
    },
  },
  previousClasses: {
    name: 'Previous Classes',
    category: 'private',
    patterns: [
      /src\/Development\/pages\/private\/Dashboard\/PreviousSessions/i,
    ],
    pageObject: 'DashboardPage',
    route: '/dashboard/previous-sessions',
    description: 'Completed class recordings, past attendance history, class ratings',
    criticalSelectors: {
      recordingItem: '[data-testid="previous-session"], .past-class-item',
    },
  },
  rewards: {
    name: 'Rewards & Leaderboard',
    category: 'private',
    patterns: [
      /src\/Development\/pages\/private\/Dashboard\/Rewards/i,
      /src\/Development\/pages\/public\/Leaderboard/i,
    ],
    pageObject: 'DashboardPage',
    route: '/dashboard/rewards',
    description: 'Member loyalty points, reward vouchers, streaks, ranking on student leaderboard',
    criticalSelectors: {
      rewardPoints: '[data-testid="reward-points"], text=Points',
    },
  },
  dashboard: {
    name: 'Dashboard Core',
    category: 'private',
    patterns: [
      /src\/Development\/pages\/private\/Dashboard/i,
      /src\/Development\/pages\/private\/Attendance/i,
      /src\/Development\/pages\/private\/Subscriptions/i,
    ],
    pageObject: 'DashboardPage',
    route: '/dashboard',
    description: 'Member & instructor central dashboard, profile update, attendance, billing overview',
    criticalSelectors: {
      dashboardContainer: 'main, [data-testid="dashboard"]',
    },
  },
};

export const AUTOMATION_CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://beta.happyprancer.com/',
  defaultTimeout: 30000,
  navigationTimeout: 45000,
  directories: {
    testCasesGenerated: 'automation/test-cases/generated',
    testCasesApproved: 'automation/test-cases/approved',
    testsGenerated: 'automation/tests/generated',
    testsRegression: 'automation/tests/e2e',
    reports: 'reports',
    htmlReport: 'playwright-report',
    excelReport: 'reports/excel',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'offline',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
  },
};
