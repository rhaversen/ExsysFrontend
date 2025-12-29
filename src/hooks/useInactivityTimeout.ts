'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseInactivityTimeoutOptions {
	timeoutMs: number
	enabled: boolean
	onTimeout: () => void
}

interface UseInactivityTimeoutReturn {
	showWarning: boolean
	dismissWarning: () => void
	handleTimeout: () => void
}

export function useInactivityTimeout ({
	timeoutMs,
	enabled,
	onTimeout
}: UseInactivityTimeoutOptions): UseInactivityTimeoutReturn {
	const [showWarning, setShowWarning] = useState(false)
	const timerRef = useRef<NodeJS.Timeout>(undefined)
	const onTimeoutRef = useRef(onTimeout)

	useEffect(() => {
		onTimeoutRef.current = onTimeout
	}, [onTimeout])

	const startTimer = useCallback(() => {
		clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => {
			setShowWarning(true)
		}, timeoutMs)
	}, [timeoutMs])

	useEffect(() => {
		if (!enabled) {
			clearTimeout(timerRef.current)
			setShowWarning(false)
			return
		}

		startTimer()

		const events = ['touchstart', 'touchmove', 'click', 'mousemove', 'keydown', 'scroll']
		const handleActivity = (): void => { startTimer() }

		events.forEach(event => document.addEventListener(event, handleActivity))

		return () => {
			clearTimeout(timerRef.current)
			events.forEach(event => document.removeEventListener(event, handleActivity))
		}
	}, [enabled, startTimer])

	const dismissWarning = useCallback(() => {
		setShowWarning(false)
		startTimer()
	}, [startTimer])

	const handleTimeout = useCallback(() => {
		setShowWarning(false)
		onTimeoutRef.current()
	}, [])

	return {
		showWarning,
		dismissWarning,
		handleTimeout
	}
}
