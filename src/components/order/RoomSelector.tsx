import { type RoomType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useCallback, useState } from 'react'

const RoomSelector = ({
	rooms,
	onRoomSelect
}: {
	rooms: RoomType[]
	onRoomSelect: (roomId: RoomType['_id']) => void
}): ReactElement => {
	const [selectedRoom, setSelectedRoom] = useState('') // Initialize with an empty string

	const handleRoomChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
		const selectedRoom = event.target.value // Get the value of the selected option
		setSelectedRoom(selectedRoom)
		onRoomSelect(selectedRoom)
	}, [onRoomSelect])

	return (
		<div className="p-5">
			<select
				className="p-5 border bg-blue-500 rounded-md shadow-sm text-white focus:outline-none cursor-pointer"
				aria-label="Vælg rum"
				value={selectedRoom}
				onChange={handleRoomChange}
			>
				<option value="" disabled className="bg-white text-gray-800">{'Vælg rum'}</option>
				{rooms.map((room) => (
					<option key={room._id} value={room._id} className="bg-white text-gray-800">
						{room.name}
					</option>
				))}
			</select>
		</div>
	)
}

export default RoomSelector
