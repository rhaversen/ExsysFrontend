import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { type PatchActivityType, type PostActivityType, type ActivityType, type RoomType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import EditableDropdown from '../../ui/EditableDropdown'
import Timestamps from '../../ui/Timestamps'
import useFormState from '@/hooks/useFormState'
import useCUDOperations from '@/hooks/useCUDOperations'

const Activity = ({
	activity,
	rooms
}: {
	activity: ActivityType
	rooms: RoomType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const { formState: newActivity, handleFieldChange, handleValidationChange, resetFormState, formIsValid } = useFormState(activity, isEditing)
	const { updateEntity, deleteEntity } = useCUDOperations<PostActivityType, PatchActivityType>('/v1/activities')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Navn'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={activity.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={50}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<p className="italic text-gray-500">{'Spisested'}</p>
					<EditableDropdown
						options={rooms.map((room) => ({
							value: room._id,
							label: room.name
						}))}
						initialValue={newActivity.roomId?._id ?? 'null-option'}
						onChange={(value) => {
							const room = rooms.find((room) => room._id === value)
							handleFieldChange('roomId', room ?? null)
						}}
						editable={isEditing}
						fieldName="roomId"
						allowNullOption={true}
						onValidationChange={handleValidationChange}
					/>
				</div>
				<Timestamps
					createdAt={activity.createdAt}
					updatedAt={activity.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						resetFormState()
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(newActivity._id, { ...newActivity, roomId: newActivity.roomId?._id ?? null })
						setIsEditing(false)
					}}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
				/>
			</div>
			{showDeleteConfirmation &&
				<ConfirmDeletion
					itemName={activity.name}
					onClose={() => {
						setShowDeleteConfirmation(false)
					}}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(activity._id, confirm)
					}}
				/>
			}
		</div>
	)
}

export default Activity
