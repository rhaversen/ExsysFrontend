import Options from '@/components/admin/modify/catalog/product/productOptions/Options'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { convertOrderWindowToUTC } from '@/lib/timeUtils'
import {
	type OptionType,
	type PatchProductType,
	type PostProductType,
	type ProductType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import InlineValidation from '../../ui/InlineValidation'
import SelectionWindow from '../../ui/SelectionWindow'
import Timestamps from '../../ui/Timestamps'

const Product = ({
	product,
	options
}: {
	product: ProductType
	options: OptionType[]
}): ReactElement => {
	const preprocessOrderWindow = (product: PostProductType | PatchProductType): PostProductType | PatchProductType => {
		return {
			...product,
			orderWindow: (product.orderWindow !== undefined) ? convertOrderWindowToUTC(product.orderWindow) : undefined
		}
	}

	const [isEditing, setIsEditing] = useState(false)
	const {
		formState: newProduct,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(product, isEditing)
	const {
		updateEntity,
		deleteEntity
	} = useCUDOperations<PostProductType, PatchProductType>('/v1/products', preprocessOrderWindow)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showOptions, setShowOptions] = useState(false)

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={product.name}
							placeholder="Navn"
							minSize={5}
							required={true}
							maxLength={15}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-800">
						<EditableField
							fieldName="price"
							initialText={product.price.toString()}
							placeholder="Pris"
							italic={true}
							minSize={2}
							required={true}
							type="number"
							editable={isEditing}
							onChange={(value) => { handleFieldChange('price', value) }}
							onValidationChange={handleValidationChange}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<div className="flex flex-row text-gray-800">
					<EditableField
						fieldName="fromHour"
						initialText={product.orderWindow.from.hour.toString().padStart(2, '0')}
						placeholder="Time"
						required={true}
						type="number"
						maxValue={23}
						maxLength={2}
						editable={isEditing}
						onChange={(value) => { handleFieldChange('orderWindow.from.hour', value) }}
						onValidationChange={handleValidationChange}
					/>
					<div className={`${isEditing ? 'font-bold text-xl px-1' : 'px-0.5'}`}>{':'}</div>
					<EditableField
						fieldName="fromMinute"
						initialText={product.orderWindow.from.minute.toString().padStart(2, '0')}
						placeholder="Minut"
						required={true}
						type="number"
						maxValue={59}
						maxLength={2}
						editable={isEditing}
						onChange={(value) => { handleFieldChange('orderWindow.from.minute', value) }}
						onValidationChange={handleValidationChange}
					/>
					<div className={`${isEditing ? 'text-xl px-1' : 'px-0.5'}`}>
						{'—'}
					</div>
					<EditableField
						fieldName="toHour"
						initialText={product.orderWindow.to.hour.toString().padStart(2, '0')}
						placeholder="Time"
						required={true}
						type="number"
						maxValue={23}
						maxLength={2}
						editable={isEditing}
						onChange={(value) => { handleFieldChange('orderWindow.to.hour', value) }}
						onValidationChange={handleValidationChange}
					/>
					<div className={`${isEditing ? 'font-bold text-xl px-1' : 'px-0.5'}`}>{':'}</div>
					<EditableField
						fieldName="toMinute"
						initialText={product.orderWindow.to.minute.toString().padStart(2, '0')}
						placeholder="Minut"
						required={true}
						type="number"
						maxValue={59}
						maxLength={2}
						editable={isEditing}
						onChange={(value) => { handleFieldChange('orderWindow.to.minute', value) }}
						onValidationChange={handleValidationChange}
					/>
				</div>
				<InlineValidation
					fieldName="orderWindow"
					validations={[
						{
							validate: () => {
								const fromHour = Number(newProduct.orderWindow.from.hour)
								const fromMinute = Number(newProduct.orderWindow.from.minute)
								const toHour = Number(newProduct.orderWindow.to.hour)
								const toMinute = Number(newProduct.orderWindow.to.minute)
								// Check if hours and minutes are valid numbers
								if (isNaN(fromHour) || isNaN(fromMinute) || isNaN(toHour) || isNaN(toMinute)) {
									return false
								}
								// Proceed with validation
								return fromHour !== toHour || fromMinute !== toMinute
							},
							message: 'Bestillingsvinduet kan ikke starte samme tid som det slutter'
						}
					]}
					onValidationChange={handleValidationChange}
				/>
				<EditableImage
					URL={newProduct.imageURL}
					editable={isEditing}
					onChange={(value) => { handleFieldChange('imageURL', value) }}
				/>
				{product.options.length > 0 &&
					<p className="italic text-gray-500">{'Tilvalg:'}</p>
				}
				{product.options.length === 0 && !isEditing &&
					<p className="italic text-gray-500">{'Ingen Tilvalg'}</p>
				}
				{product.options.length === 0 && isEditing &&
					<p className="italic text-gray-500">{'Tilføj Tilvalg:'}</p>
				}
				<div className="flex flex-row flex-wrap max-w-52">
					<Options
						selectedOptions={newProduct.options}
						editable={isEditing}
						onDeleteOption={(v) => { handleFieldChange('options', newProduct.options.filter((option) => option._id !== v._id)) }}
						showOptions={() => {
							setShowOptions(true)
						}}
					/>
				</div>
				<Timestamps
					createdAt={product.createdAt}
					updatedAt={product.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						resetFormState()
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(product._id, {
							...newProduct,
							options: newProduct.options.map(option => option._id)
						})
						setIsEditing(false)
					}}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
					canClose={!showOptions}
				/>
				{showDeleteConfirmation &&
					<ConfirmDeletion
						itemName={product.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirm: boolean) => {
							setShowDeleteConfirmation(false)
							deleteEntity(product._id, confirm)
						}}
					/>
				}
				{showOptions &&
					<SelectionWindow
						title={`Tilføj tilvalg til ${newProduct.name}`}
						items={options}
						selectedItems={newProduct.options}
						onAddItem={(v) => {
							handleFieldChange('options', [...newProduct.options, {
								...v,
								_id: v._id
							}])
						}}
						onDeleteItem={(v) => { handleFieldChange('options', newProduct.options.filter((option) => option._id !== v._id)) }}
						onClose={() => {
							setShowOptions(false)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Product
