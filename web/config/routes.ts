const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://textbee.dev'

export const Routes = {
  landingPage: siteUrl,
  contribute: '/contribute',
  useCases: `${siteUrl}/use-cases`,
  quickstart: `${siteUrl}/quickstart`,
  login: '/login',
  register: '/register',
  logout: '/logout',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',

  dashboard: '/dashboard',

  downloadAndroidApp: `${siteUrl}/download`,
  downloadAPK: `${siteUrl.replace('https://', 'https://dl.')}/textbee.apk`,
  privacyPolicy: `${siteUrl}/privacy-policy`,
  refundPolicy: `${siteUrl}/refund-policy`,
  termsOfService: `${siteUrl}/terms-of-service`,
  statusPage: `${siteUrl.replace('https://', 'https://status.')}`,
}
