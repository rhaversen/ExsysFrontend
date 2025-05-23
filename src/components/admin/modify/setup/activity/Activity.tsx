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
		kiosks.filter(k => k.priorityActivities.some(a => a === activity._id))
	)
	const [disabledKiosks, setDisabledKiosks] = useState(
		kiosks.filter(k => k.disabledActivities.includes(activity._id))
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
	const [showDisabledKiosks, setShowDisabledKiosks] = useState(false)
	const [showDisabledRooms, setShowDisabledRooms] = useState(false)
	const [showDisabledProducts, setShowDisabledProducts] = useState(false)

	const handleKioskChange = (newKiosks: KioskType[]): void => {
		setLinkedKiosks(newKiosks)
	}

	useEffect(() => {
		setLinkedKiosks(kiosks.filter(k => k.priorityActivities.some(a => a === activity._id)))
		setDisabledKiosks(kiosks.filter(k => k.disabledActivities.includes(activity._id)))
	}, [kiosks, activity])

	const handleCompleteEdit = (): void => {
		// Update activity first
		const activityUpdate: PatchActivityType = {
			name: newActivity.name,
			priorityRooms: newActivity.priorityRooms,
			disabledRooms: newActivity.disabledRooms,
			disabledProducts: newActivity.disabledProducts
		}
		updateActivity(newActivity._id, activityUpdate)

		// Get kiosks that need updating for linked kiosks
		const currentKiosks = kiosks.filter(k => k.priorityActivities.some(a => a === activity._id))
		const addedKiosks = linkedKiosks.filter(k => !currentKiosks.some(ck => ck._id === k._id))
		const removedKiosks = currentKiosks.filter(ck => !linkedKiosks.some(k => k._id === ck._id))

		// Get kiosks that need updating for disabled kiosks
		const currentDisabledKiosks = kiosks.filter(k => k.disabledActivities.includes(activity._id))
		const addedDisabledKiosks = disabledKiosks.filter(k => !currentDisabledKiosks.some(ck => ck._id === k._id))
		const removedDisabledKiosks = currentDisabledKiosks.filter(ck => !disabledKiosks.some(k => k._id === ck._id))

		// Update kiosks that need changes for linking
		for (const kiosk of addedKiosks) {
			const kioskUpdate: PatchKioskType = {
				name: kiosk.name,
				priorityActivities: [...kiosk.priorityActivities, activity._id]
			}
			updateKiosk(kiosk._id, kioskUpdate)
		}

		for (const kiosk of removedKiosks) {
			const kioskUpdate: PatchKioskType = {
				name: kiosk.name,
				priorityActivities: kiosk.priorityActivities.filter(a => a !== activity._id)
			}
			updateKiosk(kiosk._id, kioskUpdate)
		}

		// Update kiosks that need changes for disabling
		for (const kiosk of addedDisabledKiosks) {
			const kioskUpdate: PatchKioskType = {
				name: kiosk.name,
				disabledActivities: [...kiosk.disabledActivities, activity._id]
			}
			updateKiosk(kiosk._id, kioskUpdate)
		}

		for (const kiosk of removedDisabledKiosks) {
			const kioskUpdate: PatchKioskType = {
				name: kiosk.name,
				disabledActivities: kiosk.disabledActivities.filter(id => id !== activity._id)
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
					setLinkedKiosks(kiosks.filter(k => k.priorityActivities.some(a => a === activity._id)))
					setDisabledKiosks(kiosks.filter(k => k.disabledActivities.includes(activity._id)))
					setIsEditing(false)
				}}
				onHandleCompleteEdit={handleCompleteEdit}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showRooms && !showKiosks && !showDisabledRooms && !showDisabledProducts && !showDisabledKiosks}
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
					<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævede Spisesteder'}</div>
					<div className="flex flex-col items-center justify-center">
						{newActivity.priorityRooms.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={rooms.filter((r) => newActivity.priorityRooms.some((room) => room === r._id))}
							editable={isEditing}
							onDeleteItem={(v) => { handleFieldChange('priorityRooms', newActivity.priorityRooms.filter((room) => room !== v._id)) }}
							onShowItems={() => { setShowRooms(true) }}
						/>
					</div>
				</div>

				{/* 4. Deaktiverede Spisesteder */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Spisesteder'}</div>
					<div className="flex flex-col items-center justify-center">
						{newActivity.disabledRooms.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={rooms.filter((r) => newActivity.disabledRooms.includes(r._id))}
							editable={isEditing}
							onDeleteItem={(v) => { handleFieldChange('disabledRooms', newActivity.disabledRooms.filter((room) => room !== v._id)) }}
							onShowItems={() => { setShowDisabledRooms(true) }}
						/>
					</div>
				</div>

				{/* 5. Fremhævende Kiosker */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævende Kiosker'}</div>
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

				{/* 6. Deaktiverede Kiosker */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Kiosker'}</div>
					<div className="flex flex-col items-center justify-center">
						{disabledKiosks.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={disabledKiosks}
							editable={isEditing}
							onDeleteItem={(v) => { setDisabledKiosks(disabledKiosks.filter((kiosk) => kiosk._id !== v._id)) }}
							onShowItems={() => { setShowDisabledKiosks(true) }}
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
					title={`Tilføj Fremhævede Spisesteder til ${newActivity.name}`}
					items={rooms.map(r => ({
						...r,
						// Disable if already in disabledRooms
						disabled: newActivity.disabledRooms.some(dr => dr === r._id)
					}))}
					selectedItems={rooms.filter((r) => newActivity.priorityRooms.some((room) => room === r._id))}
					onAddItem={(v) => { handleFieldChange('priorityRooms', [...newActivity.priorityRooms, v._id]) }}
					onDeleteItem={(v) => { handleFieldChange('priorityRooms', newActivity.priorityRooms.filter((room) => room !== v._id)) }}
					onClose={() => {
						setShowRooms(false)
					}}
				/>
			}
			{showDisabledRooms &&
				<SelectionWindow
					title={`Tilføj Deaktiverede Spisesteder til ${newActivity.name}`}
					items={rooms.map(r => ({
						...r,
						// Disable if already in prioritizedRooms
						disabled: newActivity.priorityRooms.some(pr => pr === r._id)
					}))}
					selectedItems={rooms.filter((r) => newActivity.disabledRooms.includes(r._id))}
					onAddItem={(v) => { handleFieldChange('disabledRooms', [...newActivity.disabledRooms, v._id]) }}
					onDeleteItem={(v) => { handleFieldChange('disabledRooms', newActivity.disabledRooms.filter((room) => room !== v._id)) }}
					onClose={() => {
						setShowDisabledRooms(false)
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
					title={`Tilføj Fremhævende Kiosker til ${newActivity.name}`}
					items={kiosks.map(k => ({
						...k,
						// Disable if already in disabledKiosks
						disabled: disabledKiosks.some(dk => dk._id === k._id)
					}))}
					selectedItems={linkedKiosks}
					onAddItem={(v) => { handleKioskChange([...linkedKiosks, v]) }}
					onDeleteItem={(v) => { handleKioskChange(linkedKiosks.filter((kiosk) => kiosk._id !== v._id)) }}
					onClose={() => {
						setShowKiosks(false)
					}}
				/>
			}
			{showDisabledKiosks &&
				<SelectionWindow
					title={`Tilføj Deaktiverede Kiosker til ${newActivity.name}`}
					items={kiosks.map(k => ({
						...k,
						// Disable if already in prioritizedKiosks
						disabled: linkedKiosks.some(pk => pk._id === k._id)
					}))}
					selectedItems={disabledKiosks}
					onAddItem={(v) => { setDisabledKiosks([...disabledKiosks, v]) }}
					onDeleteItem={(v) => { setDisabledKiosks(disabledKiosks.filter((kiosk) => kiosk._id !== v._id)) }}
					onClose={() => {
						setShowDisabledKiosks(false)
					}}
				/>
			}
		</>
	)
}

export default Activity
