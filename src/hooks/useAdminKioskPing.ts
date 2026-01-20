import axios from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSharedSocket } from '@/hooks/useSharedSocket'
import type { KioskPongEventType } from '@/types/backendDataTypes'

export interface KioskPingStatus {
	kioskId: string
	path: string
	viewState: string
	lastSeen: number
	gitHash: string
}

export type KioskPingState = 'loading' | 'active' | 'no-response'

export interface UseKioskPingReturn {
	pingStatuses: Map<string, KioskPingStatus>
	getPingState: (kioskId: string) => KioskPingState
	resetKiosk: (kioskId: string) => void
	resetAllKiosks: () => void
}

const PING_INTERVAL_MS = 10000
const NO_RESPONSE_THRESHOLD_MS = 15000
const DEBOUNCE_MS = 300

export const useAdminKioskPing = (kioskIds: string[]): UseKioskPingReturn => {
	const socket = useSharedSocket()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [pingStatuses, setPingStatuses] = useState<Map<string, KioskPingStatus>>(new Map())
	const [loadingKiosks, setLoadingKiosks] = useState<Set<string>>(() => new Set(kioskIds))

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
	const acceptPongsAfterRef = useRef<Map<string, number>>(new Map())

	const kioskIdsKey = useMemo(() => kioskIds.join(','), [kioskIds])

	const sendPing = useCallback((): void => {
		if (API_URL === undefined || API_URL === '') {
			return
		}
		axios.post(`${API_URL}/v1/kiosks/ping`, {}, { withCredentials: true }).catch(() => {})
	}, [API_URL])

	const startLoadingTimeout = useCallback((kioskId: string): void => {
		const existing = timeoutsRef.current.get(kioskId)
		if (existing !== undefined) {
			clearTimeout(existing)
		}

		timeoutsRef.current.set(kioskId, setTimeout(() => {
			setLoadingKiosks(prev => {
				if (!prev.has(kioskId)) {
					return prev
				}
				const next = new Set(prev)
				next.delete(kioskId)
				return next
			})
			timeoutsRef.current.delete(kioskId)
		}, NO_RESPONSE_THRESHOLD_MS))
	}, [])

	const markAsLoading = useCallback((kioskId: string): void => {
		acceptPongsAfterRef.current.set(kioskId, Date.now() + DEBOUNCE_MS)
		setLoadingKiosks(prev => new Set(prev).add(kioskId))
		setPingStatuses(prev => {
			const next = new Map(prev)
			next.delete(kioskId)
			return next
		})
		startLoadingTimeout(kioskId)
	}, [startLoadingTimeout])

	useEffect(() => {
		const now = Date.now() + DEBOUNCE_MS
		kioskIds.forEach(id => acceptPongsAfterRef.current.set(id, now))
		setLoadingKiosks(new Set(kioskIds))
		setPingStatuses(new Map())

		const timeouts = timeoutsRef.current
		timeouts.forEach(t => clearTimeout(t))
		timeouts.clear()
		kioskIds.forEach(id => startLoadingTimeout(id))

		sendPing()

		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current)
		}
		intervalRef.current = setInterval(sendPing, PING_INTERVAL_MS)

		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current)
			}
			timeouts.forEach(t => clearTimeout(t))
			timeouts.clear()
		}
	}, [kioskIds, kioskIdsKey, sendPing, startLoadingTimeout])

	useEffect(() => {
		if (socket === null) {
			return
		}

		const handlePong = (data: KioskPongEventType): void => {
			const acceptAfter = acceptPongsAfterRef.current.get(data.kioskId) ?? 0
			if (Date.now() < acceptAfter) {
				return
			}

			const timeout = timeoutsRef.current.get(data.kioskId)
			if (timeout !== undefined) {
				clearTimeout(timeout)
				timeoutsRef.current.delete(data.kioskId)
			}

			setPingStatuses(prev => {
				const next = new Map(prev)
				next.set(data.kioskId, {
					kioskId: data.kioskId,
					path: data.path,
					viewState: data.viewState,
					lastSeen: Date.now(),
					gitHash: data.gitHash
				})
				return next
			})

			setLoadingKiosks(prev => {
				if (!prev.has(data.kioskId)) {
					return prev
				}
				const next = new Set(prev)
				next.delete(data.kioskId)
				return next
			})
		}

		socket.on('kiosk-pong', handlePong)
		return () => { socket.off('kiosk-pong', handlePong) }
	}, [socket])

	const getPingState = useCallback((kioskId: string): KioskPingState => {
		if (loadingKiosks.has(kioskId)) {
			return 'loading'
		}

		const status = pingStatuses.get(kioskId)
		if (status === undefined) {
			return 'no-response'
		}

		const timeSinceLastSeen = Date.now() - status.lastSeen
		if (timeSinceLastSeen > NO_RESPONSE_THRESHOLD_MS) {
			return 'no-response'
		}

		return 'active'
	}, [pingStatuses, loadingKiosks])

	const resetKiosk = useCallback((kioskId: string): void => {
		markAsLoading(kioskId)
		sendPing()
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current)
		}
		intervalRef.current = setInterval(sendPing, PING_INTERVAL_MS)
	}, [markAsLoading, sendPing])

	const resetAllKiosks = useCallback((): void => {
		kioskIds.forEach(id => markAsLoading(id))
		sendPing()
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current)
		}
		intervalRef.current = setInterval(sendPing, PING_INTERVAL_MS)
	}, [kioskIds, markAsLoading, sendPing])

	return { pingStatuses, getPingState, resetKiosk, resetAllKiosks }
}
