import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

import type { KioskPongEventType } from '@/types/backendDataTypes'
import { useSharedSocket } from '@/hooks/useSharedSocket'

export interface KioskPingStatus {
	kioskId: string
	path: string
	viewState: string
	lastSeen: Date
	gitHash: string
}

export type KioskPingState = 'loading' | 'active' | 'no-response'

export interface UseKioskPingReturn {
	pingStatuses: Map<string, KioskPingStatus>
	getPingState: (kioskId: string) => KioskPingState
}

const PING_INTERVAL_MS = 1000
const INITIAL_LOADING_MS = 5000
const NO_RESPONSE_THRESHOLD_MS = 3000

export const useAdminKioskPing = (kioskIds: string[]): UseKioskPingReturn => {
	const socket = useSharedSocket()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [pingStatuses, setPingStatuses] = useState<Map<string, KioskPingStatus>>(new Map())
	const [isInitialLoading, setIsInitialLoading] = useState(true)

	const kioskIdsKey = kioskIds.join(',')

	useEffect(() => {
		setIsInitialLoading(true)
		setPingStatuses(new Map())

		const timer = setTimeout(() => {
			setIsInitialLoading(false)
		}, INITIAL_LOADING_MS)

		return () => { clearTimeout(timer) }
	}, [kioskIdsKey])

	useEffect(() => {
		if (API_URL === undefined || API_URL === '') { return }

		const sendPing = (): void => {
			axios.post(`${API_URL}/v1/kiosks/ping`, {}, { withCredentials: true })
				.catch(() => {})
		}

		sendPing()
		const interval = setInterval(sendPing, PING_INTERVAL_MS)

		return () => { clearInterval(interval) }
	}, [API_URL])

	useEffect(() => {
		if (socket === null) { return }

		const handlePong = (data: KioskPongEventType): void => {
			setPingStatuses(prev => {
				const next = new Map(prev)
				next.set(data.kioskId, {
					kioskId: data.kioskId,
					path: data.path,
					viewState: data.viewState,
					lastSeen: new Date(data.timestamp),
					gitHash: data.gitHash
				})
				return next
			})
		}

		socket.on('kiosk-pong', handlePong)

		return () => {
			socket.off('kiosk-pong', handlePong)
		}
	}, [socket])

	const getPingState = useCallback((kioskId: string): KioskPingState => {
		if (isInitialLoading) {
			return 'loading'
		}

		const status = pingStatuses.get(kioskId)
		if (status === undefined) {
			return 'no-response'
		}

		const timeSinceLastSeen = Date.now() - status.lastSeen.getTime()
		if (timeSinceLastSeen > NO_RESPONSE_THRESHOLD_MS) {
			return 'no-response'
		}

		return 'active'
	}, [isInitialLoading, pingStatuses])

	return {
		pingStatuses,
		getPingState
	}
}
