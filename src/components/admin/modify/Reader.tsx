import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PatchReaderType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Timestamps from './ui/Timestamps'

const Reader = ({
	reader,
	onReaderPatched,
	onReaderDeleted
}: {
	reader: ReaderType
	onReaderPatched: (reader: ReaderType) => void
	onReaderDeleted: (id: ReaderType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newReader, setNewReader] = useState<ReaderType>(reader)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

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

	const patchReader = useCallback((readerPatch: PatchReaderType): void => {
		axios.patch(API_URL + `/v1/readers/${reader._id}`, readerPatch, { withCredentials: true }).then((response) => {
			onReaderPatched(response.data as ReaderType)
		}).catch((error) => {
			addError(error)
			setNewReader(reader)
		})
	}, [API_URL, onReaderPatched, addError, reader])

	const deleteReader = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/readers/${reader._id}`, {
			data: { confirm }, withCredentials: true
		}).then(() => {
			onReaderDeleted(reader._id)
		}).catch((error) => {
			addError(error)
			setNewReader(reader)
		})
	}, [API_URL, onReaderDeleted, addError, reader])

	const handleReaderTagChange = useCallback((v: string): void => {
		setNewReader({
			...newReader,
			readerTag: v
		})
	}, [newReader])

	const handleUndoEdit = useCallback((): void => {
		setNewReader(reader)
		setIsEditing(false)
	}, [reader])

	const handleCompleteEdit = useCallback((): void => {
		patchReader(newReader)
		setIsEditing(false)
	}, [patchReader, newReader])

	const handleDeleteReader = useCallback((confirm: boolean): void => {
		deleteReader(confirm)
	}, [deleteReader])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Kortlæser Tag'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName='readerTag'
							initialText={reader.readerTag}
							placeholder='Kortlæser Tag'
							italic={false}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length === 5,
								message: 'Kortlæser tag skal være præcis 5 tal'
							}, {
								validate: (v: string) => /^\d+$/.exec(v) !== null,
								message: 'Kortlæser tag må kun være tal'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handleReaderTagChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
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
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
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
						handleDeleteReader(confirm)
					}}
				/>
			}
		</div>
	)
}

export default Reader
