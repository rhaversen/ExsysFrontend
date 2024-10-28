import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostOptionType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'

const Option = ({
	onClose
}: {
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [option, setOption] = useState<PostOptionType>({
		name: '',
		price: 0,
		imageURL: ''
	})
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
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError])

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
		<CloseableModal onClose={onClose}>
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
			</div>
			<CompletePostControls
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default Option
