import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType, type PostKioskType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import EditableDropdown from '../../ui/EditableDropdown'
import SelectionWindow from '../../ui/SelectionWindow'
import ItemsDisplay from '@/components/admin/modify/ui/ItemsDisplay'

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

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postKiosk(kiosk)
	}, [postKiosk, kiosk])

	return (
		<CloseableModal onClose={onClose} canClose={!showActivities && !showDisabledActivities}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Kiosk'}</p>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => !kiosks.some((k) => k.name === v),
								message: 'Navn er allerede i brug'
							}]}
							onChange={handleNameChange}
							maxLength={50}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="password"
							placeholder="Password"
							minSize={10}
							required={true}
							onChange={handlePasswordChange}
							minLength={4}
							maxLength={100}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="tag"
							placeholder="Tag (Automatisk)"
							minSize={15}
							onChange={handleKioskTagChange}
							minLength={5}
							maxLength={5}
							validations={[{
								validate: (v: string) => v === '' || !kiosks.some((k) => k.kioskTag === v),
								message: 'Kortlæser # er allerede i brug'
							}]}
							type="number"
							onValidationChange={handleValidationChange}
						/>
					</div>
					<p className="italic text-gray-500">{'Kortlæser'}</p>
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
					{kiosk.activities.length > 0 &&
						<p className="italic text-gray-500 pt-2">{'Aktiviteter:'}</p>
					}
					{kiosk.activities.length === 0 &&
						<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter:'}</p>
					}
					<ItemsDisplay
						items={activities.filter((activity) => kiosk.activities.includes(activity._id))}
						onDeleteItem={handleDeleteActivity}
						onShowItems={() => {
							setShowActivities(true)
						}}
					/>

					{kiosk.disabledActivities.length > 0 &&
						<p className="italic text-gray-500 pt-2">{'Deaktiverede Aktiviteter:'}</p>
					}
					{kiosk.disabledActivities.length === 0 &&
						<p className="italic text-gray-500 pt-2">{'Tilføj Deaktiverede Aktiviteter:'}</p>
					}
					<ItemsDisplay
						items={activities.filter((activity) => kiosk.disabledActivities.includes(activity._id))}
						onDeleteItem={handleDeleteDisabledActivity}
						onShowItems={() => {
							setShowDisabledActivities(true)
						}}
					/>

					{showActivities &&
						<SelectionWindow
							title={`Tilføj aktiviteter til ${kiosk.name === '' ? 'Ny Kiosk' : kiosk.name}`}
							items={activities}
							selectedItems={activities.filter((activity) => kiosk.activities.includes(activity._id))}
							onAddItem={handleAddActivity}
							onDeleteItem={handleDeleteActivity}
							onClose={() => {
								setShowActivities(false)
							}}
						/>
					}

					{showDisabledActivities &&
						<SelectionWindow
							title={`Tilføj deaktiverede aktiviteter til ${kiosk.name === '' ? 'Ny Kiosk' : kiosk.name}`}
							items={activities}
							selectedItems={activities.filter((activity) => kiosk.disabledActivities.includes(activity._id))}
							onAddItem={handleAddDisabledActivity}
							onDeleteItem={handleDeleteDisabledActivity}
							onClose={() => {
								setShowDisabledActivities(false)
							}}
						/>
					}
				</div>
			</div>
			<CompletePostControls
				canClose={!showActivities && !showDisabledActivities}
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default AddKiosk
