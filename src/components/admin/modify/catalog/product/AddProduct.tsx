import Image from 'next/image'
import React, { type ReactElement, useState } from 'react'

import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { AdminImages } from '@/lib/images'
import { convertLocalOrderWindowToUTC } from '@/lib/timeUtils'
import { type PatchProductType, type ActivityType, type OptionType, type PostProductType, type ProductType, PostActivityType, PatchActivityType } from '@/types/backendDataTypes'

import InlineValidation from '../../ui/InlineValidation'
import ItemsDisplay from '../../ui/ItemsDisplay'
import SelectionWindow from '../../ui/SelectionWindow'

const AddProduct = ({
	products,
	options,
	activities,
	onClose
}: {
	products: ProductType[]
	options: OptionType[]
	activities: ActivityType[]
	onClose: () => void
}): ReactElement => {
	const { addError } = useError()
	const [showOptions, setShowOptions] = useState(false)
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)
	const [disabledActivities, setDisabledActivities] = useState<ActivityType[]>([])

	const initialProduct: PostProductType = {
		name: '',
		price: 0,
		isActive: true,
		orderWindow: {
			from: {
				hour: 0,
				minute: 0
			},
			to: {
				hour: 0,
				minute: 0
			}
		},
		options: []
	}

	const {
		formState: newProduct,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(initialProduct, true)

	const preprocessOrderWindow = (product: PostProductType | PatchProductType): PostProductType | PatchProductType => {
		return {
			...product,
			orderWindow: (product.orderWindow !== undefined) ? convertLocalOrderWindowToUTC(product.orderWindow) : undefined
		}
	}

	const { createEntityAsync: createProductAsync } = useCUDOperations<PostProductType, PatchProductType, ProductType>('/v1/products', preprocessOrderWindow)
	const { updateEntityAsync: updateActivityAsync } = useCUDOperations<PostActivityType, PatchActivityType, ActivityType>('/v1/activities')

	const handleCancel = (): void => {
		resetFormState()
		setDisabledActivities([])
		onClose() // Close the modal when canceling
	}

	const handleAdd = (): void => {
		if (!formIsValid) return

		// First create the product
		createProductAsync({
			...newProduct,
			options: newProduct.options
		}).then(response => {
			const productId = response._id

			// Then update activities with disabled products if any
			Promise.all(disabledActivities.map(async activity => {
				await updateActivityAsync(activity._id, {
					disabledProducts: [...activity.disabledProducts, productId]
				})
			})).then(() => {
				resetFormState()
				setDisabledActivities([])
				onClose()
			}).catch(error => {
				addError(error)
			})
		}).catch(error => {
			addError(error)
		})
	}

	return (
		<>
			<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
				<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
					<span className="font-medium text-blue-700">{'Nyt produkt'}</span>
				</div>
				<div className="flex flex-wrap">
					{/* 1. Aktiv */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Aktiv'}</div>
						<div className="flex items-center justify-center">
							<input
								title="Aktiv"
								type="checkbox"
								checked={newProduct.isActive}
								onChange={(e) => { handleFieldChange('isActive', e.target.checked) }}
								className="w-6 h-6"
							/>
						</div>
					</div>

					{/* 2. Billede */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Billede'}</div>
						<div className="flex items-center justify-center">
							<EditableImage
								URL={newProduct.imageURL}
								editable={true}
								onChange={(value) => { handleFieldChange('imageURL', value) }}
								className='w-12 h-12 object-contain'
							/>
						</div>
					</div>

					{/* 3. Navn */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="name"
								initialText=""
								placeholder="Navn"
								minSize={5}
								required={true}
								maxLength={15}
								editable={true}
								validations={[{
									validate: (v: string) => !products.some((a) => a.name.trim() === v.trim()),
									message: 'Navn er allerede i brug'
								}]}
								onChange={(value) => { handleFieldChange('name', value) }}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>

					{/* 4. Pris */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Pris'}</div>
						<div className="flex items-center justify-center text-gray-800 text-sm">
							<EditableField
								fieldName="price"
								initialText="0"
								placeholder="Pris"
								minSize={1}
								required={true}
								type="number"
								editable={true}
								onChange={(value) => { handleFieldChange('price', value) }}
								onValidationChange={handleValidationChange}
							/>
							<div className="pl-1">{'kr'}</div>
						</div>
					</div>

					{/* 5. Bestillingsvindue */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Bestillingsvindue'}</div>
						<div className="flex flex-col items-center justify-center text-sm">
							<div className="flex items-center justify-center text-gray-800">
								<span className="text-xs pr-1">{'Fra'}</span>
								<EditableField
									fieldName="fromHour"
									initialText="00"
									placeholder="Time"
									required={true}
									type="number"
									maxValue={23}
									maxLength={2}
									editable={true}
									onChange={(value) => { handleFieldChange('orderWindow.from.hour', value) }}
									onValidationChange={handleValidationChange}
								/>
								{':\r'}
								<EditableField
									fieldName="fromMinute"
									initialText="00"
									placeholder="Minut"
									required={true}
									type="number"
									maxValue={59}
									maxLength={2}
									editable={true}
									onChange={(value) => { handleFieldChange('orderWindow.from.minute', value) }}
									onValidationChange={handleValidationChange}
								/>
							</div>
							<div className="flex items-center justify-center text-gray-800">
								<span className="text-xs pr-1">{'Til'}</span>
								<EditableField
									fieldName="toHour"
									initialText="00"
									placeholder="Time"
									required={true}
									type="number"
									maxValue={23}
									maxLength={2}
									editable={true}
									onChange={(value) => { handleFieldChange('orderWindow.to.hour', value) }}
									onValidationChange={handleValidationChange}
								/>
								{':\r'}
								<EditableField
									fieldName="toMinute"
									initialText="00"
									placeholder="Minut"
									required={true}
									type="number"
									maxValue={59}
									maxLength={2}
									editable={true}
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

					{/* 6. Tilvalg */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Tilvalg'}</div>
						<div className="flex flex-col items-center justify-center">
							{newProduct.options.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={options.filter(o => newProduct.options.includes(o._id))}
								editable={true}
								onDeleteItem={(v) => { handleFieldChange('options', newProduct.options.filter((option) => option !== v._id)) }}
								onShowItems={() => { setShowOptions(true) }}
							/>
						</div>
					</div>

					{/* 7. Deaktiverede Aktiviteter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Aktiviteter'}</div>
						<div className="flex flex-col items-center justify-center">
							{disabledActivities.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={disabledActivities}
								editable={true}
								onDeleteItem={(v) => { setDisabledActivities(disabledActivities.filter((activity) => activity._id !== v._id)) }}
								onShowItems={() => { setShowDisabledActivities(true) }}
							/>
						</div>
					</div>
				</div>
				<div className="flex justify-end p-2 gap-2">
					<button
						onClick={handleCancel}
						className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
						type="button"
					>
						{'Annuller\r'}
					</button>
					<button
						onClick={handleAdd}
						disabled={!formIsValid}
						className={`px-3 py-1 text-sm rounded-full flex items-center ${
							formIsValid
								? 'bg-blue-600 hover:bg-blue-700 text-white'
								: 'bg-gray-200 text-gray-400 cursor-not-allowed'
						}`}
						type="button"
					>
						<Image className="h-4 w-4 mr-1" src={AdminImages.add.src} alt={AdminImages.add.alt} width={16} height={16} />
						{'Opret\r'}
					</button>
				</div>
			</div>

			{showOptions && (
				<SelectionWindow
					title={`Tilføj tilvalg til ${(newProduct.name.length > 0) || 'Nyt produkt'}`}
					items={options}
					selectedItems={options.filter(option => newProduct.options.includes(option._id))}
					onAddItem={(v) => { handleFieldChange('options', [...newProduct.options, v._id]) }}
					onDeleteItem={(v) => { handleFieldChange('options', newProduct.options.filter((optionId) => optionId !== v._id)) }}
					onClose={() => { setShowOptions(false) }}
				/>
			)}

			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj deaktiverede aktiviteter til ${(newProduct.name.length > 0) || 'Nyt produkt'}`}
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

export default AddProduct
