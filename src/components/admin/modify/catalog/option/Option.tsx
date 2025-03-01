import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type OptionType, type PatchOptionType, type PostOptionType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import Timestamps from '../../ui/Timestamps'

const Option = ({
	option,
	options
}: {
	option: OptionType
	options: OptionType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const {
		formState: newOption,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(option, isEditing)
	const {
		updateEntity,
		deleteEntity
	} = useCUDOperations<PostOptionType, PatchOptionType>('/v1/options')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

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
							validations={[{
								validate: (v: string) => !options.some((a) => a.name === v && a._id !== option._id),
								message: 'Navn er allerede i brug'
							}]}
							onChange={(value) => { handleFieldChange('name', value) }}
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
							onChange={(value) => { handleFieldChange('price', Number(value.replace(/[^0-9.]/g, ''))) }}
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
					onChange={(value) => { handleFieldChange('imageURL', value) }}
				/>
				<Timestamps
					createdAt={option.createdAt}
					updatedAt={option.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						resetFormState()
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(newOption._id, newOption)
						setIsEditing(false)
					}}
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
							deleteEntity(option._id, confirm)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Option
