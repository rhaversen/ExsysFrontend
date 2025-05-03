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
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)

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
						readerId: newKiosk.readerId?._id ?? null,
						activities: newKiosk.activities.map(activity => activity._id),
						disabledActivities: newKiosk.disabledActivities
					})
					setIsEditing(false)
				}}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showActivities && !showDisabledActivities}
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
								disabled: kiosks.some(k => k.readerId?._id === reader._id)
									&& reader._id !== newKiosk.readerId?._id
									&& reader._id !== kiosk.readerId?._id
							}))}
							initialValue={newKiosk.readerId?._id ?? 'null-option'}
							onChange={(value) => { handleFieldChange('readerId', value === 'null-option' ? null : readers.find(reader => reader._id === value) ?? null) }}
							editable={isEditing}
							fieldName="readerId"
							allowNullOption={true}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Fremhævede Activities */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævede Aktiviteter'}</div>
					<div className="flex flex-col items-center justify-center">
						{newKiosk.activities.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={newKiosk.activities}
							editable={isEditing}
							onDeleteItem={(v: ActivityType) => { handleFieldChange('activities', newKiosk.activities.filter((activity) => activity !== v)) }}
							onShowItems={() => { setShowActivities(true) }}
						/>
					</div>
				</div>

				{/* Disabled Activities */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Aktiviteter'}</div>
					<div className="flex flex-col items-center justify-center">
						{newKiosk.disabledActivities.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={activities.filter(activity => newKiosk.disabledActivities?.includes(activity._id))}
							editable={isEditing}
							onDeleteItem={(v: ActivityType) => {
								handleFieldChange('disabledActivities',
									(newKiosk.disabledActivities?.length > 0 ? newKiosk.disabledActivities : []).filter(id => id !== v._id))
							}}
							onShowItems={() => { setShowDisabledActivities(true) }}
						/>
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
					items={activities.map(a => ({
						...a,
						// Disable if already in disabledActivities
						disabled: newKiosk.disabledActivities.includes(a._id)
					}))}
					selectedItems={newKiosk.activities}
					onAddItem={(v) => {
						handleFieldChange('activities', [...newKiosk.activities, {
							...v,
							_id: v._id
						}])
					}}
					onDeleteItem={(v) => { handleFieldChange('activities', newKiosk.activities.filter((activity) => activity._id !== v._id)) }}
					onClose={() => { setShowActivities(false) }}
				/>
			)}

			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj deaktiverede aktiviteter til ${newKiosk.name}`}
					items={activities.map(a => ({
						...a,
						// Disable if already in prioritized activities
						disabled: newKiosk.activities.some(pa => pa._id === a._id)
					}))}
					selectedItems={activities.filter(activity => newKiosk.disabledActivities?.includes(activity._id))}
					onAddItem={(v) => {
						handleFieldChange('disabledActivities', [...newKiosk.disabledActivities, v._id])
					}}
					onDeleteItem={(v) => {
						handleFieldChange('disabledActivities',
							newKiosk.disabledActivities.filter(id => id !== v._id))
					}}
					onClose={() => { setShowDisabledActivities(false) }}
				/>
			)}
		</>
	)
}

export default Kiosk
