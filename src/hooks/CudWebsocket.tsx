import { useEffect, useRef } from 'react'
import { type Socket } from 'socket.io-client'

import { useSharedSocket } from './useSharedSocket'

interface SocketOptions<T extends { _id: string }> {
	setState?: React.Dispatch<React.SetStateAction<T[]>>
	onCreate?: (item: T) => void
	onUpdate?: (item: T) => void
	onDelete?: (id: string) => void
}

export function useEntitySocket<T extends { _id: string }> (
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
