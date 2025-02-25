import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
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
import EditableDropdown from '../../ui/EditableDropdown'
import SelectionWindow from '../../ui/SelectionWindow'
import Timestamps from '../../ui/Timestamps'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'

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

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Kioskens Navn'}</p>
					<div className="font-bold pb-2 text-gray-800">
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
					<p className="italic text-gray-500">{'Kiosk Tag - Brugernavn til kiosk login'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="kioskTag"
							initialText={kiosk.kioskTag}
							placeholder="Kiosk tag"
							minSize={10}
							required={true}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('kioskTag', value) }}
							minLength={5}
							maxLength={5}
							type="number"
							validations={[{
								validate: (v: string) => !kiosks.some((k) => k.kioskTag === v && k._id !== newKiosk._id),
								message: 'Kiosk tag er allerede i brug'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
					{isEditing &&
						<div className="text-center">
							<p className="italic text-gray-500">{'Nyt Kodeord'}</p>
							<div className="font-bold pb-2 text-gray-800">
								<EditableField
									fieldName="password"
									initialText={newPassword}
									placeholder="Nyt Kodeord"
									minSize={10}
									minLength={4}
									maxLength={100}
									editable={isEditing}
									onChange={setNewPassword}
									onValidationChange={handleValidationChange}
								/>
							</div>
						</div>
					}
					<p className="italic text-gray-500">{'Kortlæser Tag'}</p>
					<EditableDropdown
						options={
							readers.filter((reader) =>
								// Include reader if NOT assigned to any kiosk
								!kiosks.some((kiosk) => kiosk.readerId?._id === reader._id) ||
								// OR if the reader is the one currently assigned to newKiosk
								reader._id === newKiosk.readerId?._id
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
				{newKiosk.activities.length > 0 &&
					<p className="italic text-gray-500 pt-2">{'Aktiviteter Tilknyttet Kiosken:'}</p>
				}
				{newKiosk.activities.length === 0 && !isEditing &&
					<p className="italic text-gray-500 pt-2">{'Ingen Aktiviteter Tilknyttet Kiosken'}</p>
				}
				{newKiosk.activities.length === 0 && isEditing &&
					<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter Til Kiosken:'}</p>
				}
				<div className="flex flex-row flex-wrap max-w-52">
					<ItemsDisplay
						items={newKiosk.activities}
						editable={isEditing}
						onDeleteItem={(v: ActivityType) => { handleFieldChange('activities', newKiosk.activities.filter((activity) => activity !== v)) }}
						onShowItems={() => {
							setShowActivities(true)
						}}
					/>
				</div>
				<Timestamps
					createdAt={kiosk.createdAt}
					updatedAt={kiosk.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						setNewPassword('')
						resetFormState()
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(kiosk._id, {
							...newKiosk,
							readerId: newKiosk.readerId?._id ?? null,
							password: newPassword.length > 0 ? newPassword : undefined,
							activities: newKiosk.activities.map(activity => activity._id)
						})
						setNewPassword('')
						setIsEditing(false)
					}}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
					canClose={!showActivities}
				/>
				{showDeleteConfirmation &&
					<ConfirmDeletion
						itemName={kiosk.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirm: boolean) => {
							setShowDeleteConfirmation(false)
							deleteEntity(kiosk._id, confirm)
						}}
					/>
				}
				{showActivities &&
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
						onClose={() => {
							setShowActivities(false)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Kiosk
