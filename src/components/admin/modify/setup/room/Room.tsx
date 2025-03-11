import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type PatchRoomType, type PostRoomType, type RoomType, type ActivityType, type PatchActivityType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import Timestamps from '../../ui/Timestamps'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '../../ui/ItemsDisplay'

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
		updateEntity: updateActivity
	} = useCUDOperations<ActivityType, PatchActivityType>('/v1/activities')

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showActivities, setShowActivities] = useState(false)

	const handleActivityChange = (newActivities: ActivityType[]): void => {
		setLinkedActivities(newActivities)
	}

	useEffect(() => {
		setLinkedActivities(activities.filter(a => a.rooms.some(r => r._id === room._id)))
	}, [activities, room])

	const handleCompleteEdit = (): void => {
		// Update room first
		updateRoom(newRoom._id, newRoom)

		// Get activities that need updating
		const currentActivities = activities.filter(a => a.rooms.some(r => r._id === room._id))
		const addedActivities = linkedActivities.filter(a => !currentActivities.some(ca => ca._id === a._id))
		const removedActivities = currentActivities.filter(ca => !linkedActivities.some(a => a._id === ca._id))

		// Update activities that need changes
		for (const activity of addedActivities) {
			updateActivity(activity._id, {
				...activity,
				rooms: [...activity.rooms.map(r => r._id), room._id]
			})
		}

		for (const activity of removedActivities) {
			updateActivity(activity._id, {
				...activity,
				rooms: activity.rooms.filter(r => r._id !== room._id).map(r => r._id)
			})
		}

		setIsEditing(false)
	}

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
					{linkedActivities.length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilknyttede Aktiviteter:'}</p>
					)}
					{linkedActivities.length === 0 && !isEditing && (
						<p className="italic text-gray-500 pt-2">{'Ingen Aktiviteter Tilknyttet'}</p>
					)}
					{linkedActivities.length === 0 && isEditing && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter'}</p>
					)}
					<div className="flex flex-row flex-wrap max-w-52">
						<ItemsDisplay
							items={linkedActivities}
							editable={isEditing}
							onDeleteItem={(v) => { handleActivityChange(linkedActivities.filter((activity) => activity._id !== v._id)) }}
							onShowItems={() => {
								setShowActivities(true)
							}}
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
						setLinkedActivities(activities.filter(a => a.rooms.some(r => r._id === room._id)))
						setIsEditing(false)
					}}
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
						deleteEntity(room._id, confirm)
					}}
				/>
			}
			{showActivities &&
				<SelectionWindow
					title={`Tilføj Aktiviteter til ${newRoom.name}`}
					items={activities}
					selectedItems={linkedActivities}
					onAddItem={(v) => { handleActivityChange([...linkedActivities, v]) }}
					onDeleteItem={(v) => { handleActivityChange(linkedActivities.filter((activity) => activity._id !== v._id)) }}
					onClose={() => {
						setShowActivities(false)
					}}
				/>
			}
		</div>
	)
}

export default Room
