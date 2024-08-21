import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type OptionType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const Option = ({
	option,
	onOptionPatched,
	onOptionDeleted
}: {
	option: OptionType
	onOptionPatched: (option: OptionType) => void
	onOptionDeleted: (id: OptionType['_id']) => void
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

	const patchOption = (option: OptionType, optionPatch: Omit<OptionType, '_id'>): void => {
		axios.patch(API_URL + `/v1/options/${option._id}`, optionPatch, { withCredentials: true }).then((response) => {
			onOptionPatched(response.data as OptionType)
		}).catch((error) => {
			addError(error)
			setNewOption(option)
		})
	}

	const deleteOption = (option: OptionType, confirm: boolean): void => {
		axios.delete(API_URL + `/v1/options/${option._id}`, { data: { confirm }, withCredentials: true }).then(() => {
			onOptionDeleted(option._id)
		}).catch((error) => {
			addError(error)
			setNewOption(option)
		})
	}

	const handleNameChange = (v: string): void => {
		setNewOption({
			...newOption,
			name: v
		})
	}

	const handlePriceChange = (v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setNewOption({
			...newOption,
			price: Number(v)
		})
	}

	const handleImageChange = (v: string): void => {
		setNewOption({
			...newOption,
			imageURL: v
		})
	}

	const handleUndoEdit = (): void => {
		setNewOption(option)
		setIsEditing(false)
	}

	const handleCompleteEdit = (): void => {
		patchOption(option, newOption)
		setIsEditing(false)
	}

	const handleDeleteOption = (confirm: boolean): void => {
		deleteOption(option, confirm)
	}

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName={'name'}
							initialText={option.name}
							placeholder={'Navn'}
							italic={false}
							minSize={5}
							required={true}
							validations={[{
								validate: (v) => v.length <= 20,
								message: 'Navn kan højest have 20 tegn'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-800">
						<EditableField
							fieldName={'price'}
							initialText={option.price.toString()}
							placeholder={'Pris'}
							italic={true}
							minSize={2}
							validations={[{
								validate: (v) => !isNaN(Number(v)),
								message: 'Prisen skal være et tal'
							}, {
								validate: (v) => Number(v) >= 0,
								message: 'Prisen skal være positiv'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handlePriceChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<EditableImage
					URL={newOption.imageURL}
					editable={isEditing}
					edited={newOption.imageURL !== option.imageURL}
					onChange={(v: string) => {
						handleImageChange(v)
					}}
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
