import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

import { useSharedSocket } from '@/hooks/useSharedSocket'
import type { KioskPongEventType } from '@/types/backendDataTypes'

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

const PING_INTERVAL_MS = 5000
const NO_RESPONSE_THRESHOLD_MS = 5000

export const useAdminKioskPing = (kioskIds: string[]): UseKioskPingReturn => {
	const socket = useSharedSocket()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [pingStatuses, setPingStatuses] = useState<Map<string, KioskPingStatus>>(new Map())
	const [timedOutKiosks, setTimedOutKiosks] = useState<Set<string>>(new Set())
	const [pingCycle, setPingCycle] = useState(0)

	const kioskIdsKey = kioskIds.join(',')

	useEffect(() => {
		setPingStatuses(new Map())
		setTimedOutKiosks(new Set())
	}, [kioskIdsKey])

	useEffect(() => {
		const timeout = setTimeout(() => {
			setTimedOutKiosks(new Set(kioskIds))
		}, NO_RESPONSE_THRESHOLD_MS)

		return () => { clearTimeout(timeout) }
	}, [kioskIds, pingCycle])

	useEffect(() => {
		if (API_URL === undefined || API_URL === '') { return }

		let interval: ReturnType<typeof setInterval> | null = null

		const sendPing = (): void => {
			axios.post(`${API_URL}/v1/kiosks/ping`, {}, { withCredentials: true })
				.catch(() => {})
		}

		const startPinging = (): void => {
			if (interval !== null) { return }
			setPingStatuses(new Map())
			setTimedOutKiosks(new Set())
			setPingCycle(c => c + 1)
			sendPing()
			interval = setInterval(sendPing, PING_INTERVAL_MS)
		}

		const stopPinging = (): void => {
			if (interval !== null) {
				clearInterval(interval)
				interval = null
			}
		}

		const handleVisibilityChange = (): void => {
			if (document.visibilityState === 'visible') {
				startPinging()
			} else {
				stopPinging()
			}
		}

		if (document.visibilityState === 'visible') {
			startPinging()
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			stopPinging()
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
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
		const status = pingStatuses.get(kioskId)

		if (status === undefined) {
			return timedOutKiosks.has(kioskId) ? 'no-response' : 'loading'
		}

		const timeSinceLastSeen = Date.now() - status.lastSeen.getTime()
		if (timeSinceLastSeen > NO_RESPONSE_THRESHOLD_MS) {
			return 'no-response'
		}

		return 'active'
	}, [pingStatuses, timedOutKiosks])

	return {
		pingStatuses,
		getPingState
	}
}
