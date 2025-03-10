import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostReaderType, type ReaderType, type KioskType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import EditableDropdown from '../../ui/EditableDropdown'

const Reader = ({
	readers,
	kiosks,
	onClose
}: {
	readers: ReaderType[]
	kiosks: KioskType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [reader, setReader] = useState<PostReaderType>({
		pairingCode: '',
		readerTag: undefined
	})
	const [selectedKioskId, setSelectedKioskId] = useState<string | null | undefined>(undefined)
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
			const newReaderId = response.data._id

			// If a kiosk was selected, update it to point to this reader
			if (selectedKioskId != null) {
				const kioskToUpdate = kiosks.find(k => k._id === selectedKioskId)
				if (kioskToUpdate != null) {
					axios.patch(
						API_URL + `/v1/kiosks/${selectedKioskId}`,
						{ ...kioskToUpdate, readerId: newReaderId },
						{ withCredentials: true }
					).catch(error => {
						addError(error)
					})
				}
			}

			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError, reader, selectedKioskId, kiosks])

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

	const handleKioskChange = useCallback((v: string): void => {
		setSelectedKioskId(v === 'null-option' ? undefined : v)
	}, [])

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
								message: 'Kortlæser # er allerede i brug'
							}]}
							type="number"
							onValidationChange={handleValidationChange}
						/>
					</div>

					<p className="italic text-gray-500">{'Tilknyt til Kiosk'}</p>
					<EditableDropdown
						options={
							kiosks.filter(kiosk =>
								// Filter out kiosks that already have a reader assigned
								(kiosk.readerId?._id) == null
							).map(kiosk => ({
								value: kiosk._id,
								label: kiosk.name
							}))
						}
						onChange={handleKioskChange}
						fieldName="kioskId"
						placeholder="Vælg Kiosk"
						allowNullOption={true}
						onValidationChange={handleValidationChange}
					/>
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
