import Options from '@/components/admin/modify/catalog/product/productOptions/Options'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowToUTC } from '@/lib/timeUtils'
import { type OptionType, type PostProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import InlineValidation from '../../ui/InlineValidation'
import SelectionWindow from '../../ui/SelectionWindow'

const AddProduct = ({
	options,
	onClose
}: {
	options: OptionType[]
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
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError])

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
		<CloseableModal onClose={onClose} canClose={!showOptions}>
			<div className="flex flex-col items-center justify-center">
				<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Produkt'}</p>
				<p className="italic text-gray-500">{'Navn og Pris:'}</p>
				<div className="flex flex-row items-center gap-2 justify-center">
					<div className="font-bold text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							minSize={5}
							required={true}
							maxLength={15}
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
				<p className="italic text-gray-500 pt-2">{'Bestillingsvindue:'}</p>
				<div className="flex flex-row text-gray-800">
					<EditableField
						fieldName="fromHour"
						initialText={product.orderWindow.from.hour.toString()}
						placeholder="Time"
						required={true}
						type="number"
						maxValue={23}
						maxLength={2}
						onChange={handleOrderWindowFromHourChange}
						onValidationChange={handleValidationChange}
					/>
					<div className="font-bold text-xl px-1">{':'}</div>
					<EditableField
						fieldName="fromMinute"
						initialText={product.orderWindow.from.minute.toString()}
						placeholder="Minut"
						required={true}
						type="number"
						maxValue={59}
						maxLength={2}
						onChange={handleOrderWindowFromMinuteChange}
						onValidationChange={handleValidationChange}
					/>
					<div className="text-xl px-1">{'—'}</div>
					<EditableField
						fieldName="toHour"
						initialText={product.orderWindow.to.hour.toString()}
						placeholder="Time"
						required={true}
						type="number"
						maxValue={23}
						maxLength={2}
						onChange={handleOrderWindowToHourChange}
						onValidationChange={handleValidationChange}
					/>
					<div className="font-bold text-xl px-1">{':'}</div>
					<EditableField
						fieldName="toMinute"
						initialText={product.orderWindow.to.minute.toString()}
						placeholder="Minut"
						required={true}
						type="number"
						maxValue={59}
						maxLength={2}
						onChange={handleOrderWindowToMinuteChange}
						onValidationChange={handleValidationChange}
					/>
				</div>
				<InlineValidation
					fieldName="orderWindow"
					validations={[
						{
							validate: () => {
								const from = product.orderWindow.from
								const to = product.orderWindow.to
								return from.hour !== to.hour || from.minute !== to.minute
							},
							message: 'Bestillingsvinduet kan ikke starte samme tid som det slutter'
						}
					]}
					onValidationChange={handleValidationChange}
				/>
				<p className="italic text-gray-500 pt-2">{'Billede:'}</p>
				<EditableImage
					URL={product.imageURL}
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
					onDeleteOption={handleDeleteOption}
					showOptions={() => {
						setShowOptions(true)
					}}
				/>
				{showOptions &&
					<SelectionWindow
						title={`Tilføj tilvalg til ${product.name}`}
						items={options}
						selectedItems={options.filter((option) => product.options.includes(option._id))}
						onAddItem={handleAddOption}
						onDeleteItem={handleDeleteOption}
						onClose={() => {
							setShowOptions(false)
						}}
					/>
				}
			</div>
			<CompletePostControls
				canClose={!showOptions}
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default AddProduct
