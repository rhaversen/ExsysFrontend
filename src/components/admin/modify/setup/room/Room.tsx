import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { type PostRoomType, type PatchRoomType, type RoomType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import Timestamps from '../../ui/Timestamps'
import useFormState from '@/hooks/useFormState'
import useCUDOperations from '@/hooks/useCUDOperations'

const Room = ({
	rooms,
	room
}: {
	rooms: RoomType[]
	room: RoomType
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const { formState: newRoom, handleFieldChange, handleValidationChange, resetFormState, formIsValid } = useFormState(room, isEditing)
	const { updateEntity, deleteEntity } = useCUDOperations<PostRoomType, PatchRoomType>('/v1/rooms')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

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
							onChange={(value) => { handleFieldChange('name', value) }}
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
							onChange={(value) => { handleFieldChange('description', value) }}
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
					handleUndoEdit={() => {
						resetFormState()
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(newRoom._id, newRoom)
						setIsEditing(false)
					}}
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
						deleteEntity(room._id, confirm)
					}}
				/>
			}
		</div>
	)
}

export default Room
