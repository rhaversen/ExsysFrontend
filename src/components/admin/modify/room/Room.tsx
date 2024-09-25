import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PatchRoomType, type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Timestamps from '../ui/Timestamps'

const Room = ({
	rooms,
	room
}: {
	rooms: RoomType[]
	room: RoomType
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

	const patchRoom = useCallback((roomPatch: PatchRoomType): void => {
		axios.patch(API_URL + `/v1/rooms/${room._id}`, roomPatch, { withCredentials: true }).catch((error) => {
			addError(error)
			setNewRoom(room)
		})
	}, [API_URL, addError, room])

	const deleteRoom = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/rooms/${room._id}`, {
			data: { confirm },
			withCredentials: true
		}).catch((error) => {
			addError(error)
			setNewRoom(room)
		})
	}, [API_URL, addError, room])

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
		patchRoom(newRoom)
		setIsEditing(false)
	}, [patchRoom, newRoom])

	const handleDeleteRoom = useCallback((confirm: boolean): void => {
		deleteRoom(confirm)
	}, [deleteRoom])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Navn'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={room.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={20}
							validations={[{
								validate: (v: string) => !rooms.some((room) => room.name === v && room._id !== newRoom._id),
								message: 'Navn er allerede i brug'
							}]}
							editable={isEditing}
							onChange={handleNameChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<p className="italic text-gray-500">{'Beskrivelse'}</p>
					<div className="text-gray-800">
						<EditableField
							fieldName="description"
							initialText={room.description}
							placeholder="Beskrivelse"
							italic={true}
							minSize={10}
							required={true}
							maxLength={20}
							editable={isEditing}
							onChange={handleDescriptionChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>
				<Timestamps
					createdAt={room.createdAt}
					updatedAt={room.updatedAt}
				/>
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
