import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type PatchRoomType, type PostRoomType, type RoomType, type ActivityType, type PatchActivityType } from '@/types/backendDataTypes'
import React, { type ReactElement, useEffect, useState } from 'react'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '../../ui/ItemsDisplay'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import EntityCard from '../../ui/EntityCard'

const Room = ({
	rooms,
	room,
	activities
}: {
	rooms: RoomType[]
	room: RoomType
	activities: ActivityType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const [linkedActivities, setLinkedActivities] = useState(
		activities.filter(a => a.rooms.some(r => r._id === room._id))
	)
	const [disabledActivities, setDisabledActivities] = useState(
		activities.filter(a => a.disabledRooms.includes(room._id))
	)
	const { addError } = useError()
	const {
		formState: newRoom,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(room, isEditing)
	const {
		updateEntity: updateRoom,
		deleteEntity
	} = useCUDOperations<PostRoomType, PatchRoomType>('/v1/rooms')

	const {
		updateEntityAsync: updateActivityAsync
	} = useCUDOperations<ActivityType, PatchActivityType>('/v1/activities')

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showActivities, setShowActivities] = useState(false)
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)

	const handleActivityChange = (newActivities: ActivityType[]): void => {
		setLinkedActivities(newActivities)
	}

	useEffect(() => {
		setLinkedActivities(activities.filter(a => a.rooms.some(r => r._id === room._id)))
		setDisabledActivities(activities.filter(a => a.disabledRooms.includes(room._id)))
	}, [activities, room])

	const handleCompleteEdit = (): void => {
		// Update room first
		updateRoom(newRoom._id, newRoom)

		// Get activities that need updating for linked activities
		const currentActivities = activities.filter(a => a.rooms.some(r => r._id === room._id))
		const addedActivities = linkedActivities.filter(a => !currentActivities.some(ca => ca._id === a._id))
		const removedActivities = currentActivities.filter(ca => !linkedActivities.some(a => a._id === ca._id))

		// Get activities that need updating for disabled activities
		const currentDisabledActivities = activities.filter(a => a.disabledRooms.includes(room._id))
		const addedDisabledActivities = disabledActivities.filter(a => !currentDisabledActivities.some(ca => ca._id === a._id))
		const removedDisabledActivities = currentDisabledActivities.filter(ca => !disabledActivities.some(a => a._id === ca._id))

		Promise.all([
			// Handle linking/unlinking activities
			...addedActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					...activity,
					rooms: [...activity.rooms.map(r => r._id), room._id]
				})
			}),
			...removedActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					...activity,
					rooms: activity.rooms.filter(r => r._id !== room._id).map(r => r._id)
				})
			}),
			// Handle disabling/enabling rooms in activities
			...addedDisabledActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					disabledRooms: [...activity.disabledRooms, room._id]
				})
			}),
			...removedDisabledActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					disabledRooms: activity.disabledRooms.filter(id => id !== room._id)
				})
			})
		]).then(() => {
			setIsEditing(false)
		}).catch((error) => {
			addError(error as Error)
		})
	}

	return (
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					resetFormState()
					setLinkedActivities(activities.filter(a => a.rooms.some(r => r._id === room._id)))
					setDisabledActivities(activities.filter(a => a.disabledRooms.includes(room._id)))
					setIsEditing(false)
				}}
				onHandleCompleteEdit={handleCompleteEdit}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showActivities && !showDisabledActivities}
				createdAt={room.createdAt}
				updatedAt={room.updatedAt}
			>
				{/* Name */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="name"
							initialText={room.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={20}
							validations={[{
								validate: (v: string) => !rooms.some((room) => room.name.trim() === v.trim() && room._id !== newRoom._id),
								message: 'Navn er allerede i brug'
							}]}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Description */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Beskrivelse'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="description"
							initialText={room.description}
							placeholder="Beskrivelse"
							minSize={10}
							required={true}
							maxLength={20}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('description', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Fremhævende Activities */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævende Aktiviteter'}</div>
					<div className="flex flex-col items-center justify-center">
						{linkedActivities.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={linkedActivities}
							editable={isEditing}
							onDeleteItem={(v) => { handleActivityChange(linkedActivities.filter((activity) => activity._id !== v._id)) }}
							onShowItems={() => { setShowActivities(true) }}
						/>
					</div>
				</div>

				{/* Disabled Activities */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Aktiviteter'}</div>
					<div className="flex flex-col items-center justify-center">
						{disabledActivities.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={disabledActivities}
							editable={isEditing}
							onDeleteItem={(v) => { setDisabledActivities(disabledActivities.filter((activity) => activity._id !== v._id)) }}
							onShowItems={() => { setShowDisabledActivities(true) }}
						/>
					</div>
				</div>
			</EntityCard>

			{showDeleteConfirmation && (
				<ConfirmDeletion
					itemName={room.name}
					onClose={() => { setShowDeleteConfirmation(false) }}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(room._id, confirm)
					}}
				/>
			)}

			{showActivities && (
				<SelectionWindow
					title={`Tilføj Fremhævende Aktiviteter til ${newRoom.name}`}
					items={activities}
					selectedItems={linkedActivities}
					onAddItem={(v) => { handleActivityChange([...linkedActivities, v]) }}
					onDeleteItem={(v) => { handleActivityChange(linkedActivities.filter((activity) => activity._id !== v._id)) }}
					onClose={() => { setShowActivities(false) }}
				/>
			)}

			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj Deaktiverede Aktiviteter til ${newRoom.name}`}
					items={activities}
					selectedItems={disabledActivities}
					onAddItem={(v) => { setDisabledActivities([...disabledActivities, v]) }}
					onDeleteItem={(v) => { setDisabledActivities(disabledActivities.filter((activity) => activity._id !== v._id)) }}
					onClose={() => { setShowDisabledActivities(false) }}
				/>
			)}
		</>
	)
}

export default Room
