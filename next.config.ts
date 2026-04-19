import type { NextConfig } from 'next'

const REQUIRED_ENV = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:')
  missing.forEach((k) => console.error(`   - ${k}`))
  console.error('Set them in .env.local before starting.\n')
  process.exit(1)
}

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
}

export default nextConfig
