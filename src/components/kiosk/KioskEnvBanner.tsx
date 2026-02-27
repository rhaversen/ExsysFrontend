'use client'

import { type ReactElement, useEffect, useState } from 'react'

type Environment = 'production' | 'staging' | 'development'

function detectEnvironment (): Environment {
	if (typeof window === 'undefined') { return 'development' }
	const host = window.location.hostname
	if (host === 'kantine.nyskivehus.dk') { return 'production' }
	if (host === 'staging.kantine.nyskivehus.dk') { return 'staging' }
	return 'development'
}

const ENV_CONFIG: Record<Exclude<Environment, 'production'>, { label: string, color: string }> = {
	staging: { label: 'STAGING', color: 'bg-yellow-500' },
	development: { label: 'DEV', color: 'bg-blue-500' }
}

export default function KioskEnvBanner (): ReactElement | null {
	const [env, setEnv] = useState<Environment | null>(null)

	useEffect(() => {
		setEnv(detectEnvironment())
	}, [])

	if (env === null || env === 'production') { return null }

	const { label, color } = ENV_CONFIG[env]

	return (
		<div className={`fixed top-2 right-2 z-50 ${color} text-white text-xs font-bold px-2 py-1 rounded shadow-lg opacity-80 pointer-events-none`}>
			{label}
		</div>
	)
}
