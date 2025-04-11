import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType, type PostKioskType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableDropdown from '../../ui/EditableDropdown'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

const AddKiosk = ({
	kiosks,
	activities,
	readers,
	onClose
}: {
	kiosks: KioskType[]
	activities: ActivityType[]
	readers: ReaderType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [kiosk, setKiosk] = useState<PostKioskType>({
		readerId: '',
		name: '',
		kioskTag: undefined,
		password: '',
		activities: [],
		disabledActivities: []
	})
	const [showActivities, setShowActivities] = useState(false)
	const [showDisabledActivities, setShowDisabledActivities] = useState(false)
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

	const postKiosk = useCallback((kiosk: PostKioskType): void => {
		axios.post(API_URL + '/v1/kiosks', kiosk, { withCredentials: true }).then((response) => {
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			name: v
		})
	}, [kiosk])

	const handlePasswordChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			password: v
		})
	}, [kiosk])

	const handleKioskTagChange = useCallback((v: KioskType['kioskTag']): void => {
		setKiosk({
			...kiosk,
			kioskTag: (v === '') ? undefined : v as any
		})
	}, [kiosk])

	const handleAddActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			activities: [...kiosk.activities, v._id]
		})
	}, [kiosk])

	const handleDeleteActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			activities: kiosk.activities.filter((activity) => activity !== v._id)
		})
	}, [kiosk])

	const handleAddDisabledActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			disabledActivities: [...kiosk.disabledActivities, v._id]
		})
	}, [kiosk])

	const handleDeleteDisabledActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			disabledActivities: kiosk.disabledActivities.filter((activity) => activity !== v._id)
		})
	}, [kiosk])

	const handleReaderIdChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			readerId: v === 'null-option' ? undefined : v
		})
	}, [kiosk])

	const handleCancel = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleAdd = useCallback((): void => {
		if (!formIsValid) return
		postKiosk(kiosk)
	}, [postKiosk, kiosk, formIsValid])

	return (
		<>
			<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
				<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
					<span className="font-medium text-blue-700">{'Ny Kiosk'}</span>
				</div>
				<div className="flex flex-wrap">
					{/* 1. Navn */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="name"
								placeholder="Navn"
								minSize={10}
								required={true}
								validations={[{
									validate: (v: string) => !kiosks.some((k) => k.name.trim() === v.trim()),
									message: 'Navn er allerede i brug'
								}]}
								onChange={handleNameChange}
								maxLength={50}
								onValidationChange={handleValidationChange}
								editable={true}
								initialText=""
							/>
						</div>
					</div>

					{/* 2. Kiosk Tag */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Kiosk #'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="tag"
								placeholder="Tag (Automatisk)"
								minSize={15}
								onChange={handleKioskTagChange}
								minLength={5}
								maxLength={5}
								validations={[{
									validate: (v: string) => v === '' || !kiosks.some((k) => k.kioskTag.trim() === v.trim()),
									message: 'Kiosk # er allerede i brug'
								}]}
								type="number"
								onValidationChange={handleValidationChange}
								editable={true}
								initialText=""
							/>
						</div>
					</div>

					{/* 3. Password */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Adgangskode'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="password"
								placeholder="Adgangskode"
								minSize={10}
								required={true}
								onChange={handlePasswordChange}
								minLength={4}
								maxLength={100}
								onValidationChange={handleValidationChange}
								editable={true}
								initialText=""
							/>
						</div>
					</div>

					{/* 4. Kortlæser */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Tilknyttet Kortlæser'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableDropdown
								options={
									readers.filter((reader) =>
										// Include reader if NOT assigned to any kiosk
										!kiosks.some((kiosk) => kiosk.readerId?._id === reader._id)
									).map((reader) => ({
										value: reader._id,
										label: reader.readerTag
									}))
								}
								initialValue={kiosk.readerId ?? 'null-option'}
								onChange={handleReaderIdChange}
								fieldName="readerId"
								placeholder="Vælg Kortlæser"
								allowNullOption={true}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>

					{/* 5. Fremhævede Aktiviteter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Fremhævede Aktiviteter'}</div>
						<div className="flex flex-col items-center justify-center">
							{kiosk.activities.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={activities.filter((activity) => kiosk.activities.includes(activity._id))}
								editable={true}
								onDeleteItem={handleDeleteActivity}
								onShowItems={() => { setShowActivities(true) }}
							/>
						</div>
					</div>

					{/* 6. Deaktiverede Aktiviteter */}
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Deaktiverede Aktiviteter'}</div>
						<div className="flex flex-col items-center justify-center">
							{kiosk.disabledActivities.length === 0 && (
								<div className="text-gray-500 text-sm">{'Ingen'}</div>
							)}
							<ItemsDisplay
								items={activities.filter((activity) => kiosk.disabledActivities.includes(activity._id))}
								editable={true}
								onDeleteItem={handleDeleteDisabledActivity}
								onShowItems={() => { setShowDisabledActivities(true) }}
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

			{showActivities && (
				<SelectionWindow
					title={`Tilføj aktiviteter til ${kiosk.name === '' ? 'Ny Kiosk' : kiosk.name}`}
					items={activities}
					selectedItems={activities.filter((activity) => kiosk.activities.includes(activity._id))}
					onAddItem={handleAddActivity}
					onDeleteItem={handleDeleteActivity}
					onClose={() => { setShowActivities(false) }}
				/>
			)}

			{showDisabledActivities && (
				<SelectionWindow
					title={`Tilføj deaktiverede aktiviteter til ${kiosk.name === '' ? 'Ny Kiosk' : kiosk.name}`}
					items={activities}
					selectedItems={activities.filter((activity) => kiosk.disabledActivities.includes(activity._id))}
					onAddItem={handleAddDisabledActivity}
					onDeleteItem={handleDeleteDisabledActivity}
					onClose={() => { setShowDisabledActivities(false) }}
				/>
			)}
		</>
	)
}

export default AddKiosk
