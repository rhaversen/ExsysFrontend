import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PatchReaderType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Timestamps from '../../ui/Timestamps'

const Reader = ({
	readers,
	reader
}: {
	readers: ReaderType[]
	reader: ReaderType
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
		axios.patch(API_URL + `/v1/readers/${reader._id}`, readerPatch, { withCredentials: true }).catch((error) => {
			addError(error)
			setNewReader(reader)
		})
	}, [API_URL, addError, reader])

	const deleteReader = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/readers/${reader._id}`, {
			data: { confirm },
			withCredentials: true
		}).catch((error) => {
			addError(error)
			setNewReader(reader)
		})
	}, [API_URL, addError, reader])

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
							onChange={handleReaderTagChange}
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
