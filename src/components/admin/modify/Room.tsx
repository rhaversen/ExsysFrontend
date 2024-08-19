import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

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

	const { addError } = useError()

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

	const handleValidationChange = useCallback((fieldName: string, v: boolean): void => {
		setFieldValidations((prev) => {
			return {
				...prev,
				[fieldName]: v
			}
		})
	}, [])

	const patchRoom = useCallback((room: RoomType, roomPatch: Omit<RoomType, '_id'>): void => {
		axios.patch(API_URL + `/v1/rooms/${room._id}`, roomPatch).then((response) => {
			onRoomPatched(response.data as RoomType)
		}).catch((error) => {
			addError(error)
			setNewRoom(room)
		})
	}, [API_URL, onRoomPatched, addError])

	const deleteRoom = useCallback((room: RoomType, confirm: boolean): void => {
		axios.delete(API_URL + `/v1/rooms/${room._id}`, {
			data: { confirm }
		}).then(() => {
			onRoomDeleted(room._id)
		}).catch((error) => {
			addError(error)
			setNewRoom(room)
		})
	}, [API_URL, onRoomDeleted, addError])

	const handleNameChange = useCallback((v: string): void => {
		setNewRoom({
			...newRoom,
			name: v
		})
	}, [newRoom])

	const handleDescriptionChange = useCallback((v: string): void => {
		setNewRoom({
			...newRoom,
			description: v
		})
	}, [newRoom])

	const handleUndoEdit = useCallback((): void => {
		setNewRoom(room)
		setIsEditing(false)
	}, [room])

	const handleCompleteEdit = useCallback((): void => {
		patchRoom(room, newRoom)
		setIsEditing(false)
	}, [patchRoom, room, newRoom])

	const handleDeleteRoom = useCallback((confirm: boolean): void => {
		deleteRoom(room, confirm)
	}, [deleteRoom, room])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName='name'
							initialText={room.name}
							placeholder='Navn'
							italic={false}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 20,
								message: 'Navn må maks være 20 tegn'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
						/>
					</div>
					<div className="text-gray-800">
						<EditableField
							fieldName='description'
							initialText={room.description}
							placeholder='Beskrivelse'
							italic={true}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 20,
								message: 'Navn må maks være 20 tegn'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handleDescriptionChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
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
		</div>
	)
}

export default Room
