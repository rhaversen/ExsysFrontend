import React, { useState } from 'react'

const RoomSelector = ({
	rooms,
	onRoomSelect
}: {
	rooms: Array<{ _id: string, name: string, description: string }>
	onRoomSelect: (roomId: string) => void
}) => {
	const [selectedRoom, setSelectedRoom] = useState('') // Initialize with an empty string

	const handleRoomChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedRoom = event.target.value // Get the value of the selected option
		setSelectedRoom(selectedRoom)
		onRoomSelect(selectedRoom)
	}

	return (
		<div className="p-5">
			<select
				className="p-5 border bg-blue-500 rounded-md shadow-sm text-white focus:outline-none cursor-pointer"
				aria-label="Vælg rum"
				value={selectedRoom}
				onChange={handleRoomChange}
			>
				<option value="" disabled className="bg-white text-black">{'Vælg rum'}</option>
				{rooms.map((room) => (
					<option key={room._id} value={room._id} className="bg-white text-black">
						{room.name}
					</option>
				))}
			</select>
		</div>
	)
}

export default RoomSelector
