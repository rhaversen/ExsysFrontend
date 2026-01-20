import { useEffect } from 'react'

export const useKioskRecovery = (): void => {
	useEffect(() => {
		// eslint-disable-next-line n/no-unsupported-features/node-builtins -- navigator is a browser API, not Node.js
		if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator) {
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			window.navigator.serviceWorker.register('/kiosk-recovery-sw.js').catch(() => {})
		}
	}, [])
}
