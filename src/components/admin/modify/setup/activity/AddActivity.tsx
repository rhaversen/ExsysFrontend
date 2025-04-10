import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType, type KioskType, type ActivityType, type PostActivityType, type ProductType, type PatchKioskType } from '@/types/backendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import useCUDOperations from '@/hooks/useCUDOperations'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

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
	const { updateEntityAsync: updateKioskAsync } = useCUDOperations<KioskType, PatchKioskType>('/v1/kiosks')

	const [activity, setActivity] = useState<PostActivityType>({
		name: '',
		rooms: [],
		disabledRooms: [],
		disabledProducts: []
	})
	const [selectedKiosks, setSelectedKiosks] = useState<KioskType[]>([])
	const [disabledKiosks, setDisabledKiosks] = useState<KioskType[]>([])
	const [showRooms, setShowRooms] = useState(false)
	const [showKiosks, setShowKiosks] = useState(false)
	const [showDisabledKiosks, setShowDisabledKiosks] = useState(false)
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
		fetch(`${API_URL}/v1/activities`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify(activity)
		})
			.then(async response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}
				return await response.json()
			})
			.then(async (response) => {
				const activityId = response._id
				try {
					// Update each selected kiosk to include the new activity
					await Promise.all(selectedKiosks.map(async kiosk => {
						await updateKioskAsync(kiosk._id, {
							activities: [...kiosk.activities.map(a => a._id), activityId]
						})
					}
					))

					// Update each disabled kiosk to include the activity in disabledActivities
					await Promise.all(disabledKiosks.map(async kiosk => {
						await updateKioskAsync(kiosk._id, {
							disabledActivities: [...kiosk.disabledActivities, activityId]
						})
					}
					))

					onClose()
				} catch (error) {
					addError(error as Error)
				}
			}).catch((error) => {
				addError(error)
			})
	}, [API_URL, onClose, addError, selectedKiosks, disabledKiosks, updateKioskAsync])

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

	const handleAddDisabledKiosk = useCallback((kiosk: KioskType): void => {
		setDisabledKiosks(prev => [...prev, kiosk])
	}, [])

	const handleDeleteDisabledKiosk = useCallback((kiosk: KioskType): void => {
		setDisabledKiosks(prev => prev.filter(k => k._id !== kiosk._id))
	}, [])

	const handleCancel = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleAdd = useCallback((): void => {
		if (!formIsValid) return
		postActivity(activity)
	}, [activity, postActivity, formIsValid])

	return (
		<>
			<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
				<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
					<span className="font-medium text-blue-700">{'Ny Aktivitet'}</span>
				</div>
				<div className="flex flex-wrap">
					{/* 1. Navn */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
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
								editable={true}
								initialText=""
							/>
						</div>
					</div>

					{/* 2. Fremhævede Spisesteder */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævede Spisesteder'}</div>
						<div className="flex flex-col items-center justify-center">
							{(activity.rooms ?? []).length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={rooms.filter((r) => (activity.rooms ?? []).includes(r._id))}
								editable={true}
								onDeleteItem={handleDeleteRoom}
								onShowItems={() => { setShowRooms(true) }}
							/>
						</div>
					</div>

					{/* 3. Deaktiverede Spisesteder */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Spisesteder'}</div>
						<div className="flex flex-col items-center justify-center">
							{(activity.disabledRooms ?? []).length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={rooms.filter((r) => (activity.disabledRooms ?? []).includes(r._id))}
								editable={true}
								onDeleteItem={handleDeleteDisabledRoom}
								onShowItems={() => { setShowDisabledRooms(true) }}
							/>
						</div>
					</div>

					{/* 4. Deaktiverede produkter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Produkter'}</div>
						<div className="flex flex-col items-center justify-center">
							{(activity.disabledProducts ?? []).length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={products.filter((p) => (activity.disabledProducts ?? []).includes(p._id))}
								editable={true}
								onDeleteItem={handleDeleteDisabledProduct}
								onShowItems={() => { setShowDisabledProducts(true) }}
							/>
						</div>
					</div>

					{/* 5. Fremhævende Kiosker */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævende Kiosker'}</div>
						<div className="flex flex-col items-center justify-center">
							{selectedKiosks.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={selectedKiosks}
								editable={true}
								onDeleteItem={handleDeleteKiosk}
								onShowItems={() => { setShowKiosks(true) }}
							/>
						</div>
					</div>

					{/* 6. Deaktiverede Kiosker */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Kiosker'}</div>
						<div className="flex flex-col items-center justify-center">
							{disabledKiosks.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={disabledKiosks}
								editable={true}
								onDeleteItem={handleDeleteDisabledKiosk}
								onShowItems={() => { setShowDisabledKiosks(true) }}
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

			{showRooms && (
				<SelectionWindow
					title={`Tilføj Fremhævede Spisesteder til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
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
					title={`Tilføj Fremhævende Kiosker til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
					items={kiosks}
					selectedItems={selectedKiosks}
					onAddItem={handleAddKiosk}
					onDeleteItem={handleDeleteKiosk}
					onClose={() => { setShowKiosks(false) }}
				/>
			)}

			{showDisabledKiosks && (
				<SelectionWindow
					title={`Tilføj Deaktiverede Kiosker til ${activity.name === '' ? 'Ny Aktivitet' : activity.name}`}
					items={kiosks}
					selectedItems={disabledKiosks}
					onAddItem={handleAddDisabledKiosk}
					onDeleteItem={handleDeleteDisabledKiosk}
					onClose={() => { setShowDisabledKiosks(false) }}
				/>
			)}
		</>
	)
}

export default AddActivity
