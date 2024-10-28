import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type OptionType, type PatchOptionType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Timestamps from '../../ui/Timestamps'

const Option = ({
	option
}: {
	option: OptionType
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newOption, setNewOption] = useState<OptionType>(option)
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

	const patchOption = useCallback((optionPatch: PatchOptionType): void => {
		axios.patch(API_URL + `/v1/options/${option._id}`, optionPatch, { withCredentials: true }).catch((error) => {
			addError(error)
			setNewOption(option)
		})
	}, [API_URL, addError, option])

	const deleteOption = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/options/${option._id}`, {
			data: { confirm },
			withCredentials: true
		}).catch((error) => {
			addError(error)
			setNewOption(option)
		})
	}, [API_URL, addError, option])

	const handleNameChange = useCallback((v: string): void => {
		setNewOption({
			...newOption,
			name: v
		})
	}, [newOption])

	const handlePriceChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setNewOption({
			...newOption,
			price: Number(v)
		})
	}, [newOption])

	const handleImageChange = useCallback((v: string): void => {
		setNewOption({
			...newOption,
			imageURL: v
		})
	}, [newOption])

	const handleUndoEdit = useCallback((): void => {
		setNewOption(option)
		setIsEditing(false)
	}, [option])

	const handleCompleteEdit = useCallback((): void => {
		patchOption(newOption)
		setIsEditing(false)
	}, [patchOption, newOption])

	const handleDeleteOption = useCallback((confirm: boolean): void => {
		deleteOption(confirm)
	}, [deleteOption])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={option.name}
							placeholder="Navn"
							minSize={5}
							required={true}
							maxLength={20}
							editable={isEditing}
							onChange={handleNameChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-800">
						<EditableField
							fieldName="price"
							initialText={option.price.toString()}
							placeholder="Pris"
							italic={true}
							minSize={2}
							required={true}
							type="number"
							editable={isEditing}
							onChange={handlePriceChange}
							onValidationChange={handleValidationChange}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<EditableImage
					URL={newOption.imageURL}
					editable={isEditing}
					onChange={handleImageChange}
				/>
				<Timestamps
					createdAt={option.createdAt}
					updatedAt={option.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
				/>
				{showDeleteConfirmation &&
					<ConfirmDeletion
						itemName={option.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirm: boolean) => {
							setShowDeleteConfirmation(false)
							handleDeleteOption(confirm)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Option
