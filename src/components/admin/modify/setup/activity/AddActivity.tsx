import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType, type KioskType, type ActivityType, type PostActivityType, type ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'

const AddActivity = ({
	rooms,
	activities,
	kiosks,
	products,
	onClose
}: {
	rooms: RoomType[]
	activities: ActivityType[]
	kiosks: KioskType[]
	products: ProductType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [activity, setActivity] = useState<PostActivityType>({
		name: '',
		rooms: [],
		disabledRooms: [],
		disabledProducts: []
	})
	const [selectedKiosks, setSelectedKiosks] = useState<KioskType[]>([])
	const [showRooms, setShowRooms] = useState(false)
	const [showKiosks, setShowKiosks] = useState(false)
	const [showDisabledRooms, setShowDisabledRooms] = useState(false)
	const [showDisabledProducts, setShowDisabledProducts] = useState(false)
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

	const handleAddDisabledRoom = useCallback((v: RoomType): void => {
		setActivity({
			...activity,
			disabledRooms: [...(activity.disabledRooms ?? []), v._id]
		})
	}, [activity])

	const handleDeleteDisabledRoom = useCallback((v: RoomType): void => {
		setActivity({
			...activity,
			disabledRooms: (activity.disabledRooms ?? []).filter((id) => id !== v._id)
		})
	}, [activity])

	const handleAddDisabledProduct = useCallback((v: ProductType): void => {
		setActivity({
			...activity,
			disabledProducts: [...(activity.disabledProducts ?? []), v._id]
		})
	}, [activity])

	const handleDeleteDisabledProduct = useCallback((v: ProductType): void => {
		setActivity({
			...activity,
			disabledProducts: (activity.disabledProducts ?? []).filter((id) => id !== v._id)
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
		<CloseableModal onClose={onClose} canClose={!showRooms && !showKiosks && !showDisabledRooms && !showDisabledProducts}>
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

					{(activity.disabledRooms ?? []).length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Deaktiverede Spisesteder:'}</p>
					)}
					{(activity.disabledRooms ?? []).length === 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Deaktiverede Spisesteder:'}</p>
					)}
					<ItemsDisplay
						items={rooms.filter((r) => (activity.disabledRooms ?? []).includes(r._id))}
						onDeleteItem={handleDeleteDisabledRoom}
						onShowItems={() => { setShowDisabledRooms(true) }}
					/>

					{(activity.disabledProducts ?? []).length > 0 && (
						<p className="italic text-gray-500 pt-2">{'Deaktiverede Produkter:'}</p>
					)}
					{(activity.disabledProducts ?? []).length === 0 && (
						<p className="italic text-gray-500 pt-2">{'Tilføj Deaktiverede Produkter:'}</p>
					)}
					<ItemsDisplay
						items={products.filter((p) => (activity.disabledProducts ?? []).includes(p._id))}
						onDeleteItem={handleDeleteDisabledProduct}
						onShowItems={() => { setShowDisabledProducts(true) }}
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

					{showDisabledRooms && (
						<SelectionWindow
							title={`Tilføj Deaktiverede Spisesteder til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
							items={rooms}
							selectedItems={rooms.filter((r) => (activity.disabledRooms ?? []).includes(r._id))}
							onAddItem={handleAddDisabledRoom}
							onDeleteItem={handleDeleteDisabledRoom}
							onClose={() => { setShowDisabledRooms(false) }}
						/>
					)}

					{showDisabledProducts && (
						<SelectionWindow
							title={`Tilføj Deaktiverede Produkter til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
							items={products}
							selectedItems={products.filter((p) => (activity.disabledProducts ?? []).includes(p._id))}
							onAddItem={handleAddDisabledProduct}
							onDeleteItem={handleDeleteDisabledProduct}
							onClose={() => { setShowDisabledProducts(false) }}
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
				canClose={!showRooms && !showKiosks && !showDisabledRooms && !showDisabledProducts}
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default AddActivity
