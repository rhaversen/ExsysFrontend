import { type RoomType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import axios from 'axios'
import ErrorWindow from '@/components/ui/ErrorWindow'

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

	const [backendErrorMessages, setBackendErrorMessages] = useState<string | null>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [newRoom, setNewRoom] = useState<RoomType>(room)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

	// Update formIsValid when fieldValidations change
	useEffect(() => {
		const formIsValid = Object.values(fieldValidations).every((v) => v)
		setFormIsValid(formIsValid)
	}, [fieldValidations])

	// Reset validation errors when not editing (e.g. when editing is cancelled or completed, meaning validation errors are no longer relevant)
	useEffect(() => {
		if (isEditing) return
		setFormIsValid(true)
	}, [isEditing])

	const handleValidationChange = useCallback((fieldId: string, v: boolean): void => {
		setFieldValidations((prev) => {
			return {
				...prev,
				[fieldId]: v
			}
		})
	}, [])

	const patchRoom = (room: RoomType, roomPatch: Omit<RoomType, '_id'>): void => {
		axios.patch(API_URL + `/v1/rooms/${room._id}`, roomPatch).then((response) => {
			onRoomPatched(response.data as RoomType)
		}).catch((error) => {
			console.error('Error updating room:', error)
			setNewRoom(room)
			setBackendErrorMessages(error.response.data.error as string)
		})
	}

	const deleteRoom = (room: RoomType, confirm: boolean): void => {
		axios.delete(API_URL + `/v1/rooms/${room._id}`, {
			data: { confirm }
		}).then(() => {
			onRoomDeleted(room._id)
		}).catch((error) => {
			console.error('Error deleting room:', error)
			setNewRoom(room)
			setBackendErrorMessages(error.response.data.error as string)
		})
	}

	const handleNameChange = (v: string): void => {
		setNewRoom({
			...newRoom,
			name: v
		})
	}

	const handleDescriptionChange = (v: string): void => {
		setNewRoom({
			...newRoom,
			description: v
		})
	}

	const handleUndoEdit = (): void => {
		setNewRoom(room)
		setIsEditing(false)
	}

	const handleCompleteEdit = (): void => {
		patchRoom(room, newRoom)
		setIsEditing(false)
	}

	const handleDeleteRoom = (confirm: boolean): void => {
		deleteRoom(room, confirm)
	}

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							text={newRoom.name}
							italic={false}
							validations={[{
								validate: (v: string) => v.length > 0,
								message: 'Navn skal udfyldes'
							}]}
							editable={isEditing}
							edited={newRoom.name !== room.name}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
							onValidationChange={(v: boolean) => {
								handleValidationChange('name', v)
							}}
						/>
					</div>
					<div className="text-gray-800">
						<EditableField
							text={newRoom.description}
							italic={true}
							validations={[{
								validate: (v: string) => v.length > 0,
								message: 'Beskrivelse skal udfyldes'
							}]}
							editable={isEditing}
							edited={newRoom.description !== room.description}
							onChange={(v: string) => {
								handleDescriptionChange(v)
							}}
							onValidationChange={(v: boolean) => {
								handleValidationChange('description', v)
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
					formIsValid={formIsValid}
				/>
			</div>
			{showDeleteConfirmation &&
				<ConfirmDeletion
					itemName={room.name}
					onClose={() => {
						setShowDeleteConfirmation(false)
					}}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						handleDeleteRoom(confirm)
					}}
				/>
			}
			{backendErrorMessages !== null &&
				<ErrorWindow
					onClose={() => {
						setBackendErrorMessages(null)
					}}
					errorMessage={backendErrorMessages}
				/>
			}
		</div>
	)
}

export default Room
