import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PatchKioskType, type ActivityType, type KioskType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Activities from './kioskActivities/Activities'
import ActivitiesWindow from './ActivitiesWindow'
import EditableDropdown from './ui/EditableDropdown'
import Timestamps from './ui/Timestamps'

const Kiosk = ({
	kiosk,
	activities,
	readers,
	onKioskPatched,
	onKioskDeleted
}: {
	kiosk: KioskType
	activities: ActivityType[]
	readers: ReaderType[]
	onKioskPatched: (kiosk: KioskType) => void
	onKioskDeleted: (id: KioskType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newKiosk, setNewKiosk] = useState<KioskType>(kiosk)
	const [newPassword, setNewPassword] = useState<string>('')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showActivities, setShowActivities] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

	// update newKiosk when readers change
	useEffect(() => {
		setNewKiosk((prev) => {
			const reader = readers.find((reader) => reader._id === prev.readerId)
			return {
				...prev,
				readerId: reader?._id ?? null
			}
		})
	}, [readers])

	// Extract the findActivity function outside of the useEffect hook
	const findActivity = (activities: ActivityType[], activityId: string): ActivityType | undefined => {
		return activities.find((act) => act._id === activityId)
	}

	// Update newKiosk when activities change
	useEffect(() => {
		setNewKiosk(n => {
			// Filter out activities that are not in the activity array
			const activityIds = activities?.map((act) => act._id)
			const filteredActivities = n.activities.filter((activity) =>
				activityIds?.includes(activity._id)
			)

			// Update the remaining activities with new data from the activity array
			const UpdatedActivities = filteredActivities.map((activity) => {
				const newActivity = findActivity(activities, activity._id)
				return newActivity ?? activity
			})

			return {
				...n,
				activities: UpdatedActivities
			}
		})
	}, [activities])

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

	const patchKiosk = useCallback((kioskPatch: PatchKioskType): void => {
		axios.patch(API_URL + `/v1/kiosks/${kiosk._id}`, kioskPatch, { withCredentials: true }).then((response) => {
			onKioskPatched(response.data as KioskType)
		}).catch((error) => {
			addError(error)
			setNewKiosk(kiosk)
		})
	}, [API_URL, onKioskPatched, addError, kiosk])

	const deleteKiosk = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/kiosks/${kiosk._id}`, {
			data: { confirm }, withCredentials: true
		}).then(() => {
			onKioskDeleted(kiosk._id)
		}).catch((error) => {
			addError(error)
			setNewKiosk(kiosk)
		})
	}, [API_URL, onKioskDeleted, addError, kiosk])

	const handleNameChange = useCallback((v: string): void => {
		setNewKiosk({
			...newKiosk,
			name: v
		})
	}, [newKiosk])

	const handleKioskTagChange = useCallback((v: string): void => {
		setNewKiosk({
			...newKiosk,
			kioskTag: v
		})
	}, [newKiosk])

	const handlePasswordChange = useCallback((v: string): void => {
		setNewPassword(v)
	}, [])

	const handleReaderIdChange = useCallback((v: string): void => {
		setNewKiosk({
			...newKiosk,
			readerId: v === 'null-option' ? null : v
		})
	}, [newKiosk])

	const handleAddActivity = useCallback((v: ActivityType): void => {
		setNewKiosk({
			...newKiosk,
			activities: [...newKiosk.activities, v]
		})
	}, [newKiosk])

	const handleDeleteActivity = useCallback((v: ActivityType): void => {
		setNewKiosk({
			...newKiosk,
			activities: newKiosk.activities.filter((activity) => activity !== v)
		})
	}, [newKiosk])

	const handleUndoEdit = useCallback((): void => {
		setNewKiosk(kiosk)
		setIsEditing(false)
	}, [kiosk])

	const handleCompleteEdit = useCallback((): void => {
		patchKiosk({ ...newKiosk, activities: newKiosk.activities.map((activity) => activity._id), password: newPassword === '' ? undefined : newPassword })
		setNewPassword('')
		setIsEditing(false)
	}, [patchKiosk, newKiosk, newPassword])

	const handleDeleteKiosk = useCallback((confirm: boolean): void => {
		deleteKiosk(confirm)
	}, [deleteKiosk])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Kioskens Navn'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName='name'
							initialText={kiosk.name}
							placeholder='Navn'
							italic={false}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 50,
								message: 'Navn kan kun have 50 tegn'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
						/>
					</div>
					<p className="italic text-gray-500">{'Tag - Brugernavn til kiosk login'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName='kioskTag'
							initialText={kiosk.kioskTag}
							placeholder='Kiosk tag'
							italic={false}
							minSize={10}
							required={true}
							editable={isEditing}
							onChange={(v: string) => {
								handleKioskTagChange(v)
							}}
							validations={[{
								validate: (v: string) => v.length === 5,
								message: 'Kiosk tag skal være præcis 5 tal'
							}, {
								validate: (v: string) => /^\d+$/.exec(v) !== null,
								message: 'Kiosk tag må kun være tal'
							}]}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
						/>
					</div>
					{isEditing &&
						<div className='text-center'>
							<p className="italic text-gray-500">{'Nyt Kodeord'}</p>
							<div className="font-bold pb-2 text-gray-800">
								<EditableField
									fieldName='password'
									initialText={newPassword}
									placeholder='Nyt Kodeord'
									italic={false}
									minSize={10}
									required={false}
									validations={[{
										validate: (v: string) => v.length >= 4 || v.length === 0,
										message: 'Kodeord skal mindst have 4 tegn'
									},
									{
										validate: (v: string) => v.length <= 100,
										message: 'Kodeord kan kun have 100 tegn'
									}]}
									editable={isEditing}
									onChange={(v: string) => {
										handlePasswordChange(v)
									}}
									onValidationChange={(fieldName: string, v: boolean) => {
										handleValidationChange(fieldName, v)
									}}
								/>
							</div>
						</div>
					}
					<p className="italic text-gray-500">{'Kortlæser Tag'}</p>
					<EditableDropdown
						options={readers.map((reader) => ({ value: reader._id, label: reader.readerTag }))}
						selectedValue={newKiosk.readerId ?? 'null-option'}
						onChange={handleReaderIdChange}
						editable={isEditing}
						allowNullOption={true}
					/>
				</div>
				{newKiosk.activities.length > 0 &&
					<p className="italic text-gray-500 pt-2">{'Aktiviteter Tilknyttet Kiosken:'}</p>
				}
				{newKiosk.activities.length === 0 && !isEditing &&
					<p className="italic text-gray-500 pt-2">{'Ingen Aktiviteter Tilknyttet Kiosken'}</p>
				}
				{newKiosk.activities.length === 0 && isEditing &&
					<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter Til Kiosken:'}</p>
				}
				<div className="flex flex-row flex-wrap max-w-52">
					<Activities
						selectedActivities={newKiosk.activities}
						editable={isEditing}
						onDeleteActivity={(v: ActivityType) => {
							handleDeleteActivity(v)
						}}
						showActivities={() => {
							setShowActivities(true)
						}}
					/>
				</div>
				<Timestamps
					createdAt={newKiosk.createdAt}
					updatedAt={newKiosk.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
				/>
				{showDeleteConfirmation &&
					<ConfirmDeletion
						itemName={kiosk.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirm: boolean) => {
							setShowDeleteConfirmation(false)
							handleDeleteKiosk(confirm)
						}}
					/>
				}
				{showActivities &&
					<ActivitiesWindow
						kioskName={newKiosk.name}
						activities={activities}
						kioskActivities={newKiosk.activities}
						onAddActivity={(v: ActivityType) => {
							handleAddActivity(v)
						}}
						onDeleteActivity={(v: ActivityType) => {
							handleDeleteActivity(v)
						}}
						onClose={() => {
							setShowActivities(false)
						}}
					/>
				}
			</div>
		</div >
	)
}

export default Kiosk
