/** @type {import('next').NextConfig} */
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lets /api-docs/ keep its trailing slash (Swagger UI's relative asset URLs depend on it)
  skipTrailingSlashRedirect: true,
  // Proxy /api/* to the Express server so the browser only talks to the frontend origin.
  // That keeps the auth cookie first-party (no cross-site cookie / CORS issues on Vercel + Render).
  async rewrites() {
    // (/api-docs is proxied in middleware.js so its trailing slash is preserved)
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
};
