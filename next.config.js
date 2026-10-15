/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/shop/index.html',
      },
      {
        source: '/:page',
        destination: '/shop/:page.html',
      },
    ]
  },
}

module.exports = nextConfig
