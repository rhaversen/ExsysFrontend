import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type OptionType, type PostOptionType, type ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import SelectionWindow from '../../ui/SelectionWindow'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

const AddOption = ({
	options,
	products,
	onClose
}: {
	options: OptionType[]
	products: ProductType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [option, setOption] = useState<PostOptionType>({
		name: '',
		price: 0,
		imageURL: ''
	})
	const [selectedProducts, setSelectedProducts] = useState<ProductType[]>([])
	const [showProducts, setShowProducts] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(false)

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

	const postOption = useCallback((option: PostOptionType): void => {
		axios.post(API_URL + '/v1/options', option, { withCredentials: true }).then((response) => {
			const optionId = response.data._id
			// Update each selected product to include the new option
			Promise.all(selectedProducts.map(async product => {
				const updatedOptions = [...product.options.map(o => o._id), optionId]
				await axios.patch(API_URL + `/v1/products/${product._id}`, {
					...product,
					options: updatedOptions
				}, { withCredentials: true })
			}))
				.then(() => { onClose() })
				.catch(error => { addError(error) })
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError, selectedProducts])

	const handleNameChange = useCallback((v: string): void => {
		setOption({
			...option,
			name: v
		})
	}, [option])

	const handlePriceChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setOption({
			...option,
			price: Number(v)
		})
	}, [option])

	const handleImageChange = useCallback((v: string): void => {
		setOption({
			...option,
			imageURL: v
		})
	}, [option])

	const handleAddProduct = useCallback((product: ProductType): void => {
		setSelectedProducts(prev => [...prev, product])
	}, [])

	const handleDeleteProduct = useCallback((product: ProductType): void => {
		setSelectedProducts(prev => prev.filter(p => p._id !== product._id))
	}, [])

	const handleCancel = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleAdd = useCallback((): void => {
		if (!formIsValid) return
		postOption(option)
	}, [option, postOption, formIsValid])

	return (
		<>
			<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
				<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
					<span className="font-medium text-blue-700">{'Nyt tilvalg'}</span>
				</div>
				<div className="flex flex-wrap">
					{/* 1. Billede */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Billede'}</div>
						<div className="flex items-center justify-center">
							<EditableImage
								URL={option.imageURL}
								editable={true}
								onChange={handleImageChange}
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
								initialText=""
								placeholder="Navn"
								required={true}
								minSize={5}
								maxLength={50}
								validations={[{
									validate: (v: string) => !options.some((a) => a.name === v),
									message: 'Navn er allerede i brug'
								}]}
								editable={true}
								onChange={handleNameChange}
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
								initialText="0"
								placeholder="Pris"
								italic={true}
								required={true}
								minSize={2}
								type="number"
								editable={true}
								onChange={handlePriceChange}
								onValidationChange={handleValidationChange}
							/>
							<div className="pl-1">{'kr'}</div>
						</div>
					</div>

					{/* 4. Tilknyttede produkter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Tilknyttede Produkter'}</div>
						<div className="flex flex-col items-center justify-center">
							{selectedProducts.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={selectedProducts}
								editable={true}
								onDeleteItem={handleDeleteProduct}
								onShowItems={() => { setShowProducts(true) }}
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

			{showProducts && (
				<SelectionWindow
					title={`Tilføj Produkter til ${option.name === '' ? 'Nyt Tilvalg' : option.name}`}
					items={products}
					selectedItems={selectedProducts}
					onAddItem={handleAddProduct}
					onDeleteItem={handleDeleteProduct}
					onClose={() => { setShowProducts(false) }}
				/>
			)}
		</>
	)
}

export default AddOption
