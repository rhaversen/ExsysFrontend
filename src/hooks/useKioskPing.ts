import axios from 'axios'
import { useEffect } from 'react'

import { useUser } from '@/contexts/UserProvider'
import { useSharedSocket } from '@/hooks/useSharedSocket'
import type { KioskType } from '@/types/backendDataTypes'

export const useKioskPing = (viewState: string): void => {
	const { currentUser } = useUser()
	const kiosk = currentUser as KioskType | null
	const socket = useSharedSocket()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	useEffect(() => {
		if (socket === null || kiosk === null) { return }

		const handlePing = (): void => {
			axios.post(
				`${API_URL}/v1/kiosks/pong`,
				{
					path: window.location.pathname,
					viewState,
					gitHash: process.env.NEXT_PUBLIC_GIT_HASH ?? 'unknown'
				},
				{ withCredentials: true }
			).catch(() => {
				// Silently fail - admin will see no response
			})
		}

		socket.on('kiosk-ping', handlePing)

		return () => {
			socket.off('kiosk-ping', handlePing)
		}
	}, [socket, kiosk, viewState, API_URL])
}
