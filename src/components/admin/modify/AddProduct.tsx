import OptionsWindow from '@/components/admin/modify/OptionsWindow'
import Options from '@/components/admin/modify/productOptions/Options'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC, convertOrderWindowToUTC } from '@/lib/timeUtils'
import { type OptionType, type PostProductType, type ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const AddProduct = ({
	options,
	onProductPosted,
	onClose
}: {
	options: OptionType[]
	onProductPosted: (product: ProductType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [product, setProduct] = useState<PostProductType>({
		name: '',
		price: 0,
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
	})
	const [showOptions, setShowOptions] = useState(false)
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

	const postProduct = useCallback((product: PostProductType): void => {
		// Convert order window to UTC with convertOrderWindowToUTC
		const productUTC = {
			...product,
			orderWindow: convertOrderWindowToUTC(product.orderWindow)
		}
		axios.post(API_URL + '/v1/products', productUTC, { withCredentials: true }).then((response) => {
			const product = response.data as ProductType
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			onProductPosted(product)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onProductPosted, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setProduct({
			...product,
			name: v
		})
	}, [product])

	const handlePriceChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setProduct({
			...product,
			price: Number(v)
		})
	}, [product])

	const handleImageChange = useCallback((v: string): void => {
		setProduct({
			...product,
			imageURL: v
		})
	}, [product])

	const handleOrderWindowFromMinuteChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setProduct({
			...product,
			orderWindow: {
				...product.orderWindow,
				from: {
					...product.orderWindow.from,
					minute: Number(v)
				}
			}
		})
	}, [product])

	const handleOrderWindowFromHourChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setProduct({
			...product,
			orderWindow: {
				...product.orderWindow,
				from: {
					...product.orderWindow.from,
					hour: Number(v)
				}
			}
		})
	}, [product])

	const handleOrderWindowToMinuteChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setProduct({
			...product,
			orderWindow: {
				...product.orderWindow,
				to: {
					...product.orderWindow.to,
					minute: Number(v)
				}
			}
		})
	}, [product])

	const handleOrderWindowToHourChange = useCallback((v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setProduct({
			...product,
			orderWindow: {
				...product.orderWindow,
				to: {
					...product.orderWindow.to,
					hour: Number(v)
				}
			}
		})
	}, [product])

	const handleAddOption = useCallback((v: OptionType): void => {
		setProduct({
			...product,
			options: [...product.options, v._id]
		})
	}, [product])

	const handleDeleteOption = useCallback((v: OptionType): void => {
		setProduct({
			...product,
			options: product.options.filter((option) => option !== v._id)
		})
	}, [product])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postProduct(product)
	}, [product, postProduct])

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
			>
				<span className="sr-only">
					{'Close'}
				</span>
			</button>
			<div className="absolute bg-white rounded-3xl p-10">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Produkt'}</p>
					<p className="italic text-gray-500">{'Navn og Pris:'}</p>
					<div className="flex flex-row items-center gap-2 justify-center">
						<div className="font-bold text-gray-800">
							<EditableField
								fieldName="name"
								placeholder="Navn"
								italic={false}
								minSize={5}
								required={true}
								maxLength={15}
								editable={true}
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
								editable={true}
								onChange={handlePriceChange}
								onValidationChange={handleValidationChange}
							/>
							<div className="pl-1">
								{' kr'}
							</div>
						</div>
					</div>
					<p className="italic text-gray-500 pt-2">{'Bestillingsvindue:'}</p>
					<div className="flex flex-row text-gray-800">
						<EditableField
							fieldName="fromHour"
							initialText={product.orderWindow.from.hour.toString()}
							placeholder="Time"
							italic={false}
							required={true}
							type="number"
							maxValue={23}
							maxLength={2}
							editable={true}
							onChange={handleOrderWindowFromHourChange}
							onValidationChange={handleValidationChange}
						/>
						<div className="font-bold text-xl px-1">{':'}</div>
						<EditableField
							fieldName="fromMinute"
							initialText={product.orderWindow.from.minute.toString()}
							placeholder="Minut"
							italic={false}
							required={true}
							type="number"
							maxValue={59}
							maxLength={2}
							editable={true}
							onChange={handleOrderWindowFromMinuteChange}
							onValidationChange={handleValidationChange}
						/>
						<div className="text-xl px-1">{'—'}</div>
						<EditableField
							fieldName="toHour"
							initialText={product.orderWindow.to.hour.toString()}
							placeholder="Time"
							italic={false}
							required={true}
							type="number"
							maxValue={23}
							maxLength={2}
							editable={true}
							onChange={handleOrderWindowToHourChange}
							onValidationChange={handleValidationChange}
						/>
						<div className="font-bold text-xl px-1">{':'}</div>
						<EditableField
							fieldName="toMinute"
							initialText={product.orderWindow.to.minute.toString()}
							placeholder="Minut"
							italic={false}
							required={true}
							type="number"
							maxValue={59}
							maxLength={2}
							editable={true}
							onChange={handleOrderWindowToMinuteChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<p className="italic text-gray-500 pt-2">{'Billede:'}</p>
					<EditableImage
						URL={product.imageURL}
						editable={true}
						edited={false}
						onChange={handleImageChange}
					/>
					{product.options.length > 0 &&
						<p className="italic text-gray-500 pt-2">{'Tilvalg:'}</p>
					}
					{product.options.length === 0 &&
						<p className="italic text-gray-500 pt-2">{'Tilføj Tilvalg:'}</p>
					}
					<Options
						selectedOptions={options.filter((option) => product.options.includes(option._id))}
						editable={true}
						onDeleteOption={handleDeleteOption}
						showOptions={() => {
							setShowOptions(true)
						}}
					/>
					{showOptions &&
						<OptionsWindow
							productName={product.name}
							options={options}
							productOptions={options.filter((option) => product.options.includes(option._id))}
							onAddOption={handleAddOption}
							onDeleteOption={handleDeleteOption}
							onClose={() => {
								setShowOptions(false)
							}}
						/>
					}
				</div>
				<div className="flex flex-row justify-center gap-4 pt-5">
					<button
						type="button"
						className="bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4"
						onClick={handleCancelPost}
					>
						{'Annuller'}
					</button>
					<button
						type="button"
						disabled={!formIsValid}
						className={`${formIsValid ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-200'} text-white rounded-md py-2 px-4`}
						onClick={handleCompletePost}
					>
						{'Færdig'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default AddProduct
