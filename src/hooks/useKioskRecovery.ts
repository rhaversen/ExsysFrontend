import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'

const HEALTH_CHECK_INTERVAL_MS = 60_000
const OFFLINE_THRESHOLD_MS = 120_000

export const useKioskRecovery = (): { isBackendOffline: boolean } => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [isBackendOffline, setIsBackendOffline] = useState(false)
	const lastSuccessfulBackendCheckRef = useRef<number | null>(null)
	const lastSuccessfulFrontendCheckRef = useRef<number | null>(null)

	const performBackendHealthCheck = useCallback(async (): Promise<boolean> => {
		try {
			await axios.get(`${API_URL}/service/livez`, { timeout: 10_000 })
			return true
		} catch {
			return false
		}
	}, [API_URL])

	const performFrontendHealthCheck = useCallback(async (): Promise<boolean> => {
		try {
			await fetch('/kiosk-offline.html', { method: 'HEAD', cache: 'no-store' })
			return true
		} catch {
			return false
		}
	}, [])

	useEffect(() => {
		if (lastSuccessfulBackendCheckRef.current === null) {
			lastSuccessfulBackendCheckRef.current = Date.now()
		}

		const runHealthCheck = async (): Promise<void> => {
			const isHealthy = await performBackendHealthCheck()
			const now = Date.now()

			if (isHealthy) {
				lastSuccessfulBackendCheckRef.current = now
				setIsBackendOffline(false)
			} else if (lastSuccessfulBackendCheckRef.current !== null) {
				const timeSinceLastSuccess = now - lastSuccessfulBackendCheckRef.current
				if (timeSinceLastSuccess > OFFLINE_THRESHOLD_MS) {
					setIsBackendOffline(true)
				}
			}
		}

		void runHealthCheck()
		const interval = setInterval(() => { void runHealthCheck() }, HEALTH_CHECK_INTERVAL_MS)

		return () => { clearInterval(interval) }
	}, [performBackendHealthCheck])

	useEffect(() => {
		if (lastSuccessfulFrontendCheckRef.current === null) {
			lastSuccessfulFrontendCheckRef.current = Date.now()
		}

		const runFrontendHealthCheck = async (): Promise<void> => {
			const isHealthy = await performFrontendHealthCheck()
			const now = Date.now()

			if (isHealthy) {
				lastSuccessfulFrontendCheckRef.current = now
			} else if (lastSuccessfulFrontendCheckRef.current !== null) {
				const timeSinceLastSuccess = now - lastSuccessfulFrontendCheckRef.current
				if (timeSinceLastSuccess > OFFLINE_THRESHOLD_MS) {
					window.location.href = '/kiosk-offline.html'
				}
			}
		}

		void runFrontendHealthCheck()
		const interval = setInterval(() => { void runFrontendHealthCheck() }, HEALTH_CHECK_INTERVAL_MS)

		return () => { clearInterval(interval) }
	}, [performFrontendHealthCheck])

	useEffect(() => {
		// eslint-disable-next-line n/no-unsupported-features/node-builtins -- navigator is a browser API, not Node.js
		if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator) {
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			window.navigator.serviceWorker.register('/kiosk-recovery-sw.js').catch(() => {})
		}
	}, [])

	return { isBackendOffline }
}
