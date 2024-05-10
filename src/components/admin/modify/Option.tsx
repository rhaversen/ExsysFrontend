import { type OptionType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import axios from 'axios'

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

	const [isEditing, setIsEditing] = useState(false)
	const [newOption, setNewOption] = useState<OptionType>(option)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	const patchOption = (option: OptionType, optionPatch: Omit<OptionType, '_id'>): void => {
		axios.patch(`${API_URL}/v1/options/${option._id}`, optionPatch).then((response) => {
			console.log('Option updated:', response.data)
			onOptionPatched(response.data as OptionType)
		}).catch((error) => {
			console.error('Error updating option:', error)
		})
	}

	const deleteOption = (option: OptionType, confirmDeletion: boolean): void => {
		axios.delete(`${API_URL}/v1/options/${option._id}`, {
			data: { confirmDeletion }
		}).then(() => {
			console.log('Option deleted')
			onOptionDeleted(option._id)
		}).catch((error) => {
			console.error('Error deleting option:', error)
			setNewOption(option)
		})
	}

	const handleNameChange = (v: string): void => {
		console.log('Name change:', v)
		setNewOption({
			...newOption,
			name: v
		})
	}

	const handlePriceChange = (v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		console.log('Price change:', v)
		setNewOption({
			...newOption,
			price: Number(v)
		})
	}

	const handleImageChange = (v: string): void => {
		console.log('Image change:', v)
		setNewOption({
			...newOption,
			imageURL: v
		})
	}

	const handleUndoEdit = (): void => {
		console.log('Undoing edit')
		setNewOption(option)
		setIsEditing(false)
	}

	const handleCompleteEdit = (): void => {
		console.log('Completing edit')
		patchOption(option, newOption)
		setNewOption(option)
		setIsEditing(false)
	}

	const handleDeleteOption = (confirmDeletion: boolean): void => {
		console.log('Deleting option')
		deleteOption(option, confirmDeletion)
	}

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-black">
						<EditableField
							text={newOption.name}
							italic={false}
							editable={isEditing}
							edited={newOption.name !== option.name}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-700">
						<EditableField
							text={newOption.price.toString()}
							italic={true}
							editable={isEditing}
							edited={newOption.price !== option.price}
							onChange={(v: string) => {
								handlePriceChange(v)
							}}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<EditableImage
					defaultURL={option.imageURL}
					newURL={newOption.imageURL}
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
				/>
				{showDeleteConfirmation &&
					<ConfirmDeletion
						itemName={option.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirmDeletion: boolean) => {
							setShowDeleteConfirmation(false)
							handleDeleteOption(confirmDeletion)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Option