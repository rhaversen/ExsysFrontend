import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostRoomType, type RoomType, type ActivityType, type PostActivityType } from '@/types/backendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import useCUDOperations from '@/hooks/useCUDOperations'

const Room = ({
	rooms,
	activities,
	onClose
}: {
	rooms: RoomType[]
	activities: ActivityType[]
	onClose: () => void
}): ReactElement => {
	const { addError } = useError()
	const { createEntityAsync: createRoomAsync } = useCUDOperations<PostRoomType, any, RoomType>('/v1/rooms')
	const { updateEntityAsync: updateActivityAsync } = useCUDOperations<PostActivityType, any, ActivityType>('/v1/activities')

	const [room, setRoom] = useState<PostRoomType>({
		name: '',
		description: ''
	})
	const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([])
	const [disabledActivities, setDisabledActivities] = useState<ActivityType[]>([])
	const [showActivities, setShowActivities] = useState(false)
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(false)

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

	const postRoom = useCallback(async (room: PostRoomType): Promise<void> => {
		try {
			const createdRoom = await createRoomAsync(room)

			// Update activities that link to this room
			await Promise.all(
				selectedActivities.map(async activity =>
					await updateActivityAsync(activity._id, {
						...activity,
						rooms: [...activity.rooms.map(r => r._id), createdRoom._id]
					})
				)
			)

			// Update activities that have this room disabled
			await Promise.all(
				disabledActivities.map(async activity =>
					await updateActivityAsync(activity._id, {
						...activity,
						disabledRooms: [...activity.disabledRooms, createdRoom._id]
					})
				)
			)
		} catch (error) {
			addError(error as Error)
		}
		onClose()
	}, [createRoomAsync, selectedActivities, disabledActivities, updateActivityAsync, addError, onClose])

	const handleNameChange = useCallback((v: string): void => {
		setRoom(prev => ({
			...prev,
			name: v
		}))
	}, [])

	const handleDescriptionChange = useCallback((v: string): void => {
		setRoom(prev => ({
			...prev,
			description: v
		}))
	}, [])

	const handleAddActivity = useCallback((activity: ActivityType): void => {
		setSelectedActivities(prev => [...prev, activity])
	}, [])

	const handleDeleteActivity = useCallback((activity: ActivityType): void => {
		setSelectedActivities(prev => prev.filter(a => a._id !== activity._id))
	}, [])

	const handleAddDisabledActivity = useCallback((activity: ActivityType): void => {
		setDisabledActivities(prev => [...prev, activity])
	}, [])

	const handleDeleteDisabledActivity = useCallback((activity: ActivityType): void => {
		setDisabledActivities(prev => prev.filter(a => a._id !== activity._id))
	}, [])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postRoom(room).catch((error) => {
			addError(error as Error)
		})
	}, [addError, postRoom, room])

	return (
		<CloseableModal onClose={onClose} canClose={!showActivities && !showDisabledActivities}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Spisested'}</p>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							minSize={10}
							required={true}
							onChange={handleNameChange}
							maxLength={50}
							validations={[{
								validate: (v: string) => !rooms.some((room) => room.name === v),
								message: 'Navn er allerede i brug'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="text-gray-800">
						<EditableField
							fieldName="description"
							placeholder="Beskrivelse"
							italic={true}
							minSize={10}
							required={true}
							onChange={handleDescriptionChange}
							maxLength={50}
							onValidationChange={handleValidationChange}
						/>
					</div>
					{selectedActivities.length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Aktiviteter:'}</p>
					)}
					{selectedActivities.length === 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter:'}</p>
					)}
					<ItemsDisplay
						items={selectedActivities}
						onDeleteItem={handleDeleteActivity}
						onShowItems={() => { setShowActivities(true) }}
					/>

					{disabledActivities.length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Deaktiverede Aktiviteter:'}</p>
					)}
					{disabledActivities.length === 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Deaktiverede Aktiviteter:'}</p>
					)}
					<ItemsDisplay
						items={disabledActivities}
						onDeleteItem={handleDeleteDisabledActivity}
						onShowItems={() => { setShowDisabledActivities(true) }}
					/>
				</div>
			</div>
			<CompletePostControls
				canClose={!showActivities && !showDisabledActivities}
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
			{showActivities && (
				<SelectionWindow
					title={`Tilføj Aktiviteter til ${room.name === '' ? 'Nyt Spisested' : room.name}`}
					items={activities}
					selectedItems={selectedActivities}
					onAddItem={handleAddActivity}
					onDeleteItem={handleDeleteActivity}
					onClose={() => { setShowActivities(false) }}
				/>
			)}

			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj Deaktiverede Aktiviteter til ${room.name === '' ? 'Nyt Spisested' : room.name}`}
					items={activities}
					selectedItems={disabledActivities}
					onAddItem={handleAddDisabledActivity}
					onDeleteItem={handleDeleteDisabledActivity}
					onClose={() => { setShowDisabledActivities(false) }}
				/>
			)}
		</CloseableModal>
	)
}

export default Room
