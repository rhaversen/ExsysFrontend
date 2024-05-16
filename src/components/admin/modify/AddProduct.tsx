import { type OptionType, type ProductType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import Options from '@/components/admin/modify/productOptions/Options'
import OptionsWindow from '@/components/admin/modify/OptionsWindow'
import axios from 'axios'
import { convertOrderWindowFromUTC, convertOrderWindowToUTC } from '@/lib/timeUtils'
import ErrorWindow from '@/components/ui/ErrorWindow'

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

	const [backendErrorMessages, setBackendErrorMessages] = useState<string | null>(null)
	const [product, setProduct] = useState<Omit<ProductType, '_id'>>({
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

	const postProduct = (product: Omit<ProductType, '_id'>): void => {
		// Convert order window to UTC with convertOrderWindowToUTC
		const productUTC = {
			...product,
			orderWindow: convertOrderWindowToUTC(product.orderWindow)
		}
		axios.post(API_URL + '/v1/products', productUTC).then((response) => {
			const product = response.data as ProductType
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			onProductPosted(product)
			onClose()
		}).catch((error) => {
			console.error('Error updating product:', error)
			setBackendErrorMessages(error.response.data.error as string)
		})
	}

	const handleNameChange = (v: string): void => {
		setProduct({
			...product,
			name: v
		})
	}

	const handlePriceChange = (v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setProduct({
			...product,
			price: Number(v)
		})
	}

	const handleImageChange = (v: string): void => {
		setProduct({
			...product,
			imageURL: v
		})
	}

	const handleOrderWindowFromMinuteChange = (v: string): void => {
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
	}

	const handleOrderWindowFromHourChange = (v: string): void => {
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
	}

	const handleOrderWindowToMinuteChange = (v: string): void => {
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
	}

	const handleOrderWindowToHourChange = (v: string): void => {
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
	}

	const handleAddOption = (v: OptionType): void => {
		setProduct({
			...product,
			options: [...product.options, v]
		})
	}

	const handleDeleteOption = (v: OptionType): void => {
		setProduct({
			...product,
			options: product.options.filter((option) => option._id !== v._id)
		})
	}

	const handleCancelPost = (): void => {
		onClose()
	}

	const handleCompletePost = (): void => {
		postProduct(product)
	}

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
					<div className="flex flex-row items-center justify-center">
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								text={product.name}
								italic={false}
								editable={true}
								edited={false}
								onChange={(v: string) => {
									handleNameChange(v)
								}}
							/>
						</div>
						<div className="flex flex-row italic items-center text-gray-800">
							<EditableField
								text={product.price.toString()}
								italic={true}
								editable={true}
								edited={false}
								onChange={(v: string) => {
									handlePriceChange(v)
								}}
							/>
							<div className="pl-1">
								{' kr'}
							</div>
						</div>
					</div>
					<div className="flex flex-row text-gray-800">
						<EditableField
							text={product.orderWindow.from.hour.toString().padStart(2, '0')}
							italic={false}
							editable={true}
							edited={false}
							onChange={(v: string) => {
								handleOrderWindowFromHourChange(v)
							}}
						/>:
						<EditableField
							text={product.orderWindow.from.minute.toString().padStart(2, '0')}
							italic={false}
							editable={true}
							edited={false}
							onChange={(v: string) => {
								handleOrderWindowFromMinuteChange(v)
							}}
						/>
						{' - '}
						<EditableField
							text={product.orderWindow.to.hour.toString().padStart(2, '0')}
							italic={false}
							editable={true}
							edited={false}
							onChange={(v: string) => {
								handleOrderWindowToHourChange(v)
							}}
						/>:
						<EditableField
							text={product.orderWindow.to.minute.toString().padStart(2, '0')}
							italic={false}
							editable={true}
							edited={false}
							onChange={(v: string) => {
								handleOrderWindowToMinuteChange(v)
							}}
						/>
					</div>
					<EditableImage
						defaultURL={product.imageURL}
						newURL={product.imageURL}
						editable={true}
						edited={false}
						onChange={(v: string) => {
							handleImageChange(v)
						}}
					/>
					{product.options.length > 0 &&
						<p className="italic text-gray-500">{'Tilvalg:'}</p>
					}
					{product.options.length === 0 &&
						<p className="italic text-gray-500">{'Tilføj Tilvalg:'}</p>
					}
					<Options
						selectedOptions={product.options}
						editable={true}
						onDeleteOption={(v: OptionType) => {
							handleDeleteOption(v)
						}}
						showOptions={() => {
							setShowOptions(true)
						}}
					/>
					{showOptions &&
						<OptionsWindow
							productName={product.name}
							options={options}
							productOptions={product.options}
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
				<div className="flex flex-row justify-center gap-4">
					<button
						type="button"
						className="bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4"
						onClick={handleCancelPost}
					>
						{'Annuller'}
					</button>
					<button
						type="button"
						className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
						onClick={handleCompletePost}
					>
						{'Færdig'}
					</button>
				</div>
			</div>
			{backendErrorMessages !== null &&
				<ErrorWindow
					onClose={() => {
						setBackendErrorMessages(null)
					}}
					errorMessage={backendErrorMessages}
				/>
			}
		</div>
	)
}

export default AddProduct
