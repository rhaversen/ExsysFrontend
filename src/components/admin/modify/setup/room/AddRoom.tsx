import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostRoomType, type RoomType, type ActivityType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'

const Room = ({
	rooms,
	activities,
	onClose
}: {
	rooms: RoomType[]
	activities: ActivityType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [room, setRoom] = useState<PostRoomType>({
		name: '',
		description: ''
	})
	const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([])
	const [showActivities, setShowActivities] = useState(false)
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

	const postRoom = useCallback((room: PostRoomType): void => {
		axios.post(API_URL + '/v1/rooms', room, { withCredentials: true })
			.then(async (response) => {
				const roomId = response.data._id
				// Update each selected activity to include the new room
				for (const activity of selectedActivities) {
					await axios.patch(API_URL + `/v1/activities/${activity._id}`, {
						...activity,
						rooms: [...activity.rooms.map(r => r._id), roomId]
					}, { withCredentials: true })
				}
				onClose()
			}).catch((error) => {
				addError(error)
			})
	}, [API_URL, onClose, addError, selectedActivities])

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

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postRoom(room)
	}, [postRoom, room])

	return (
		<CloseableModal onClose={onClose} canClose={!showActivities}>
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
				</div>
			</div>
			<CompletePostControls
				canClose={!showActivities}
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
		</CloseableModal>
	)
}

export default Room
