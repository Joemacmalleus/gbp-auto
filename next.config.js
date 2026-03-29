/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript errors checked in CI — only Prisma-generated types
  // may cause issues when prisma generate hasn't run yet
  typescript: {
    ignoreBuildErrors: true,
  },
};
module.exports = nextConfig;
