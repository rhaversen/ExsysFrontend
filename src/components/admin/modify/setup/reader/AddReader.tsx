import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostReaderType, type ReaderType, type KioskType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableDropdown from '../../ui/EditableDropdown'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

const AddReader = ({
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

	const handleCancel = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleAdd = useCallback((): void => {
		if (!formIsValid) return
		postReader()
	}, [postReader, formIsValid])

	return (
		<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
			<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
				<span className="font-medium text-blue-700">{'Ny Kortlæser'}</span>
			</div>
			<div className="flex flex-wrap">
				{/* 1. Tag */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Kortlæser #'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="tag"
							placeholder="Kortlæser #"
							minSize={15}
							onChange={handleReaderTagChange}
							minLength={5}
							maxLength={5}
							validations={[{
								validate: (v: string) => v === '' || !readers.some((k) => k.readerTag.trim() === v.trim()),
								message: 'Kortlæser # er allerede i brug'
							}]}
							type="number"
							onValidationChange={handleValidationChange}
							editable={true}
							initialText=""
						/>
					</div>
				</div>

				{/* 2. Parring Kode */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Parring Kode'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							upperCase={true}
							fieldName="pairingCode"
							placeholder="Parring Kode"
							minSize={10}
							required={true}
							onChange={handlePairingCodeChange}
							maxLength={10}
							onValidationChange={handleValidationChange}
							editable={true}
							initialText=""
						/>
					</div>
				</div>

				{/* 3. Kiosk */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Tilknyttet Kiosk'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
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
							initialValue="null-option"
						/>
					</div>
				</div>
			</div>
			<div className="flex justify-end p-2 gap-2">
				<button
					onClick={handleCancel}
					className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
					type="button"
				>
					{'Annuller\r'}
				</button>
				<button
					onClick={handleAdd}
					disabled={!formIsValid}
					className={`px-3 py-1 text-sm rounded-full flex items-center ${formIsValid
						? 'bg-blue-600 hover:bg-blue-700 text-white'
						: 'bg-gray-200 text-gray-400 cursor-not-allowed'
					}`}
					type="button"
				>
					<Image className="h-4 w-4 mr-1" src={AdminImages.add.src} alt={AdminImages.add.alt} width={16} height={16} />
					{'Opret\r'}
				</button>
			</div>
		</div>
	)
}

export default AddReader
