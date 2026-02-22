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
	isRefreshing: boolean
}

const NO_RESPONSE_THRESHOLD_MS = 15000

export const useAdminKioskPing = (kioskIds: string[]): UseKioskPingReturn => {
	const socket = useSharedSocket()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [pingStatuses, setPingStatuses] = useState<Map<string, KioskPingStatus>>(new Map())
	const [loadingKiosks, setLoadingKiosks] = useState<Set<string>>(() => new Set(kioskIds))
	const [isRefreshing, setIsRefreshing] = useState(false)

	const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
	const hasSentInitialPing = useRef(false)

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
			setIsRefreshing(false)
		}, NO_RESPONSE_THRESHOLD_MS))
	}, [])

	const markAsLoading = useCallback((kioskId: string): void => {
		setLoadingKiosks(prev => new Set(prev).add(kioskId))
		setPingStatuses(prev => {
			const next = new Map(prev)
			next.delete(kioskId)
			return next
		})
		startLoadingTimeout(kioskId)
	}, [startLoadingTimeout])

	// Set up pong listener first, then send initial ping — handles fast responses
	useEffect(() => {
		if (socket === null) {
			return
		}

		const handlePong = (data: KioskPongEventType): void => {
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

			setIsRefreshing(false)
		}

		socket.on('kiosk-pong', handlePong)
		return () => { socket.off('kiosk-pong', handlePong) }
	}, [socket])

	// Send initial ping once after socket and listener are ready
	useEffect(() => {
		if (socket === null || hasSentInitialPing.current) {
			return
		}

		hasSentInitialPing.current = true
		setLoadingKiosks(new Set(kioskIds))
		setPingStatuses(new Map())

		const timeouts = timeoutsRef.current
		timeouts.forEach(t => clearTimeout(t))
		timeouts.clear()
		kioskIds.forEach(id => startLoadingTimeout(id))

		sendPing()

		return () => {
			timeouts.forEach(t => clearTimeout(t))
			timeouts.clear()
		}
	}, [socket, kioskIds, kioskIdsKey, sendPing, startLoadingTimeout])

	const getPingState = useCallback((kioskId: string): KioskPingState => {
		if (loadingKiosks.has(kioskId)) {
			return 'loading'
		}

		const status = pingStatuses.get(kioskId)
		if (status === undefined) {
			return 'no-response'
		}

		return 'active'
	}, [pingStatuses, loadingKiosks])

	const resetKiosk = useCallback((kioskId: string): void => {
		setIsRefreshing(true)
		markAsLoading(kioskId)
		sendPing()
	}, [markAsLoading, sendPing])

	const resetAllKiosks = useCallback((): void => {
		setIsRefreshing(true)
		kioskIds.forEach(id => markAsLoading(id))
		sendPing()
	}, [kioskIds, markAsLoading, sendPing])

	return { pingStatuses, getPingState, resetKiosk, resetAllKiosks, isRefreshing }
}
