import React, { useState } from 'react'

const RoomSelector = ({
	rooms,
	onRoomSelect,
}: {
	rooms: { _id: string; name: string, description: string }[]
	onRoomSelect: (roomId: string) => void
}) => {
	const [selectedRoom, setSelectedRoom] = useState('') // Initialize with an empty string

	const handleRoomChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedRoom = event.target.value // Get the value of the selected option
		setSelectedRoom(selectedRoom)
		onRoomSelect(selectedRoom)
	}

	return (
		<div className="flex flex-col items-start">
			<select aria-label='Vælg rum' id="room-selector" value={selectedRoom} onChange={handleRoomChange} className="px-4 py-2 border bg-blue-500 rounded-md shadow-sm text-white focus:outline-none">
				<option value="" disabled>Vælg rum</option>
				{rooms.map((room) => (
					<option key={room._id} value={room._id}>
						{room.name}
					</option>
				))}
			</select>
		</div>
	)
}

export default RoomSelector