import { type ReactElement, useEffect, useState } from 'react'

import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import {
	type ActivityType,
	type PatchActivityType,
	type PostActivityType,
	type RoomType,
	type KioskType,
	type PatchKioskType,
	type ProductType
} from '@/types/backendDataTypes'

import EntityCard from '../../ui/EntityCard'
import ItemsDisplay from '../../ui/ItemsDisplay'
import SelectionWindow from '../../ui/SelectionWindow'

const Activity = ({
	activity,
	activities,
	rooms,
	kiosks,
	products
}: {
	activity: ActivityType
	activities: ActivityType[]
	rooms: RoomType[]
	kiosks: KioskType[]
	products: ProductType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const [linkedKiosks, setLinkedKiosks] = useState(
		kiosks.filter(k => k.enabledActivities.some(a => a === activity._id))
	)
	const {
		formState: newActivity,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(activity, isEditing)
	const {
		updateEntity: updateActivity,
		deleteEntity
	} = useCUDOperations<PostActivityType, PatchActivityType>('/v1/activities')
	const {
		updateEntity: updateKiosk
	} = useCUDOperations<KioskType, PatchKioskType>('/v1/kiosks')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showRooms, setShowRooms] = useState(false)
	const [showKiosks, setShowKiosks] = useState(false)
	const [showDisabledProducts, setShowDisabledProducts] = useState(false)

	const handleKioskChange = (newKiosks: KioskType[]): void => {
		setLinkedKiosks(newKiosks)
	}

	useEffect(() => {
		setLinkedKiosks(kiosks.filter(k => k.enabledActivities.some(a => a === activity._id)))
	}, [kiosks, activity])

	const handleCompleteEdit = (): void => {
		// Update activity first
		const activityUpdate: PatchActivityType = {
			name: newActivity.name,
			enabledRooms: newActivity.enabledRooms,
			disabledProducts: newActivity.disabledProducts
		}
		updateActivity(newActivity._id, activityUpdate)

		// Get kiosks that need updating for linked kiosks
		const currentKiosks = kiosks.filter(k => k.enabledActivities.some(a => a === activity._id))
		const addedKiosks = linkedKiosks.filter(k => !currentKiosks.some(ck => ck._id === k._id))
		const removedKiosks = currentKiosks.filter(ck => !linkedKiosks.some(k => k._id === ck._id))

		// Update kiosks that need changes for linking
		for (const kiosk of addedKiosks) {
			const kioskUpdate: PatchKioskType = {
				name: kiosk.name,
				enabledActivities: [...kiosk.enabledActivities, activity._id]
			}
			updateKiosk(kiosk._id, kioskUpdate)
		}

		for (const kiosk of removedKiosks) {
			const kioskUpdate: PatchKioskType = {
				name: kiosk.name,
				enabledActivities: kiosk.enabledActivities.filter(a => a !== activity._id)
			}
			updateKiosk(kiosk._id, kioskUpdate)
		}

		setIsEditing(false)
	}

	return (
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					resetFormState()
					setLinkedKiosks(kiosks.filter(k => k.enabledActivities.some(a => a === activity._id)))
					setIsEditing(false)
				}}
				onHandleCompleteEdit={handleCompleteEdit}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showRooms && !showKiosks && !showDisabledProducts}
				createdAt={activity.createdAt}
				updatedAt={activity.updatedAt}
			>
				{/* 1. Navn */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="name"
							initialText={activity.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={50}
							editable={isEditing}
							validations={[{
								validate: (v: string) => !activities.some((a) => a.name.trim().toLowerCase() === v.trim().toLowerCase() && a._id !== activity._id),
								message: 'Navn er allerede i brug'
							}]}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* 2. Deaktiverede Produkter */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Produkter'}</div>
					<div className="flex flex-col items-center justify-center">
						{newActivity.disabledProducts.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={products.filter((p) => newActivity.disabledProducts.includes(p._id))}
							editable={isEditing}
							onDeleteItem={(v) => { handleFieldChange('disabledProducts', newActivity.disabledProducts.filter((product) => product !== v._id)) }}
							onShowItems={() => { setShowDisabledProducts(true) }}
						/>
					</div>
				</div>

				{/* 3. Spisesteder */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Spisesteder'}</div>
					<div className="flex flex-col items-center justify-center">
						{newActivity.enabledRooms.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={rooms.filter((r) => newActivity.enabledRooms.some((room) => room === r._id))}
							editable={isEditing}
							onDeleteItem={(v) => { handleFieldChange('enabledRooms', newActivity.enabledRooms.filter((room) => room !== v._id)) }}
							onShowItems={() => { setShowRooms(true) }}
						/>
					</div>
				</div>

				{/* 4. Kiosker */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Kiosker'}</div>
					<div className="flex flex-col items-center justify-center">
						{linkedKiosks.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={linkedKiosks}
							editable={isEditing}
							onDeleteItem={(v) => { handleKioskChange(linkedKiosks.filter((kiosk) => kiosk._id !== v._id)) }}
							onShowItems={() => { setShowKiosks(true) }}
						/>
					</div>
				</div>
			</EntityCard>

			{/* Selection Windows and Confirmation Dialog */}
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
					selectedItems={rooms.filter((r) => newActivity.enabledRooms.some((room) => room === r._id))}
					onAddItem={(v) => { handleFieldChange('enabledRooms', [...newActivity.enabledRooms, v._id]) }}
					onDeleteItem={(v) => { handleFieldChange('enabledRooms', newActivity.enabledRooms.filter((room) => room !== v._id)) }}
					onClose={() => {
						setShowRooms(false)
					}}
				/>
			}
			{showDisabledProducts &&
				<SelectionWindow
					title={`Tilføj Deaktiverede Produkter til ${newActivity.name}`}
					items={products}
					selectedItems={products.filter((p) => newActivity.disabledProducts.includes(p._id))}
					onAddItem={(v) => { handleFieldChange('disabledProducts', [...newActivity.disabledProducts, v._id]) }}
					onDeleteItem={(v) => { handleFieldChange('disabledProducts', newActivity.disabledProducts.filter((product) => product !== v._id)) }}
					onClose={() => {
						setShowDisabledProducts(false)
					}}
				/>
			}
			{showKiosks &&
				<SelectionWindow
					title={`Tilføj Kiosker til ${newActivity.name}`}
					items={kiosks}
					selectedItems={linkedKiosks}
					onAddItem={(v) => { handleKioskChange([...linkedKiosks, v]) }}
					onDeleteItem={(v) => { handleKioskChange(linkedKiosks.filter((kiosk) => kiosk._id !== v._id)) }}
					onClose={() => {
						setShowKiosks(false)
					}}
				/>
			}
		</>
	)
}

export default Activity
