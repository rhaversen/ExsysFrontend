import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import SelectionWindow from '../../ui/SelectionWindow'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type OptionType, type PatchOptionType, type PostOptionType, type ProductType, type PatchProductType } from '@/types/backendDataTypes'
import React, { type ReactElement, useEffect, useState } from 'react'
import EntityCard from '../../ui/EntityCard'

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
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					resetFormState()
					setLinkedProducts(products.filter(p => p.options.some(o => o._id === option._id)))
					setIsEditing(false)
				}}
				onHandleCompleteEdit={handleCompleteEdit}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showProducts}
				createdAt={option.createdAt}
				updatedAt={option.updatedAt}
			>
				<div className="flex flex-wrap p-3 gap-1">
					{/* 1. Billede */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Billede'}</div>
						<div className="flex items-center justify-center">
							<EditableImage
								URL={newOption.imageURL}
								editable={isEditing}
								onChange={(value) => { handleFieldChange('imageURL', value) }}
								className='w-12 h-12 object-contain'
							/>
						</div>
					</div>

					{/* 2. Navn */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
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
					</div>

					{/* 3. Pris */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Pris'}</div>
						<div className="flex items-center justify-center text-gray-800 text-sm">
							<EditableField
								fieldName="price"
								initialText={option.price.toString()}
								placeholder="Pris"
								minSize={2}
								required={true}
								type="number"
								editable={isEditing}
								onChange={(value) => { handleFieldChange('price', Number(value.replace(/[^0-9.]/g, ''))) }}
								onValidationChange={handleValidationChange}
							/>
							<div className="pl-1">{'kr'}</div>
						</div>
					</div>

					{/* 4. Tilknyttede Produkter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Tilknyttede Produkter'}</div>
						<div className="flex flex-col items-center justify-center">
							{linkedProducts.length === 0 && (
								<div className="text-gray-500 text-sm">{isEditing ? 'Tilføj Produkter' : 'Ingen'}</div>
							)}
							<ItemsDisplay
								items={linkedProducts}
								editable={isEditing}
								onDeleteItem={(v) => { handleProductChange(linkedProducts.filter((product) => product._id !== v._id)) }}
								onShowItems={() => { setShowProducts(true) }}
							/>
						</div>
					</div>
				</div>
			</EntityCard>

			{showDeleteConfirmation && (
				<ConfirmDeletion
					itemName={option.name}
					onClose={() => { setShowDeleteConfirmation(false) }}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(option._id, confirm)
					}}
				/>
			)}

			{showProducts && (
				<SelectionWindow
					title={`Tilføj Produkter til ${newOption.name}`}
					items={products}
					selectedItems={linkedProducts}
					onAddItem={(v) => { handleProductChange([...linkedProducts, v]) }}
					onDeleteItem={(v) => { handleProductChange(linkedProducts.filter((product) => product._id !== v._id)) }}
					onClose={() => { setShowProducts(false) }}
				/>
			)}
		</>
	)
}

export default Option
