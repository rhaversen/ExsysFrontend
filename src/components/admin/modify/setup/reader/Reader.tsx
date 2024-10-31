import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { type PatchReaderType, type PostReaderType, type ReaderType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import Timestamps from '../../ui/Timestamps'
import useFormState from '@/hooks/useFormState'
import useCUDOperations from '@/hooks/useCUDOperations'

const Reader = ({
	readers,
	reader
}: {
	readers: ReaderType[]
	reader: ReaderType
}): ReactElement => {
	const { formState: newReader, handleFieldChange, handleValidationChange, resetFormState, formIsValid } = useFormState(reader)
	const { updateEntity, deleteEntity } = useCUDOperations<PostReaderType, PatchReaderType>('/v1/readers')
	const [isEditing, setIsEditing] = useState(false)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Kortlæser Tag'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="readerTag"
							initialText={reader.readerTag}
							placeholder="Kortlæser Tag"
							minSize={10}
							required={true}
							minLength={5}
							maxLength={5}
							validations={[{
								validate: (v: string) => !readers.some((k) => k.readerTag === v && k._id !== newReader._id),
								message: 'Kortlæser tag er allerede i brug'
							}]}
							type="number"
							editable={isEditing}
							onChange={(value) => { handleFieldChange('readerTag', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
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
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(newReader._id, newReader)
						resetFormState()
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
						deleteEntity(reader._id, confirm)
					}}
				/>
			}
		</div>
	)
}

export default Reader
