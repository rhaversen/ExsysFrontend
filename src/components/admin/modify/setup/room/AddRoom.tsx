import Image from 'next/image'
import { type ReactElement, useCallback, useEffect, useState } from 'react'

import EditableField from '@/components/admin/modify/ui/EditableField'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useCUDOperations from '@/hooks/useCUDOperations'
import { AdminImages } from '@/lib/images'
import { type PostRoomType, type RoomType, type ActivityType, type PostActivityType, PatchRoomType, PatchActivityType } from '@/types/backendDataTypes'

import SelectionWindow from '../../ui/SelectionWindow'

const AddRoom = ({
	rooms,
	activities,
	onClose
}: {
	rooms: RoomType[]
	activities: ActivityType[]
	onClose: () => void
}): ReactElement => {
	const { addError } = useError()
	const { createEntityAsync: createRoomAsync } = useCUDOperations<PostRoomType, PatchRoomType, RoomType>('/v1/rooms')
	const { updateEntityAsync: updateActivityAsync } = useCUDOperations<PostActivityType, PatchActivityType, ActivityType>('/v1/activities')

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
						rooms: activity.rooms.map(r => typeof r === 'string' ? r : r._id),
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

	const handleCancel = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleAdd = useCallback((): void => {
		if (!formIsValid) { return }
		postRoom(room).catch((error) => {
			addError(error as Error)
		})
	}, [addError, postRoom, room, formIsValid])

	return (
		<>
			<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
				<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
					<span className="font-medium text-blue-700">{'Nyt Spisested'}</span>
				</div>
				<div className="flex flex-wrap">
					{/* 1. Navn */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
						<div className="font-bold text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="name"
								initialText=""
								placeholder="Navn"
								minSize={10}
								required={true}
								onChange={handleNameChange}
								maxLength={50}
								validations={[{
									validate: (v: string) => !rooms.some((room) => room.name.trim().toLowerCase() === v.trim().toLowerCase()),
									message: 'Navn er allerede i brug'
								}]}
								editable={true}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>

					{/* 2. Beskrivelse */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Beskrivelse'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="description"
								initialText=""
								placeholder="Beskrivelse"
								minSize={10}
								required={true}
								onChange={handleDescriptionChange}
								maxLength={50}
								editable={true}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>

					{/* 3. Fremhævende Aktiviteter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævende Aktiviteter'}</div>
						<div className="flex flex-col items-center justify-center">
							{selectedActivities.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={selectedActivities}
								editable={true}
								onDeleteItem={handleDeleteActivity}
								onShowItems={() => { setShowActivities(true) }}
							/>
						</div>
					</div>

					{/* 4. Deaktiverede aktiviteter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Aktiviteter'}</div>
						<div className="flex flex-col items-center justify-center">
							{disabledActivities.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={disabledActivities}
								editable={true}
								onDeleteItem={handleDeleteDisabledActivity}
								onShowItems={() => { setShowDisabledActivities(true) }}
							/>
						</div>
					</div>
				</div>
				<div className="flex justify-end p-2 gap-2">
					<button
						onClick={handleCancel}
						className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
						type="button"
					>
						{'Annuller\r'}
					</button>
					<button
						onClick={handleAdd}
						disabled={!formIsValid}
						className={`px-3 py-1 text-sm rounded-full flex items-center ${
							formIsValid
								? 'bg-blue-600 hover:bg-blue-700 text-white'
								: 'bg-gray-200 text-gray-400 cursor-not-allowed'
						}`}
						type="button"
					>
						<Image className="h-4 w-4 mr-1" src={AdminImages.add.src} alt={AdminImages.add.alt} width={16} height={16} />
						{'Opret\r'}
					</button>
				</div>
			</div>

			{showActivities && (
				<SelectionWindow
					title={`Tilføj Fremhævende Aktiviteter til ${room.name === '' ? 'Nyt Spisested' : room.name}`}
					items={activities.map(a => ({
						...a,
						// Disable if already in disabledActivities
						disabled: disabledActivities.some(da => da._id === a._id)
					}))}
					selectedItems={selectedActivities}
					onAddItem={handleAddActivity}
					onDeleteItem={handleDeleteActivity}
					onClose={() => { setShowActivities(false) }}
				/>
			)}

			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj Deaktiverede Aktiviteter til ${room.name === '' ? 'Nyt Spisested' : room.name}`}
					items={activities.map(a => ({
						...a,
						// Disable if already in selectedActivities
						disabled: selectedActivities.some(sa => sa._id === a._id)
					}))}
					selectedItems={disabledActivities}
					onAddItem={handleAddDisabledActivity}
					onDeleteItem={handleDeleteDisabledActivity}
					onClose={() => { setShowDisabledActivities(false) }}
				/>
			)}
		</>
	)
}

export default AddRoom
