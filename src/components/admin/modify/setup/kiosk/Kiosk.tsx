import { type ReactElement, useState } from 'react'

import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import {
	type ActivityType,
	type KioskType,
	type PatchKioskType,
	type PostKioskType,
	type ReaderType
} from '@/types/backendDataTypes'

import EditableDropdown from '../../ui/EditableDropdown'
import EntityCard from '../../ui/EntityCard'
import SelectionWindow from '../../ui/SelectionWindow'

const Kiosk = ({
	kiosks,
	kiosk,
	activities,
	readers
}: {
	kiosks: KioskType[]
	kiosk: KioskType
	activities: ActivityType[]
	readers: ReaderType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const {
		formState: newKiosk,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(kiosk, isEditing)
	const {
		updateEntity,
		deleteEntity
	} = useCUDOperations<PostKioskType, PatchKioskType>('/v1/kiosks')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showActivities, setShowActivities] = useState(false)

	return (
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					resetFormState()
					setIsEditing(false)
				}}
				onHandleCompleteEdit={() => {
					updateEntity(kiosk._id, {
						...newKiosk,
						readerId: newKiosk.readerId ?? null
					})
					setIsEditing(false)
				}}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showActivities}
				createdAt={kiosk.createdAt}
				updatedAt={kiosk.updatedAt}
			>
				{/* Kiosk Name */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="name"
							initialText={kiosk.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={50}
							editable={isEditing}
							validations={[{
								validate: (v: string) => !kiosks.some((k) => k.name.trim().toLowerCase() === v.trim().toLowerCase() && k._id !== newKiosk._id),
								message: 'Navn er allerede i brug'
							}]}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Kiosk Tag */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Kiosk #'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="kioskTag"
							initialText={kiosk.kioskTag}
							placeholder="Kiosk #"
							minSize={10}
							required={true}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('kioskTag', value) }}
							minLength={5}
							maxLength={5}
							type="number"
							validations={[{
								validate: (v: string) => !kiosks.some((k) => k.kioskTag.trim() === v.trim() && k._id !== newKiosk._id),
								message: 'Kiosk # er allerede i brug'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Reader */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Tilknyttet Kortlæser'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableDropdown
							options={readers.map(reader => ({
								value: reader._id,
								label: reader.readerTag,
								disabled: kiosks.some(k => k.readerId === reader._id)
									&& reader._id !== newKiosk.readerId
									&& reader._id !== kiosk.readerId
							}))}
							initialValue={newKiosk.readerId ?? 'null-option'}
							onChange={(value) => { handleFieldChange('readerId', value === 'null-option' ? null : readers.find(reader => reader._id === value)?._id ?? null) }}
							editable={isEditing}
							fieldName="readerId"
							allowNullOption={true}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Enabled Activities */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Aktiviteter'}</div>
					<div className="flex flex-col items-center justify-center">
						{newKiosk.enabledActivities.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={activities.filter(activity => newKiosk.enabledActivities?.some(ea => ea === activity._id))}
							editable={isEditing}
							onDeleteItem={(v: ActivityType) => { handleFieldChange('enabledActivities', newKiosk.enabledActivities.filter((activity) => activity !== v._id)) }}
							onShowItems={() => { setShowActivities(true) }}
						/>
						{newKiosk.enabledActivities.length === 0 && (
							<div className="mt-1 text-xs text-amber-600 font-medium text-center">
								{'Der kan ikke vælges en aktivitet fra denne kiosk'}
							</div>
						)}
					</div>
				</div>
			</EntityCard>

			{showDeleteConfirmation && (
				<ConfirmDeletion
					itemName={kiosk.name}
					onClose={() => { setShowDeleteConfirmation(false) }}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(kiosk._id, confirm)
					}}
				/>
			)}

			{showActivities && (
				<SelectionWindow
					title={`Tilføj aktivitet til ${newKiosk.name}`}
					items={activities}
					selectedItems={activities.filter(activity => newKiosk.enabledActivities?.some(ea => ea === activity._id))}
					onAddItem={(v) => {
						handleFieldChange('enabledActivities', [...newKiosk.enabledActivities, v._id])
					}}
					onDeleteItem={(v) => { handleFieldChange('enabledActivities', newKiosk.enabledActivities.filter((activity) => activity !== v._id)) }}
					onClose={() => { setShowActivities(false) }}
				/>
			)}
		</>
	)
}

export default Kiosk
