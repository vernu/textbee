/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en-US'],
    defaultLocale: 'en-US',
  },

  async redirects() {
    return [
      {
        source: '/android',
        destination: 'https://appdistribution.firebase.dev/i/1439f7af2d1e8e8e',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
