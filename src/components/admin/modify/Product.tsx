import OptionsWindow from '@/components/admin/modify/OptionsWindow'
import Options from '@/components/admin/modify/productOptions/Options'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC, convertOrderWindowToUTC } from '@/lib/timeUtils'
import { type OptionType, type PatchProductType, type ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Timestamps from './ui/Timestamps'

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

	// Update newProduct when options change
	useEffect(() => {
		setNewProduct(n => {
			// Filter out options that are not in the options array
			const filteredOptions = n.options.filter((option) =>
				options.map((opt) => opt._id).includes(option._id)
			)

			// Update the remaining options with new data from the options array
			const updatedOptions = filteredOptions.map((option) => {
				const newOption = options.find((o) => o._id === option._id)
				return newOption ?? option
			})

			return {
				...n,
				options: updatedOptions
			}
		})
	}, [options])

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

	const patchProduct = useCallback((productPatch: PatchProductType): void => {
		// Convert order window to UTC with convertOrderWindowToUTC
		const productPatchUTC = {
			...productPatch,
			orderWindow: (productPatch.orderWindow !== undefined) && convertOrderWindowToUTC(productPatch.orderWindow)
		}
		axios.patch(API_URL + `/v1/products/${product._id}`, productPatchUTC, { withCredentials: true }).then((response) => {
			const product = response.data as ProductType
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			onProductPatched(product)
		}).catch((error) => {
			addError(error)
			setNewProduct(product)
		})
	}, [API_URL, onProductPatched, addError, product])

	const deleteProduct = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/products/${product._id}`, {
			data: { confirm },
			withCredentials: true
		}).then(() => {
			onProductDeleted(product._id)
		}).catch((error) => {
			addError(error)
			setNewProduct(product)
		})
	}, [API_URL, onProductDeleted, addError, product])

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
		patchProduct({
			...newProduct,
			options: newProduct.options.map((option) => option._id)
		})
		setIsEditing(false)
	}, [patchProduct, newProduct])

	const handleDeleteProduct = useCallback((confirm: boolean): void => {
		deleteProduct(confirm)
	}, [deleteProduct])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={product.name}
							placeholder="Navn"
							italic={false}
							minSize={5}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 15,
								message: 'Navn kan kun have 15 tegn'
							}]}
							editable={isEditing}
							onChange={handleNameChange}
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
							validations={[{
								validate: (v: string) => !isNaN(Number(v)),
								message: 'Pris skal være et tal'
							}, {
								validate: (v: string) => Number(v) >= 0,
								message: 'Pris skal være positiv'
							}]}
							editable={isEditing}
							onChange={handlePriceChange}
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
						italic={false}
						required={true}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 24,
							message: 'Time skal være mellem 0 og 24'
						}]}
						editable={isEditing}
						onChange={handleOrderWindowFromHourChange}
						onValidationChange={handleValidationChange}
					/>
					<div className={`${isEditing ? 'font-bold text-xl px-1' : 'px-0.5'}`}>{':'}</div>
					<EditableField
						fieldName="fromMinute"
						initialText={product.orderWindow.from.minute.toString().padStart(2, '0')}
						placeholder="Minut"
						italic={false}
						required={true}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 60,
							message: 'Minutter skal være mellem 0 og 60'
						}]}
						editable={isEditing}
						onChange={handleOrderWindowFromMinuteChange}
						onValidationChange={handleValidationChange}
					/>
					<div className={`${isEditing ? 'text-xl px-1' : 'px-0.5'}`}>
						{'—'}
					</div>
					<EditableField
						fieldName="toHour"
						initialText={product.orderWindow.to.hour.toString().padStart(2, '0')}
						placeholder="Time"
						italic={false}
						required={true}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 24,
							message: 'Time skal være mellem 0 og 24'
						}]}
						editable={isEditing}
						onChange={handleOrderWindowToHourChange}
						onValidationChange={handleValidationChange}
					/>
					<div className={`${isEditing ? 'font-bold text-xl px-1' : 'px-0.5'}`}>{':'}</div>
					<EditableField
						fieldName="toMinute"
						initialText={product.orderWindow.to.minute.toString().padStart(2, '0')}
						placeholder="Minut"
						italic={false}
						required={true}
						validations={[{
							validate: (v: string) => Number(v) >= 0 && Number(v) < 60,
							message: 'Minutter skal være mellem 0 og 60'
						}]}
						editable={isEditing}
						onChange={handleOrderWindowToMinuteChange}
						onValidationChange={handleValidationChange}
					/>
				</div>
				<EditableImage
					URL={newProduct.imageURL}
					editable={isEditing}
					edited={newProduct.imageURL !== product.imageURL}
					onChange={handleImageChange}
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
						onDeleteOption={handleDeleteOption}
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
						onAddOption={handleAddOption}
						onDeleteOption={handleDeleteOption}
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
