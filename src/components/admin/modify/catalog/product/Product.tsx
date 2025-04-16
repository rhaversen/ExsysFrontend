import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { convertLocalOrderWindowToUTC } from '@/lib/timeUtils'
import {
	type OptionType,
	type PatchProductType,
	type PostProductType,
	type ProductType,
	type ActivityType,
	type PatchActivityType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState, useEffect } from 'react'
import InlineValidation from '../../ui/InlineValidation'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import EntityCard from '../../ui/EntityCard'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const Product = ({
	product,
	products,
	options,
	activities
}: {
	product: ProductType
	products: ProductType[]
	options: OptionType[]
	activities: ActivityType[]
}): ReactElement => {
	const { addError } = useError()

	const preprocessOrderWindow = (product: PostProductType | PatchProductType): PostProductType | PatchProductType => {
		return {
			...product,
			orderWindow: (product.orderWindow !== undefined) ? convertLocalOrderWindowToUTC(product.orderWindow) : undefined
		}
	}

	const [isEditing, setIsEditing] = useState(false)
	const [disabledActivities, setDisabledActivities] = useState<ActivityType[]>(
		activities.filter(a => a.disabledProducts.includes(product._id))
	)
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
	const {
		updateEntityAsync: updateActivityAsync
	} = useCUDOperations<ActivityType, PatchActivityType>('/v1/activities')

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showOptions, setShowOptions] = useState(false)
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)

	useEffect(() => {
		setDisabledActivities(activities.filter(a => a.disabledProducts.includes(product._id)))
	}, [activities, product._id])

	const toggleActivity = (): void => {
		updateEntity(product._id, {
			isActive: !newProduct.isActive
		} satisfies PatchProductType)
		// Update local state
		handleFieldChange('isActive', !newProduct.isActive)
	}

	const handleCompleteEdit = (): void => {
		// Update product first
		updateEntity(product._id, {
			...newProduct,
			options: newProduct.options.map(option => option._id)
		})

		// Update disabled activities
		const currentDisabledActivities = activities.filter(a => a.disabledProducts.includes(product._id))
		const addedDisabledActivities = disabledActivities.filter(a => !currentDisabledActivities.some(ca => ca._id === a._id))
		const removedDisabledActivities = currentDisabledActivities.filter(ca => !disabledActivities.some(a => a._id === ca._id))

		Promise.all([
			...addedDisabledActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					disabledProducts: [...activity.disabledProducts, product._id]
				})
			}),
			...removedDisabledActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					disabledProducts: activity.disabledProducts.filter(id => id !== product._id)
				})
			})
		]).then(() => {
			setIsEditing(false)
		}).catch((error) => {
			addError(error)
		})
	}

	return (
		<>
			<EntityCard
				isActive={newProduct.isActive}
				onToggleActivity={toggleActivity}
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					resetFormState()
					setDisabledActivities(activities.filter(a => a.disabledProducts.includes(product._id)))
					setIsEditing(false)
				}}
				onHandleCompleteEdit={handleCompleteEdit}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				canClose={!showOptions && !showDisabledActivities}
				createdAt={product.createdAt}
				updatedAt={product.updatedAt}
			>
				{/* 1. Billede */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Billede'}</div>
					<div className="flex items-center justify-center">
						<EditableImage
							URL={newProduct.imageURL}
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
							initialText={product.name}
							placeholder="Navn"
							minSize={5}
							required={true}
							maxLength={15}
							editable={isEditing}
							validations={[{
								validate: (v: string) => !products.some((a) => a.name.trim() === v.trim() && a._id !== product._id),
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
							initialText={product.price.toString()}
							placeholder="Pris"
							minSize={1}
							required={true}
							type="number"
							editable={isEditing}
							onChange={(value) => { handleFieldChange('price', value) }}
							onValidationChange={handleValidationChange}
						/>
						<div className="pl-1">{'kr'}</div>
					</div>
				</div>

				{/* 4. Bestillingsvindue */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Bestillingsvindue'}</div>
					<div className="flex flex-col items-center justify-center text-sm">
						<div className="flex items-center justify-center text-gray-800">
							<span className="text-xs pr-1">{'Fra'}</span>
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
							{':\r'}
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
						</div>
						<div className="flex items-center justify-center text-gray-800">
							<span className="text-xs pr-1">{'Til'}</span>
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
							{':\r'}
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
							validations={[{
								validate: () => {
									const fromHour = Number(newProduct.orderWindow.from.hour)
									const fromMinute = Number(newProduct.orderWindow.from.minute)
									const toHour = Number(newProduct.orderWindow.to.hour)
									const toMinute = Number(newProduct.orderWindow.to.minute)
									if (isNaN(fromHour) || isNaN(fromMinute) || isNaN(toHour) || isNaN(toMinute)) {
										return false
									}
									return fromHour !== toHour || fromMinute !== toMinute
								},
								message: 'Bestillingsvinduet kan ikke starte samme tid som det slutter'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* 5. Tilvalg */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Tilvalg'}</div>
					<div className="flex flex-col items-center justify-center">
						{newProduct.options.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={newProduct.options}
							editable={isEditing}
							onDeleteItem={(v) => { handleFieldChange('options', newProduct.options.filter((option) => option._id !== v._id)) }}
							onShowItems={() => { setShowOptions(true) }}
						/>
					</div>
				</div>

				{/* 6. Deaktiverede Aktiviteter */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Aktiviteter'}</div>
					<div className="flex flex-col items-center justify-center">
						{disabledActivities.length === 0 && (
							<div className="text-gray-500 text-sm">{'Ingen'}</div>
						)}
						<ItemsDisplay
							items={disabledActivities}
							editable={isEditing}
							onDeleteItem={(v) => { setDisabledActivities(disabledActivities.filter((activity) => activity._id !== v._id)) }}
							onShowItems={() => { setShowDisabledActivities(true) }}
						/>
					</div>
				</div>
			</EntityCard>
			{showDeleteConfirmation && (
				<ConfirmDeletion
					itemName={product.name}
					onClose={() => { setShowDeleteConfirmation(false) }}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(product._id, confirm)
					}}
				/>
			)}
			{showOptions && (
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
					onClose={() => { setShowOptions(false) }}
				/>
			)}
			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj deaktiverede aktiviteter til ${newProduct.name}`}
					items={activities}
					selectedItems={disabledActivities}
					onAddItem={(v) => { setDisabledActivities([...disabledActivities, v]) }}
					onDeleteItem={(v) => { setDisabledActivities(disabledActivities.filter((activity) => activity._id !== v._id)) }}
					onClose={() => { setShowDisabledActivities(false) }}
				/>
			)}
		</>
	)
}

export default Product
