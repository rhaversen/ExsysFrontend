/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next'
import { execSync } from 'child_process'

const getGitHash = (): string => {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim()
	} catch {
		return 'unknown'
	}
}

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_GIT_HASH: getGitHash()
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'dummyimage.com'
			}
		]
	}
}

export default nextConfig
