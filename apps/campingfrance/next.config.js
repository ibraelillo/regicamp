/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['ui', 'api-client'],
    env: {
        NEXT_PUBLIC_API_URL: process.env.API_URL
    }
}

module.exports = nextConfig
