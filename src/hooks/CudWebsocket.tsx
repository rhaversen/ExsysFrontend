import { useEffect, useState, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

let sharedSocket: Socket | null = null
const socketSubscribers = new Set<symbol>()

interface SocketOptions<T extends { _id: string }> {
	setState?: React.Dispatch<React.SetStateAction<T[]>>
	onCreate?: (item: T) => void
	onUpdate?: (item: T) => void
	onDelete?: (id: string) => void
}

function useSharedSocket (): Socket | null {
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

export function useSocket<T extends { _id: string }> (
	entityName: string,
	options: SocketOptions<T> = {}
): Socket | null {
	const socket = useSharedSocket()
	const { setState, onCreate, onUpdate, onDelete } = options

	const onCreateRef = useRef(onCreate)
	const onUpdateRef = useRef(onUpdate)
	const onDeleteRef = useRef(onDelete)

	useEffect(() => {
		onCreateRef.current = onCreate
		onUpdateRef.current = onUpdate
		onDeleteRef.current = onDelete
	}, [onCreate, onUpdate, onDelete])

	useEffect(() => {
		if (!socket) { return }

		const handleCreate = (item: T) => {
			try {
				if (onCreateRef.current) {
					onCreateRef.current(item)
				}
				if (setState) {
					setState(prev => [...prev, item])
				}
			} catch (error) {
				console.error(`Error processing create for ${entityName}:`, error, 'Received item:', item)
			}
		}

		const handleUpdate = (item: T) => {
			try {
				if (onUpdateRef.current) {
					onUpdateRef.current(item)
				}
				if (setState) {
					setState(prev => prev.map(e => (e._id === item._id ? item : e)))
				}
			} catch (error) {
				console.error(`Error processing update for ${entityName}:`, error, 'Received item:', item)
			}
		}

		const handleDelete = (id: string) => {
			try {
				if (onDeleteRef.current) {
					onDeleteRef.current(id)
				}
				if (setState) {
					setState(prev => prev.filter(e => e._id !== id))
				}
			} catch (error) {
				console.error(`Error processing delete for ${entityName}:`, error, 'Received id:', id)
			}
		}

		socket.on(`${entityName}Created`, handleCreate)
		socket.on(`${entityName}Updated`, handleUpdate)
		socket.on(`${entityName}Deleted`, handleDelete)

		return () => {
			socket.off(`${entityName}Created`, handleCreate)
			socket.off(`${entityName}Updated`, handleUpdate)
			socket.off(`${entityName}Deleted`, handleDelete)
		}
	}, [socket, entityName, setState])

	return socket
}
