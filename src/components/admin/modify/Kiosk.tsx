import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Activities from './kioskActivities/Activities'
import ActivitiesWindow from './ActivitiesWindow'

const Kiosk = ({
	kiosk,
	activities,
	onKioskPatched,
	onKioskDeleted
}: {
	kiosk: KioskType
	activities: ActivityType[]
	onKioskPatched: (kiosk: KioskType) => void
	onKioskDeleted: (id: KioskType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newKiosk, setNewKiosk] = useState<KioskType>(kiosk)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showActivities, setShowActivities] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

	useEffect(() => {
		setNewKiosk(n => {
			// Filter out activities that are not in the activity array
			const filteredActivities = n.activities.filter((activity) =>
				activities?.map((act) => act._id).includes(activity._id)
			)

			// Update the remaining activities with new data from the activity array
			const UpdatedActivities = filteredActivities.map((activity) => {
				const newActivity = activities.find((act) => act._id === activity._id)
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

	const patchKiosk = useCallback((kiosk: KioskType, kioskPatch: Omit<KioskType, '_id'>): void => {
		axios.patch(API_URL + `/v1/kiosks/${kiosk._id}`, kioskPatch, { withCredentials: true }).then((response) => {
			onKioskPatched(response.data as KioskType)
		}).catch((error) => {
			addError(error)
			setNewKiosk(kiosk)
		})
	}, [API_URL, onKioskPatched, addError])

	const deleteKiosk = useCallback((kiosk: KioskType, confirm: boolean): void => {
		axios.delete(API_URL + `/v1/kiosks/${kiosk._id}`, {
			data: { confirm }, withCredentials: true
		}).then(() => {
			onKioskDeleted(kiosk._id)
		}).catch((error) => {
			addError(error)
			setNewKiosk(kiosk)
		})
	}, [API_URL, onKioskDeleted, addError])

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
		patchKiosk(kiosk, newKiosk)
		setIsEditing(false)
	}, [patchKiosk, kiosk, newKiosk])

	const handleDeleteKiosk = useCallback((confirm: boolean): void => {
		deleteKiosk(kiosk, confirm)
	}, [deleteKiosk, kiosk])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Navn'}</p>
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
					<p className="italic text-gray-500">{'Tag'}</p>
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
								validate: (v: string) => v.match('^[0-9]+$') !== null,
								message: 'Kiosk tag må kun være tal'
							}]}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
						/>
					</div>
				</div>
				{kiosk.activities.length > 0 &&
					<p className="italic text-gray-500 pt-2">{'Aktiviteter:'}</p>
				}
				{kiosk.activities.length === 0 && !isEditing &&
					<p className="italic text-gray-500 pt-2">{'Ingen Aktiviteter'}</p>
				}
				{kiosk.activities.length === 0 && isEditing &&
					<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter:'}</p>
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
