import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { type PatchOptionType, type PostOptionType, type OptionType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import Timestamps from '../../ui/Timestamps'
import useFormState from '@/hooks/useFormState'
import useCUDOperations from '@/hooks/useCUDOperations'

const Option = ({
	option
}: {
	option: OptionType
}): ReactElement => {
	const { formState: newOption, handleFieldChange, handleValidationChange, resetFormState, formIsValid } = useFormState(option)
	const { updateEntity, deleteEntity } = useCUDOperations<PostOptionType, PatchOptionType>('/v1/options')
	const [isEditing, setIsEditing] = useState(false)
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
						resetFormState()
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
