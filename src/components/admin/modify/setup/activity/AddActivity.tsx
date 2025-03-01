import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType, type KioskType, type ActivityType, type PostActivityType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'

const AddActivity = ({
	rooms,
	activities,
	kiosks,
	onClose
}: {
	rooms: RoomType[]
	activities: ActivityType[]
	kiosks: KioskType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [activity, setActivity] = useState<PostActivityType>({
		name: '',
		rooms: []
	})
	const [selectedKiosks, setSelectedKiosks] = useState<KioskType[]>([])
	const [showRooms, setShowRooms] = useState(false)
	const [showKiosks, setShowKiosks] = useState(false)
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

	const postActivity = useCallback((activity: PostActivityType): void => {
		axios.post(API_URL + '/v1/activities', activity, { withCredentials: true })
			.then(async (response) => {
				const activityId = response.data._id
				// Update each selected kiosk to include the new activity
				for (const kiosk of selectedKiosks) {
					await axios.patch(API_URL + `/v1/kiosks/${kiosk._id}`, {
						...kiosk,
						activities: [...kiosk.activities.map(a => a._id), activityId]
					}, { withCredentials: true })
				}
				onClose()
			}).catch((error) => {
				addError(error)
			})
	}, [API_URL, onClose, addError, selectedKiosks])

	const handleNameChange = useCallback((v: string): void => {
		setActivity({
			...activity,
			name: v
		})
	}, [activity])

	const handleAddRoom = useCallback((v: RoomType): void => {
		setActivity({
			...activity,
			rooms: [...(activity.rooms ?? []), v._id]
		})
	}, [activity])

	const handleDeleteRoom = useCallback((v: RoomType): void => {
		setActivity({
			...activity,
			rooms: (activity.rooms ?? []).filter((id) => id !== v._id)
		})
	}, [activity])

	const handleAddKiosk = useCallback((kiosk: KioskType): void => {
		setSelectedKiosks(prev => [...prev, kiosk])
	}, [])

	const handleDeleteKiosk = useCallback((kiosk: KioskType): void => {
		setSelectedKiosks(prev => prev.filter(k => k._id !== kiosk._id))
	}, [])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postActivity(activity)
	}, [postActivity, activity])

	return (
		<CloseableModal onClose={onClose} canClose={!showRooms && !showKiosks}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Aktivitet'}</p>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => !activities.some((a) => a.name === v),
								message: 'Navn er allerede i brug'
							}]}
							onChange={handleNameChange}
							maxLength={50}
							onValidationChange={handleValidationChange}
						/>
					</div>
					{(activity.rooms ?? []).length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Spisesteder:'}</p>
					)}
					{(activity.rooms ?? []).length === 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Spisesteder:'}</p>
					)}
					<ItemsDisplay
						items={rooms.filter((r) => (activity.rooms ?? []).includes(r._id))}
						onDeleteItem={handleDeleteRoom}
						onShowItems={() => { setShowRooms(true) }}
					/>
					{selectedKiosks.length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Kiosker:'}</p>
					)}
					{selectedKiosks.length === 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Kiosker:'}</p>
					)}
					<ItemsDisplay
						items={selectedKiosks}
						onDeleteItem={handleDeleteKiosk}
						onShowItems={() => { setShowKiosks(true) }}
					/>
					{showRooms && (
						<SelectionWindow
							title={`Tilføj Spisesteder til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
							items={rooms}
							selectedItems={rooms.filter((r) => (activity.rooms ?? []).includes(r._id))}
							onAddItem={handleAddRoom}
							onDeleteItem={handleDeleteRoom}
							onClose={() => { setShowRooms(false) }}
						/>
					)}
					{showKiosks && (
						<SelectionWindow
							title={`Tilføj Kiosker til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
							items={kiosks}
							selectedItems={selectedKiosks}
							onAddItem={handleAddKiosk}
							onDeleteItem={handleDeleteKiosk}
							onClose={() => { setShowKiosks(false) }}
						/>
					)}
				</div>
			</div>
			<CompletePostControls
				canClose={!showRooms && !showKiosks}
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default AddActivity
