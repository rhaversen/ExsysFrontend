import { type OptionType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import axios from 'axios'
import ErrorWindow from '@/components/ui/ErrorWindow'

const Option = ({
	onOptionPosted,
	onClose
}: {
	onOptionPosted: (option: OptionType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [backendErrorMessages, setBackendErrorMessages] = useState<string | null>(null)
	const [option, setOption] = useState<Omit<OptionType, '_id'>>({
		name: '',
		price: 0,
		imageURL: ''
	})
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

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

	const postOption = (option: Omit<OptionType, '_id'>): void => {
		axios.post(API_URL + '/v1/options', option).then((response) => {
			onOptionPosted(response.data as OptionType)
			onClose()
		}).catch((error) => {
			console.error('Error updating option:', error)
			setBackendErrorMessages(error.response.data.error as string)
		})
	}

	const handleNameChange = (v: string): void => {
		setOption({
			...option,
			name: v
		})
	}

	const handlePriceChange = (v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setOption({
			...option,
			price: Number(v)
		})
	}

	const handleImageChange = (v: string): void => {
		setOption({
			...option,
			imageURL: v
		})
	}

	const handleCancelPost = (): void => {
		onClose()
	}

	const handleCompletePost = (): void => {
		postOption(option)
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
								text={option.name}
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
						disabled={!formIsValid}
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

export default Option
