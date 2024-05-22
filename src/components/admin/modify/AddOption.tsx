import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type OptionType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const Option = ({
	onOptionPosted,
	onClose
}: {
	onOptionPosted: (option: OptionType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [option, setOption] = useState<Omit<OptionType, '_id'>>({
		name: '',
		price: 0,
		imageURL: ''
	})
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({ name: false })
	const [formIsValid, setFormIsValid] = useState(false)

	// Update formIsValid when fieldValidations change
	useEffect(() => {
		const formIsValid = Object.values(fieldValidations).every((v) => v)
		setFormIsValid(formIsValid)
	}, [fieldValidations])

	const handleValidationChange = useCallback((fieldId: string, v: boolean): void => {
		setFieldValidations((prev) => {
			return {
				...prev,
				[fieldId]: v
			}
		})
	}, [])

	const postOption = useCallback((option: Omit<OptionType, '_id'>): void => {
		axios.post(API_URL + '/v1/options', option).then((response) => {
			onOptionPosted(response.data as OptionType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onOptionPosted, onClose, addError])

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

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postOption(option)
	}, [option, postOption])

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
					<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Tilvalg'}</p>
					<p className="italic text-gray-500">{'Navn og Pris:'}</p>
					<div className="flex flex-row items-center gap-2 justify-center">
						<div className="font-bold text-gray-800">
							<EditableField
								text={option.name}
								placeholder='Navn'
								italic={false}
								validations={[{
									validate: (v) => v.length > 0,
									message: 'Navn skal udfyldes'
								}, {
									validate: (v) => v.length <= 20,
									message: 'Navn kan højest have 20 tegn'
								}]}
								editable={true}
								edited={false}
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
								text={option.price.toString()}
								placeholder='Pris'
								italic={true}
								validations={[{
									validate: (v) => !isNaN(Number(v)),
									message: 'Prisen skal være et tal'
								}, {
									validate: (v) => Number(v) >= 0,
									message: 'Prisen skal være positiv'
								}]}
								editable={true}
								edited={false}
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
					<p className="italic text-gray-500 pt-2">{'Billede:'}</p>
					<EditableImage
						defaultURL={option.imageURL}
						newURL={option.imageURL}
						editable={true}
						edited={false}
						onChange={(v: string) => {
							handleImageChange(v)
						}}
					/>
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

export default Option
