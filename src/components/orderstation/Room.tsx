import React from 'react'

const Room = ({
	room,
	onRoomSelect
}: {
	room: { _id: string; name: string; description: string }
	onRoomSelect: (roomId: string) => void
}) => {
	return (
		<button
			type='button'
			onClick={() => onRoomSelect(room._id)}
			className="p-6 m-4 bg-white rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
		>
			<h2 className="text-2xl font-bold mb-2 text-gray-700">{room.name}</h2>
			<p className="text-gray-700">{room.description}</p>
		</button>
	)
}

export default Room