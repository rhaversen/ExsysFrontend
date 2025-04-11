import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableDropdown from '../../ui/EditableDropdown'
import SelectionWindow from '../../ui/SelectionWindow'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import {
	type ActivityType,
	type KioskType,
	type PatchKioskType,
	type PostKioskType,
	type ReaderType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import EntityCard from '../../ui/EntityCard'

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
	const [newPassword, setNewPassword] = useState('')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showActivities, setShowActivities] = useState(false)
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)

	return (
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					setNewPassword('')
					resetFormState()
					setIsEditing(false)
				}}
				onHandleCompleteEdit={() => {
					updateEntity(kiosk._id, {
						...newKiosk,
						readerId: newKiosk.readerId?._id ?? null,
						password: newPassword.length > 0 ? newPassword : undefined,
						activities: newKiosk.activities.map(activity => activity._id),
						disabledActivities: newKiosk.disabledActivities
					})
					setNewPassword('')
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
								validate: (v: string) => !kiosks.some((k) => k.name === v && k._id !== newKiosk._id),
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
								validate: (v: string) => !kiosks.some((k) => k.kioskTag === v && k._id !== newKiosk._id),
								message: 'Kiosk # er allerede i brug'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Password */}
				{isEditing && (
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Ny Adgangskode'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="password"
								initialText={newPassword}
								placeholder="Ny Adgangskode"
								minSize={10}
								minLength={4}
								maxLength={100}
								editable={isEditing}
								onChange={setNewPassword}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>
				)}
				{!isEditing && (
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Adgangskode'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							{'******'}
						</div>
					</div>
				)}

				{/* Reader */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Kortlæser #'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableDropdown
							options={
								readers.filter((reader) =>
								// Include reader if NOT assigned to any kiosk
									!kiosks.some((kiosk) => kiosk.readerId?._id === reader._id) ||
										// OR if the reader is the one currently assigned to newKiosk
										reader._id === newKiosk.readerId?._id ||
										// OR if the reader is the one currently assigned to kiosk
										reader._id === kiosk.readerId?._id
								).map((reader) => ({
									value: reader._id,
									label: reader.readerTag
								}))
							}
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
					items={activities}
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
					items={activities}
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
