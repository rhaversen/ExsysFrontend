import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostReaderType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const Reader = ({
	onReaderPosted,
	onClose
}: {
	onReaderPosted: (reader: ReaderType) => void
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
			onReaderPosted(response.data as ReaderType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onReaderPosted, onClose, addError, reader])

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
					<div className="flex flex-col items-center justify-center">
						<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Kortlæser'}</p>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								upperCase={true}
								fieldName="pairingCode"
								placeholder="Parring Kode"
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={handlePairingCodeChange}
								validations={[{
									validate: (v: string) => v.length <= 10,
									message: 'Kode kan kun have 10 tegn'
								}]}
								onValidationChange={handleValidationChange}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName="tag"
								placeholder="Tag (Automatisk)"
								italic={false}
								minSize={15}
								required={false}
								editable={true}
								onChange={handleReaderTagChange}
								validations={[{
									validate: (v: string) => v.length === 5 || v.length === 0,
									message: 'Kortlæser tag skal være præcis 5 tal eller tomt'
								}, {
									validate: (v: string) => /^\d+$/.exec(v) !== null || v.length === 0,
									message: 'Kortlæser tag må kun være tal'
								}]}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>
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

export default Reader
