import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import SelectionWindow from '../../ui/SelectionWindow'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type OptionType, type PatchOptionType, type PostOptionType, type ProductType, type PatchProductType } from '@/types/backendDataTypes'
import React, { type ReactElement, useEffect, useState } from 'react'
import Timestamps from '../../ui/Timestamps'

const Option = ({
	option,
	options,
	products
}: {
	option: OptionType
	options: OptionType[]
	products: ProductType[]
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const [linkedProducts, setLinkedProducts] = useState(
		products.filter(p => p.options.some(o => o._id === option._id))
	)
	const [showProducts, setShowProducts] = useState(false)

	useEffect(() => {
		setLinkedProducts(products.filter(p => p.options.some(o => o._id === option._id)))
	}, [products, option])

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

	const {
		updateEntity: updateProduct
	} = useCUDOperations<ProductType, PatchProductType>('/v1/products')

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	const handleProductChange = (newProducts: ProductType[]): void => {
		setLinkedProducts(newProducts)
	}

	const handleCompleteEdit = (): void => {
		// Update option first
		updateEntity(newOption._id, newOption)

		// Get products that need updating
		const currentProducts = products.filter(p => p.options.some(o => o._id === option._id))
		const addedProducts = linkedProducts.filter(p => !currentProducts.some(cp => cp._id === p._id))
		const removedProducts = currentProducts.filter(cp => !linkedProducts.some(p => p._id === cp._id))

		// Update products that need changes in parallel
		addedProducts.map(product => {
			updateProduct(product._id, {
				...product,
				options: [...product.options.map(o => o._id), option._id]
			})
			return null
		})

		removedProducts.map(product => {
			updateProduct(product._id, {
				...product,
				options: product.options.filter(o => o._id !== option._id).map(o => o._id)
			})
			return null
		})

		setIsEditing(false)
	}

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

				{linkedProducts.length > 0 && (
					<p className="italic text-gray-500 pt-2">{'Tilknyttede Produkter:'}</p>
				)}
				{linkedProducts.length === 0 && !isEditing && (
					<p className="italic text-gray-500 pt-2">{'Ingen Produkter Tilknyttet'}</p>
				)}
				{linkedProducts.length === 0 && isEditing && (
					<p className="italic text-gray-500 pt-2">{'Tilføj Produkter'}</p>
				)}
				<div className="flex flex-row flex-wrap max-w-52">
					<ItemsDisplay
						items={linkedProducts}
						editable={isEditing}
						onDeleteItem={(v) => { handleProductChange(linkedProducts.filter((product) => product._id !== v._id)) }}
						onShowItems={() => {
							setShowProducts(true)
						}}
					/>
				</div>

				<Timestamps
					createdAt={option.createdAt}
					updatedAt={option.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						resetFormState()
						setLinkedProducts(products.filter(p => p.options.some(o => o._id === option._id)))
						setIsEditing(false)
					}}
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
							deleteEntity(option._id, confirm)
						}}
					/>
				}

				{showProducts &&
					<SelectionWindow
						title={`Tilføj Produkter til ${newOption.name}`}
						items={products}
						selectedItems={linkedProducts}
						onAddItem={(v) => { handleProductChange([...linkedProducts, v]) }}
						onDeleteItem={(v) => { handleProductChange(linkedProducts.filter((product) => product._id !== v._id)) }}
						onClose={() => {
							setShowProducts(false)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Option
