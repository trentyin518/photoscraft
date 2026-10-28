/**
 * The routes for the application
 */
export enum Routes {
  Root = '/',

  // marketing pages (PhotoCraft only)
  FAQ = '/#faqs',
  Pricing = '/pricing',
  Editor = '/editor',
  Showcase = '/showcase',
  About = '/about',
  Contact = '/contact',
  CookiePolicy = '/cookie',
  PrivacyPolicy = '/privacy',
  TermsOfService = '/terms',
  AIGCPolicy = '/aigc',

  // disabled template pages (kept for reference, not linked, redirected in proxy)
  Blog = '/blog',
  Docs = '/docs',

  // auth routes
  Login = '/auth/login',
  Register = '/auth/register',
  AuthError = '/auth/error',
  ForgotPassword = '/auth/forgot-password',
  ResetPassword = '/auth/reset-password',

  // dashboard routes
  Dashboard = '/dashboard',

  // admin routes
  AdminUsers = '/admin/users',
  AdminShowcase = '/admin/showcase',
  AdminFeedback = '/admin/feedback',

  // settings routes
  SettingsProfile = '/settings/profile',
  SettingsBilling = '/settings/billing',
  SettingsSecurity = '/settings/security',
  SettingsFeedback = '/settings/feedback',
  SettingsNotifications = '/settings/notifications',
  SettingsApiKeys = '/settings/apikeys',

  // payment processing
  Payment = '/payment',
}

/**
 * The routes that can not be accessed by logged in users
 */
export const routesNotAllowedByLoggedInUsers = [Routes.Login, Routes.Register];

/**
 * The routes that are protected and require authentication
 */
export const protectedRoutes = [
  Routes.Dashboard,
  Routes.AdminUsers,
  Routes.AdminShowcase,
  Routes.AdminFeedback,
  Routes.SettingsProfile,
  Routes.SettingsBilling,
  Routes.SettingsSecurity,
  Routes.SettingsFeedback,
  Routes.SettingsNotifications,
  Routes.SettingsApiKeys,
  Routes.Payment,
];

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT = Routes.Dashboard;
