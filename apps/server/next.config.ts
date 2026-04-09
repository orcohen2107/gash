import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@gash/types', '@gash/schemas', '@gash/constants', '@gash/api-client'],
}

export default nextConfig
