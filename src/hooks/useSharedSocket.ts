import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

let sharedSocket: Socket | null = null
const socketSubscribers = new Set<symbol>()

export function useSharedSocket (): Socket | null {
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL
	const [socket, setSocket] = useState<Socket | null>(() =>
		typeof window !== 'undefined' ? sharedSocket : null
	)

	useEffect(() => {
		if (typeof window === 'undefined') { return }
		if (WS_URL == null) {
			console.error('WS_URL is not defined. Shared WebSocket connection cannot be established.')
			return
		}

		if (sharedSocket === null) {
			sharedSocket = io(WS_URL, {
				withCredentials: true,
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				timeout: 10000
			})
			sharedSocket.on('connect', () => console.log('Shared socket connected.'))
			sharedSocket.on('disconnect', reason => console.log('Shared socket disconnected:', reason))
			sharedSocket.on('connect_error', err => console.error('Shared socket connection error:', err))
		}

		const subscriberId = Symbol()
		socketSubscribers.add(subscriberId)
		setSocket(sharedSocket)

		return () => {
			socketSubscribers.delete(subscriberId)
			if (socketSubscribers.size === 0 && sharedSocket) {
				console.log('Closing shared socket.')
				sharedSocket.off('connect')
				sharedSocket.off('disconnect')
				sharedSocket.off('connect_error')
				sharedSocket.close()
				sharedSocket = null
			}
			setSocket(null)
		}
	}, [WS_URL])

	return socket
}
