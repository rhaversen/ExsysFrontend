import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import {
	type ActivityType,
	type PatchActivityType,
	type PostActivityType,
	type RoomType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import SelectionWindow from '../../ui/SelectionWindow'
import Timestamps from '../../ui/Timestamps'
import ItemsDisplay from '../../ui/ItemsDisplay'

const Activity = ({
	activity,
	rooms
}: {
	activity: ActivityType
	rooms: RoomType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const {
		formState: newActivity,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(activity, isEditing)
	const {
		updateEntity,
		deleteEntity
	} = useCUDOperations<PostActivityType, PatchActivityType>('/v1/activities')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showRooms, setShowRooms] = useState(false)

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
					{activity.rooms.length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilknyttede Spisesteder:'}</p>
					)}
					{activity.rooms.length === 0 && !isEditing && (
						<p className="italic text-gray-500 pt-2">{'Ingen Spisesteder Tilknyttet'}</p>
					)}
					{activity.rooms.length === 0 && isEditing && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Spisesteder'}</p>
					)}
					<div className="flex flex-row flex-wrap max-w-52">
						<ItemsDisplay
							items={newActivity.rooms}
							editable={isEditing}
							onDeleteItem={(v) => { handleFieldChange('rooms', newActivity.rooms.filter((room) => room._id !== v._id)) }}
							onShowItems={() => {
								setShowRooms(true)
							}}
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
							updateEntity(newActivity._id, {
								...newActivity,
								rooms: newActivity.rooms.map(room => room._id)
							})
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
				{showRooms &&
					<SelectionWindow
						title={`Tilføj Spisesteder til ${newActivity.name}`}
						items={rooms}
						selectedItems={newActivity.rooms}
						onAddItem={(v) => { handleFieldChange('rooms', [...newActivity.rooms, { ...v, _id: v._id }]) }}
						onDeleteItem={(v) => { handleFieldChange('rooms', newActivity.rooms.filter((room) => room._id !== v._id)) }}
						onClose={() => {
							setShowRooms(false)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Activity
