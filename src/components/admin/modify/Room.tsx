import { type RoomType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import axios from 'axios'

const Room = ({
	room,
	onRoomPatched,
	onRoomDeleted
}: {
	room: RoomType
	onRoomPatched: (room: RoomType) => void
	onRoomDeleted: (id: RoomType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [isEditing, setIsEditing] = useState(false)
	const [newRoom, setNewRoom] = useState<RoomType>(room)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	const patchRoom = (room: RoomType, roomPatch: Omit<RoomType, '_id'>): void => {
		axios.patch(`${API_URL}/v1/rooms/${room._id}`, roomPatch).then((response) => {
			console.log('Room updated:', response.data)
			onRoomPatched(response.data as RoomType)
		}).catch((error) => {
			console.error('Error updating room:', error)
		})
	}

	const deleteRoom = (room: RoomType, confirmDeletion: boolean): void => {
		axios.delete(`${API_URL}/v1/rooms/${room._id}`, {
			data: { confirmDeletion }
		}).then(() => {
			console.log('Room deleted')
			onRoomDeleted(room._id)
		}).catch((error) => {
			console.error('Error deleting room:', error)
			setNewRoom(room)
		})
	}

	const handleNameChange = (v: string): void => {
		console.log('Name change:', v)
		setNewRoom({
			...newRoom,
			name: v
		})
	}

	const handleDescriptionChange = (v: string): void => {
		console.log('Description change:', v)
		setNewRoom({
			...newRoom,
			description: v
		})
	}

	const handleUndoEdit = (): void => {
		console.log('Undoing edit')
		setNewRoom(room)
		setIsEditing(false)
	}

	const handleCompleteEdit = (): void => {
		console.log('Completing edit', newRoom)
		patchRoom(room, newRoom)
		setNewRoom(room)
		setIsEditing(false)
	}

	const handleDeleteRoom = (confirmDeletion: boolean): void => {
		console.log('Deleting room')
		deleteRoom(room, confirmDeletion)
	}

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<div className="font-bold p-2 text-black">
						<EditableField
							text={newRoom.name}
							italic={false}
							editable={isEditing}
							edited={newRoom.name !== room.name}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
						/>
					</div>
					<div className="text-gray-700">
						<EditableField
							text={newRoom.description}
							italic={true}
							editable={isEditing}
							edited={newRoom.description !== room.description}
							onChange={(v: string) => {
								handleDescriptionChange(v)
							}}
						/>
					</div>
				</div>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
				/>
			</div>
			{showDeleteConfirmation &&
				<ConfirmDeletion
					itemName={room.name}
					onClose={() => {
						setShowDeleteConfirmation(false)
					}}
					onSubmit={(confirmDeletion: boolean) => {
						setShowDeleteConfirmation(false)
						handleDeleteRoom(confirmDeletion)
					}}
				/>
			}
		</div>
	)
}

export default Room
