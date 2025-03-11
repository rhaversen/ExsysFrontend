import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type OptionType, type PostOptionType, type ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import SelectionWindow from '../../ui/SelectionWindow'

const Option = ({
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

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postOption(option)
	}, [option, postOption])

	return (
		<CloseableModal onClose={onClose} canClose={!showProducts}>
			<div className="flex flex-col items-center justify-center">
				<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Tilvalg'}</p>
				<p className="italic text-gray-500">{'Navn og Pris:'}</p>
				<div className="flex flex-row items-center gap-2 justify-center">
					<div className="font-bold text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							required={true}
							minSize={5}
							maxLength={50}
							validations={[{
								validate: (v: string) => !options.some((a) => a.name === v),
								message: 'Navn er allerede i brug'
							}]}
							onChange={handleNameChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-800">
						<EditableField
							fieldName="price"
							placeholder="Pris"
							italic={true}
							required={true}
							minSize={2}
							type="number"
							onChange={handlePriceChange}
							onValidationChange={handleValidationChange}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<p className="italic text-gray-500 pt-2">{'Billede:'}</p>
				<EditableImage
					URL={option.imageURL}
					onChange={handleImageChange}
				/>
				{selectedProducts.length > 0 && (
					<p className="italic text-gray-500 pt-2">{'Produkter:'}</p>
				)}
				{selectedProducts.length === 0 && (
					<p className="italic text-gray-500 pt-2">{'Tilføj Produkter:'}</p>
				)}
				<ItemsDisplay
					items={selectedProducts}
					onDeleteItem={handleDeleteProduct}
					onShowItems={() => { setShowProducts(true) }}
				/>
			</div>
			<CompletePostControls
				formIsValid={formIsValid}
				canClose={!showProducts}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
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
		</CloseableModal>
	)
}

export default Option
