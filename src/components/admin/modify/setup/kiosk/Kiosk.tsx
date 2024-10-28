import Activities from '@/components/admin/modify/setup/kiosk/kioskActivities/Activities'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType, type PatchKioskType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableDropdown from '../../ui/EditableDropdown'
import Timestamps from '../../ui/Timestamps'
import ActivitiesWindow from './ActivitiesWindow'

const Kiosk = ({
	kiosks,
	kiosk,
	activities,
	readers
}: {
	kiosks: KioskType[]
	kiosk: KioskType
	activities: ActivityType[]
	readers: ReaderType[]
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
			const reader = readers.find((reader) => reader._id === prev.readerId?._id)
			return {
				...prev,
				readerId: reader ?? null
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
		axios.patch(API_URL + `/v1/kiosks/${kiosk._id}`, kioskPatch, { withCredentials: true }).catch((error) => {
			addError(error)
			setNewKiosk(kiosk)
		})
	}, [API_URL, addError, kiosk])

	const deleteKiosk = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/kiosks/${kiosk._id}`, {
			data: { confirm },
			withCredentials: true
		}).catch((error) => {
			addError(error)
			setNewKiosk(kiosk)
		})
	}, [API_URL, addError, kiosk])

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
			readerId: v === 'null-option' ? null : readers.find((reader) => reader._id === v) ?? null
		})
	}, [newKiosk, readers])

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
		setNewPassword('')
		setIsEditing(false)
	}, [kiosk])

	const handleCompleteEdit = useCallback((): void => {
		patchKiosk({
			...newKiosk,
			activities: newKiosk.activities.map((activity) => activity._id),
			readerId: newKiosk.readerId === null ? null : newKiosk.readerId._id,
			password: newPassword === '' ? undefined : newPassword
		})
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
							fieldName="name"
							initialText={kiosk.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={50}
							editable={isEditing}
							onChange={handleNameChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<p className="italic text-gray-500">{'Kiosk Tag - Brugernavn til kiosk login'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="kioskTag"
							initialText={kiosk.kioskTag}
							placeholder="Kiosk tag"
							minSize={10}
							required={true}
							editable={isEditing}
							onChange={handleKioskTagChange}
							minLength={5}
							maxLength={5}
							type="number"
							validations={[{
								validate: (v: string) => !kiosks.some((k) => k.kioskTag === v && k._id !== newKiosk._id),
								message: 'Kiosk tag er allerede i brug'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
					{isEditing &&
						<div className="text-center">
							<p className="italic text-gray-500">{'Nyt Kodeord'}</p>
							<div className="font-bold pb-2 text-gray-800">
								<EditableField
									fieldName="password"
									initialText={newPassword}
									placeholder="Nyt Kodeord"
									minSize={10}
									minLength={4}
									maxLength={100}
									editable={isEditing}
									onChange={handlePasswordChange}
									onValidationChange={handleValidationChange}
								/>
							</div>
						</div>
					}
					<p className="italic text-gray-500">{'Kortlæser Tag'}</p>
					<EditableDropdown
						options={
							readers.filter((reader) =>
								// Include reader if NOT assigned to any kiosk
								!kiosks.some((kiosk) => kiosk.readerId?._id === reader._id) ||
								// OR if the reader is the one currently assigned to newKiosk
								reader._id === newKiosk.readerId?._id
							).map((reader) => ({
								value: reader._id,
								label: reader.readerTag
							}))
						}
						initialValue={newKiosk.readerId?._id ?? 'null-option'}
						onChange={handleReaderIdChange}
						editable={isEditing}
						fieldName="readerId"
						allowNullOption={true}
						onValidationChange={handleValidationChange}
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
						onDeleteActivity={handleDeleteActivity}
						showActivities={() => {
							setShowActivities(true)
						}}
					/>
				</div>
				<Timestamps
					createdAt={kiosk.createdAt}
					updatedAt={kiosk.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
					canClose={!showActivities}
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
						onAddActivity={handleAddActivity}
						onDeleteActivity={handleDeleteActivity}
						onClose={() => {
							setShowActivities(false)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Kiosk
