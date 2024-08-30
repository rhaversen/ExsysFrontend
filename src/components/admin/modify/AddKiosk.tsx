import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostKioskType, type ActivityType, type KioskType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Activities from './kioskActivities/Activities'
import ActivitiesWindow from './ActivitiesWindow'
import EditableDropdown from './ui/EditableDropdown'

const Kiosk = ({
	activities,
	readers,
	onKioskPosted,
	onClose
}: {
	activities: ActivityType[]
	readers: ReaderType[]
	onKioskPosted: (kiosk: KioskType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [kiosk, setKiosk] = useState<PostKioskType>({
		readerId: '',
		name: '',
		kioskTag: undefined,
		password: '',
		activities: []
	})
	const [showActivities, setShowActivities] = useState(false)
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
			onKioskPosted(response.data as KioskType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onKioskPosted, onClose, addError])

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

	const handleAddActivity = useCallback((v: ActivityType['_id']): void => {
		setKiosk({
			...kiosk,
			activities: [...kiosk.activities, v]
		})
	}, [kiosk])

	const handleDeleteActivity = useCallback((v: ActivityType['_id']): void => {
		setKiosk({
			...kiosk,
			activities: kiosk.activities.filter((activity) => activity !== v)
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
						<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Kiosk'}</p>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName='name'
								placeholder='Navn'
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={(v: string) => {
									handleNameChange(v)
								}}
								validations={[{
									validate: (v: string) => v.length <= 50,
									message: 'Navn kan kun have 50 tegn'
								}]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName='password'
								placeholder='Password'
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={(v: string) => {
									handlePasswordChange(v)
								}}
								validations={[{
									validate: (v: string) => v.length >= 4,
									message: 'Password skal mindst have 4 tegn'
								},
								{
									validate: (v: string) => v.length <= 100,
									message: 'Password kan kun have 100 tegn'
								}]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName='tag'
								placeholder='Tag (Automatisk)'
								italic={false}
								minSize={15}
								required={false}
								editable={true}
								onChange={(v: string) => {
									handleKioskTagChange(v)
								}}
								validations={[]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						<p className="italic text-gray-500">{'Kortlæser'}</p>
						<EditableDropdown
							options={readers.map((reader) => ({ value: reader._id, label: reader.readerTag }))}
							selectedValue={kiosk.readerId ?? 'null-option'}
							onChange={handleReaderIdChange}
							editable={true}
							fieldName='readerId'
							placeholder='Vælg Kortlæser'
							allowNullOption={true}
						/>
						{kiosk.activities.length > 0 &&
							<p className="italic text-gray-500 pt-2">{'Aktiviteter:'}</p>
						}
						{kiosk.activities.length === 0 &&
							<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter:'}</p>
						}
						<Activities
							selectedActivities={activities.filter((activity) => kiosk.activities.includes(activity._id))}
							editable={true}
							onDeleteActivity={(v: ActivityType) => {
								handleDeleteActivity(v._id)
							}}
							showActivities={() => {
								setShowActivities(true)
							}}
						/>
						{showActivities &&
							<ActivitiesWindow
								kioskName={kiosk.name}
								activities={activities}
								kioskActivities={activities.filter((activity) => kiosk.activities.includes(activity._id))}
								onAddActivity={(v: ActivityType) => {
									handleAddActivity(v._id)
								}}
								onDeleteActivity={(v: ActivityType) => {
									handleDeleteActivity(v._id)
								}}
								onClose={() => {
									setShowActivities(false)
								}}
							/>
						}
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

export default Kiosk
