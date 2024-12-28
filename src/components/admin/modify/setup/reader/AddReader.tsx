import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostReaderType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'

const Reader = ({
	readers,
	onClose
}: {
	readers: ReaderType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [reader, setReader] = useState<PostReaderType>({
		pairingCode: '',
		readerTag: undefined
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

	const postReader = useCallback((): void => {
		axios.post(API_URL + '/v1/readers', reader, { withCredentials: true }).then((response) => {
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError, reader])

	const handlePairingCodeChange = useCallback((v: string): void => {
		setReader({
			...reader,
			pairingCode: v
		})
	}, [reader])

	const handleReaderTagChange = useCallback((v: string): void => {
		setReader({
			...reader,
			readerTag: (v === '') ? undefined : v
		})
	}, [reader])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postReader()
	}, [postReader])

	return (
		<CloseableModal onClose={onClose}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Kortlæser'}</p>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							upperCase={true}
							fieldName="pairingCode"
							placeholder="Parring Kode"
							minSize={10}
							required={true}
							onChange={handlePairingCodeChange}
							maxLength={10}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="tag"
							placeholder="Tag (Automatisk)"
							minSize={15}
							onChange={handleReaderTagChange}
							minLength={5}
							maxLength={5}
							validations={[{
								validate: (v: string) => v === '' || !readers.some((k) => k.readerTag === v),
								message: 'Kortlæser tag er allerede i brug'
							}]}
							type="number"
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>
			</div>
			<CompletePostControls
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default Reader
