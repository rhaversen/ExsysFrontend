import { type OptionType, type ProductType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import Options from '@/components/admin/modify/productOptions/Options'
import OptionsWindow from '@/components/admin/modify/OptionsWindow'
import axios from 'axios'
import { convertOrderWindowFromUTC, convertOrderWindowToUTC } from '@/lib/timeUtils'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const Product = ({
	product,
	options,
	onProductPatched,
	onProductDeleted
}: {
	product: ProductType
	options: OptionType[]
	onProductPatched: (product: ProductType) => void
	onProductDeleted: (id: ProductType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newProduct, setNewProduct] = useState<ProductType>(product)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showOptions, setShowOptions] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

	useEffect(() => {
		// Delete options from newProduct that are not in options
		setNewProduct(n => {
			return {
				...n,
				options: n.options.filter((option) => options.map((option) => option._id).includes(option._id))
			}
		})
	}, [options])

	// Update formIsValid when fieldValidations change
	useEffect(() => {
		const formIsValid = Object.values(fieldValidations).every((v) => v)
		setFormIsValid(formIsValid)
	}, [fieldValidations])

	// Reset validation errors when not editing (e.g. when editing is cancelled or completed, meaning validation errors are no longer relevant)
	useEffect(() => {
		if (isEditing) return
		setFormIsValid(true)
	}, [isEditing])

	const handleValidationChange = useCallback((fieldId: string, v: boolean): void => {
		setFieldValidations((prev) => {
			return {
				...prev,
				[fieldId]: v
			}
		})
	}, [])

	const patchProduct = useCallback((product: ProductType, productPatch: Omit<ProductType, '_id'>): void => {
		// Convert order window to UTC with convertOrderWindowToUTC
		const productPatchUTC = {
			...productPatch,
			orderWindow: convertOrderWindowToUTC(productPatch.orderWindow)
		}
		axios.patch(API_URL + `/v1/products/${product._id}`, productPatchUTC).then((response) => {
			const product = response.data as ProductType
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			onProductPatched(product)
		}).catch((error) => {
			addError(error)
			setNewProduct(product)
		})
	}, [API_URL, onProductPatched, addError])

	const deleteProduct = useCallback((product: ProductType, confirm: boolean): void => {
		axios.delete(API_URL + `/v1/products/${product._id}`, {
			data: { confirm }
		}).then(() => {
			onProductDeleted(product._id)
		}).catch((error) => {
			addError(error)
			setNewProduct(product)
		})
	}, [API_URL, onProductDeleted, addError])

	const handleNameChange = useCallback((v: string): void => {
		setNewProduct({
			...newProduct,
			name: v
		})
	}, [newProduct])

	const handlePriceChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setNewProduct({
			...newProduct,
			price: Number(v)
		})
	}, [newProduct])

	const handleImageChange = useCallback((v: string): void => {
		setNewProduct({
			...newProduct,
			imageURL: v
		})
	}, [newProduct])

	const handleOrderWindowFromMinuteChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				from: {
					...newProduct.orderWindow.from,
					minute: Number(v)
				}
			}
		})
	}, [newProduct])

	const handleOrderWindowFromHourChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				from: {
					...newProduct.orderWindow.from,
					hour: Number(v)
				}
			}
		})
	}, [newProduct])

	const handleOrderWindowToMinuteChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				to: {
					...newProduct.orderWindow.to,
					minute: Number(v)
				}
			}
		})
	}, [newProduct])

	const handleOrderWindowToHourChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				to: {
					...newProduct.orderWindow.to,
					hour: Number(v)
				}
			}
		})
	}, [newProduct])

	const handleAddOption = useCallback((v: OptionType): void => {
		setNewProduct({
			...newProduct,
			options: [...newProduct.options, v]
		})
	}, [newProduct])

	const handleDeleteOption = useCallback((v: OptionType): void => {
		setNewProduct({
			...newProduct,
			options: newProduct.options.filter((option) => option._id !== v._id)
		})
	}, [newProduct])

	const handleUndoEdit = useCallback((): void => {
		setNewProduct(product)
		setIsEditing(false)
	}, [product])

	const handleCompleteEdit = useCallback((): void => {
		patchProduct(product, newProduct)
		setIsEditing(false)
	}, [product, newProduct, patchProduct])

	const handleDeleteProduct = useCallback((confirm: boolean): void => {
		deleteProduct(product, confirm)
	}, [product, deleteProduct])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							text={newProduct.name}
							placeholder='Navn'
							italic={false}
							validations={[{
								validate: (v: string) => v.length > 0,
								message: 'Navn skal udfyldes'
							}, {
								validate: (v: string) => v.length <= 15,
								message: 'Navn må maks være 15 tegn'
							}]}
							editable={isEditing}
							edited={newProduct.name !== product.name}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
							onValidationChange={(v: boolean) => {
								handleValidationChange('name', v)
							}}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-800">
						<EditableField
							text={newProduct.price.toString()}
							placeholder='Pris'
							italic={true}
							validations={[{
								validate: (v: string) => !isNaN(Number(v)),
								message: 'Pris skal være et tal'
							}, {
								validate: (v: string) => Number(v) >= 0,
								message: 'Pris skal være positiv'
							}]}
							editable={isEditing}
							edited={newProduct.price !== product.price}
							onChange={(v: string) => {
								handlePriceChange(v)
							}}
							onValidationChange={(v: boolean) => {
								handleValidationChange('price', v)
							}}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<div className="flex flex-row text-gray-800">
					<EditableField
						text={newProduct.orderWindow.from.hour.toString().padStart(2, '0')}
						placeholder='Time'
						italic={false}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 24,
							message: 'Time skal være mellem 0 og 24'
						}]}
						editable={isEditing}
						edited={newProduct.orderWindow.from.hour !== product.orderWindow.from.hour}
						onChange={(v: string) => {
							handleOrderWindowFromHourChange(v)
						}}
						onValidationChange={(v: boolean) => {
							handleValidationChange('fromHour', v)
						}}
					/>
					<div className={`${isEditing ? 'font-bold text-xl px-1' : 'px-0.5'}`}>{':'}</div>
					<EditableField
						text={newProduct.orderWindow.from.minute.toString().padStart(2, '0')}
						placeholder='Minut'
						italic={false}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 60,
							message: 'Minutter skal være mellem 0 og 60'
						}]}
						editable={isEditing}
						edited={newProduct.orderWindow.from.minute !== product.orderWindow.from.minute}
						onChange={(v: string) => {
							handleOrderWindowFromMinuteChange(v)
						}}
						onValidationChange={(v: boolean) => {
							handleValidationChange('fromMinute', v)
						}}
					/>
					<div className={`${isEditing ? 'text-xl px-1' : 'px-0.5'}`}>{'—'}</div>
					<EditableField
						text={newProduct.orderWindow.to.hour.toString().padStart(2, '0')}
						placeholder='Time'
						italic={false}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 24,
							message: 'Time skal være mellem 0 og 24'
						}]}
						editable={isEditing}
						edited={newProduct.orderWindow.to.hour !== product.orderWindow.to.hour}
						onChange={(v: string) => {
							handleOrderWindowToHourChange(v)
						}}
						onValidationChange={(v: boolean) => {
							handleValidationChange('toHour', v)
						}}
					/>
					<div className={`${isEditing ? 'font-bold text-xl px-1' : 'px-0.5'}`}>{':'}</div>
					<EditableField
						text={newProduct.orderWindow.to.minute.toString().padStart(2, '0')}
						placeholder='Minut'
						italic={false}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 60,
							message: 'Minutter skal være mellem 0 og 60'
						}]}
						editable={isEditing}
						edited={newProduct.orderWindow.to.minute !== product.orderWindow.to.minute}
						onChange={(v: string) => {
							handleOrderWindowToMinuteChange(v)
						}}
						onValidationChange={(v: boolean) => {
							handleValidationChange('toMinute', v)
						}}
					/>
				</div>
				<EditableImage
					defaultURL={product.imageURL}
					newURL={newProduct.imageURL}
					editable={isEditing}
					edited={newProduct.imageURL !== product.imageURL}
					onChange={(v: string) => {
						handleImageChange(v)
					}}
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
				<Options
					selectedOptions={newProduct.options}
					editable={isEditing}
					onDeleteOption={(v: OptionType) => {
						handleDeleteOption(v)
					}}
					showOptions={() => {
						setShowOptions(true)
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
						itemName={product.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirm: boolean) => {
							setShowDeleteConfirmation(false)
							handleDeleteProduct(confirm)
						}}
					/>
				}
				{showOptions &&
					<OptionsWindow
						productName={newProduct.name}
						options={options}
						productOptions={newProduct.options}
						onAddOption={(v: OptionType) => {
							handleAddOption(v)
						}}
						onDeleteOption={(v: OptionType) => {
							handleDeleteOption(v)
						}}
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
