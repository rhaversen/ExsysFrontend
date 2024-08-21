import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType, type ActivityType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const Activity = ({
	activity,
	rooms,
	onActivityPatched,
	onActivityDeleted
}: {
	activity: ActivityType
	rooms: RoomType[]
	onActivityPatched: (activity: ActivityType) => void
	onActivityDeleted: (id: ActivityType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newActivity, setNewActivity] = useState<ActivityType>(activity)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)

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

	const patchActivity = useCallback((activity: ActivityType, activityPatch: Omit<ActivityType, '_id'>): void => {
		axios.patch(API_URL + `/v1/activitys/${activity._id}`, activityPatch, { withCredentials: true }).then((response) => {
			onActivityPatched(response.data as ActivityType)
		}).catch((error) => {
			addError(error)
			setNewActivity(activity)
		})
	}, [API_URL, onActivityPatched, addError])

	const deleteActivity = useCallback((activity: ActivityType, confirm: boolean): void => {
		axios.delete(API_URL + `/v1/activitys/${activity._id}`, {
			data: { confirm }, withCredentials: true
		}).then(() => {
			onActivityDeleted(activity._id)
		}).catch((error) => {
			addError(error)
			setNewActivity(activity)
		})
	}, [API_URL, onActivityDeleted, addError])

	const handleNameChange = useCallback((v: string): void => {
		setNewActivity({
			...newActivity,
			name: v
		})
	}, [newActivity])

	const handleRoomIdChange = useCallback((v: string): void => {
		// convert string to the object
		const room = rooms.find((room) => room._id === v)
		if (room === undefined) {
			return
		}
		setNewActivity({
			...newActivity,
			roomId: room
		})
	}, [newActivity, rooms])

	const handleUndoEdit = useCallback((): void => {
		setNewActivity(activity)
		setIsEditing(false)
	}, [activity])

	const handleCompleteEdit = useCallback((): void => {
		patchActivity(activity, newActivity)
		setIsEditing(false)
	}, [patchActivity, activity, newActivity])

	const handleDeleteActivity = useCallback((confirm: boolean): void => {
		deleteActivity(activity, confirm)
	}, [deleteActivity, activity])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName='name'
							initialText={activity.name}
							placeholder='Navn'
							italic={false}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 20,
								message: 'Navn må maks være 20 tegn'
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
					<div className="font-bold p-2 text-gray-800">
						<select
							className="border border-gray-300 rounded-md p-2"
							value={newActivity.roomId._id}
							onChange={(e) => { handleRoomIdChange(e.target.value) }}
							title="Select Room"
						>
							{rooms.map((room) => (
								<option key={room._id} value={room._id}>
									{room.name}
								</option>
							))}
						</select>
					</div>
				</div>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
				/>
			</div>
			{showDeleteConfirmation &&
				<ConfirmDeletion
					itemName={activity.name}
					onClose={() => {
						setShowDeleteConfirmation(false)
					}}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						handleDeleteActivity(confirm)
					}}
				/>
			}
		</div>
	)
}

export default Activity
