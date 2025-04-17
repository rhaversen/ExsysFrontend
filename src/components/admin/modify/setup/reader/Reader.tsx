import React, { type ReactElement, useState, useEffect } from 'react'

import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type PatchReaderType, type PostReaderType, type ReaderType, type KioskType, type PatchKioskType } from '@/types/backendDataTypes'

import EditableDropdown from '../../ui/EditableDropdown'
import EntityCard from '../../ui/EntityCard'

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
			await updateKioskAsync(prevKiosk._id, { readerId: null })
			await updateKioskAsync(newKiosk._id, { readerId })
		} else if ((prevKiosk != null) && (newKiosk == null)) {
			await updateKioskAsync(prevKiosk._id, { readerId: null })
		} else if ((prevKiosk == null) && (newKiosk != null)) {
			await updateKioskAsync(newKiosk._id, { readerId })
		}
	}

	return (
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					resetFormState()
					setAssignedKiosk(kiosks.find(k => k.readerId?._id === reader._id) ?? null)
					setIsEditing(false)
				}}
				onHandleCompleteEdit={() => {
					updateReader(newReader._id, newReader)
					const prevKiosk = kiosks.find(k => k.readerId?._id === reader._id)
					updateKiosksIfNeeded(prevKiosk, assignedKiosk, reader._id).catch(addError)
					setIsEditing(false)
				}}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				createdAt={reader.createdAt}
				updatedAt={reader.updatedAt}
			>
				{/* Reader Tag */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Kortlæser #'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="readerTag"
							initialText={reader.readerTag}
							placeholder="Kortlæser #"
							minSize={10}
							required={true}
							minLength={5}
							maxLength={5}
							validations={[{
								validate: (v: string) => !readers.some((k) => k.readerTag.trim() === v.trim() && k._id !== newReader._id),
								message: 'Kortlæser # er allerede i brug'
							}]}
							type="number"
							editable={isEditing}
							onChange={(value) => { handleFieldChange('readerTag', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Pairing Code */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Parring Kode'}</div>
					<div className="bg-gray-200 text-gray-500 text-center border border-gray-300 rounded px-2 py-1 flex items-center justify-center text-sm">
						{'Opbrugt ved parring'}
					</div>
				</div>

				{/* Assigned Kiosk */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Tilknyttet Kiosk'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableDropdown
							options={Array.isArray(kiosks)
								? kiosks.filter((kiosk) =>
									((kiosk.readerId?._id) == null) ||
										kiosk.readerId?._id === reader._id ||
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
				</div>
			</EntityCard>

			{showDeleteConfirmation && (
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
			)}
		</>
	)
}

export default Reader
