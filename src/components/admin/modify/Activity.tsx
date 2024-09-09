import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type PatchActivityType, type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import EditableDropdown from './ui/EditableDropdown'
import Timestamps from './ui/Timestamps'

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

	// update newActivity when room changes
	useEffect(() => {
		setNewActivity((prev) => {
			const room = rooms.find((room) => room._id === prev.roomId?._id)
			return {
				...prev,
				roomId: room ?? null
			}
		})
	}, [rooms])

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

	const patchActivity = useCallback((activityPatch: PatchActivityType): void => {
		axios.patch(API_URL + `/v1/activities/${activity._id}`, activityPatch, { withCredentials: true }).then((response) => {
			onActivityPatched(response.data as ActivityType)
		}).catch((error) => {
			addError(error)
			setNewActivity(activity)
		})
	}, [API_URL, onActivityPatched, addError, activity])

	const deleteActivity = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/activities/${activity._id}`, {
			data: { confirm },
			withCredentials: true
		}).then(() => {
			onActivityDeleted(activity._id)
		}).catch((error) => {
			addError(error)
			setNewActivity(activity)
		})
	}, [API_URL, onActivityDeleted, addError, activity])

	const handleNameChange = useCallback((v: string): void => {
		setNewActivity({
			...newActivity,
			name: v
		})
	}, [newActivity])

	const handleRoomIdChange = useCallback((v: string): void => {
		// convert string to the object
		const room = rooms.find((room) => room._id === v)
		if (room === undefined && v !== 'null-option') {
			return
		}
		setNewActivity({
			...newActivity,
			roomId: ((room?._id) !== undefined) ? room : null
		})
	}, [newActivity, rooms])

	const handleUndoEdit = useCallback((): void => {
		setNewActivity(activity)
		setIsEditing(false)
	}, [activity])

	const handleCompleteEdit = useCallback((): void => {
		patchActivity({
			...newActivity,
			roomId: newActivity.roomId === null ? null : newActivity.roomId._id
		})
		setIsEditing(false)
	}, [patchActivity, newActivity])

	const handleDeleteActivity = useCallback((confirm: boolean): void => {
		deleteActivity(confirm)
	}, [deleteActivity])

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Navn'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={activity.name}
							placeholder="Navn"
							italic={false}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 50,
								message: 'Navn kan kun have 50 tegn'
							}]}
							editable={isEditing}
							onChange={handleNameChange}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<p className="italic text-gray-500">{'Spisested'}</p>
					<EditableDropdown
						options={rooms.map((room) => ({
							value: room._id,
							label: room.name
						}))}
						initialValue={newActivity.roomId?._id ?? 'null-option'}
						onChange={handleRoomIdChange}
						editable={isEditing}
						fieldName="roomId"
						allowNullOption={true}
						onValidationChange={handleValidationChange}
					/>
				</div>
				<Timestamps
					createdAt={activity.createdAt}
					updatedAt={activity.updatedAt}
				/>
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
