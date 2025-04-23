import { useEffect } from 'react'
import { type Socket } from 'socket.io-client'

export default function useEntitySocketListeners<T> (
	socket: Socket | null,
	entityName: string,
	handleAdd: (item: T) => void,
	handleUpdate: (item: T) => void,
	handleDelete: (id: string) => void,
	preprocessItem?: (item: T) => T
): void {
	useEffect(() => {
		if (socket === null) { return }

		const onAdd = (item: T): void => {
			if (preprocessItem !== undefined) {
				item = preprocessItem(item)
			}
			handleAdd(item)
		}

		const onUpdate = (item: T): void => {
			if (preprocessItem !== undefined) {
				item = preprocessItem(item)
			}
			handleUpdate(item)
		}

		socket.on(`${entityName}Created`, onAdd)
		socket.on(`${entityName}Updated`, onUpdate)
		socket.on(`${entityName}Deleted`, handleDelete)

		return () => {
			socket.off(`${entityName}Created`, onAdd)
			socket.off(`${entityName}Updated`, onUpdate)
			socket.off(`${entityName}Deleted`, handleDelete)
		}
	}, [socket, entityName, handleAdd, handleUpdate, handleDelete, preprocessItem])
}
