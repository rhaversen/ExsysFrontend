import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type PatchReaderType, type PostReaderType, type ReaderType, type KioskType, type PatchKioskType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState, useEffect } from 'react'
import Timestamps from '../../ui/Timestamps'
import EditableDropdown from '../../ui/EditableDropdown'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const Reader = ({
	readers,
	reader,
	kiosks
}: {
	readers: ReaderType[]
	reader: ReaderType
	kiosks: KioskType[]
}): ReactElement => {
	const { addError } = useError()
	const [isEditing, setIsEditing] = useState(false)
	const {
		formState: newReader,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(reader, isEditing)
	const {
		updateEntity: updateReader,
		deleteEntity: deleteReader
	} = useCUDOperations<PostReaderType, PatchReaderType>('/v1/readers')

	const {
		updateEntityAsync: updateKioskAsync
	} = useCUDOperations<KioskType, PatchKioskType>('/v1/kiosks')

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [assignedKiosk, setAssignedKiosk] = useState<KioskType | null>(
		Array.isArray(kiosks) ? kiosks.find(k => k.readerId?._id != null && k.readerId._id === reader._id) ?? null : null
	)

	// Update assignedKiosk when kiosks prop changes
	useEffect(() => {
		if (Array.isArray(kiosks)) {
			setAssignedKiosk(kiosks.find(k => k.readerId !== null && k.readerId !== undefined && k.readerId._id === reader._id) ?? null)
		}
	}, [kiosks, reader._id])

	const handleKioskChange = (kioskId: string): void => {
		setAssignedKiosk(kioskId === 'null-option'
			? null
			: Array.isArray(kiosks)
				? kiosks.find(k => k._id === kioskId) ?? null
				: null)
	}

	const updateKiosksIfNeeded = async (
		prevKiosk: KioskType | undefined,
		newKiosk: KioskType | null,
		readerId: string
	): Promise<void> => {
		if ((prevKiosk != null) && (newKiosk != null) && prevKiosk._id !== newKiosk._id) {
			// Remove reader from old kiosk, then assign to new kiosk
			await updateKioskAsync(prevKiosk._id, { readerId: null })
			await updateKioskAsync(newKiosk._id, { readerId })
		} else if ((prevKiosk != null) && (newKiosk == null)) {
			// Remove reader if kiosk is unassigned
			await updateKioskAsync(prevKiosk._id, { readerId: null })
		} else if ((prevKiosk == null) && (newKiosk != null)) {
			// Assign reader to new kiosk if none was previously assigned
			await updateKioskAsync(newKiosk._id, { readerId })
		}
	}

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Kortlæser #'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="readerTag"
							initialText={reader.readerTag}
							placeholder="Kortlæser #"
							minSize={10}
							required={true}
							minLength={5}
							maxLength={5}
							validations={[{
								validate: (v: string) => !readers.some((k) => k.readerTag === v && k._id !== newReader._id),
								message: 'Kortlæser # er allerede i brug'
							}]}
							type="number"
							editable={isEditing}
							onChange={(value) => { handleFieldChange('readerTag', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>

					<p className="italic text-gray-500">{'Tilknyttet Kiosk'}</p>
					<EditableDropdown
						options={Array.isArray(kiosks)
							? kiosks.filter((kiosk) =>
								// Include kiosk if it doesn't have a reader assigned
								((kiosk.readerId?._id) == null) ||
								// OR if the kiosk is already assigned to this reader
								kiosk.readerId?._id === reader._id ||
								// OR if the kiosk is the one currently assigned to this reader
								kiosk.readerId?._id === newReader._id
							).map((kiosk) => ({
								value: kiosk._id,
								label: kiosk.name
							}))
							: []
						}
						initialValue={assignedKiosk?._id ?? 'null-option'}
						onChange={handleKioskChange}
						editable={isEditing}
						fieldName="assignedKiosk"
						allowNullOption={true}
						onValidationChange={handleValidationChange}
					/>
				</div>
				<Timestamps
					createdAt={reader.createdAt}
					updatedAt={reader.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						resetFormState()
						setAssignedKiosk(kiosks.find(k => k.readerId?._id === reader._id) ?? null)
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateReader(newReader._id, newReader)
						const prevKiosk = kiosks.find(k => k.readerId?._id === reader._id)
						updateKiosksIfNeeded(prevKiosk, assignedKiosk, reader._id).catch(addError)
						setIsEditing(false)
					}}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
				/>
			</div>
			{showDeleteConfirmation &&
				<ConfirmDeletion
					itemName={reader.readerTag}
					onClose={() => {
						setShowDeleteConfirmation(false)
					}}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteReader(reader._id, confirm)
					}}
				/>
			}
		</div>
	)
}

export default Reader
