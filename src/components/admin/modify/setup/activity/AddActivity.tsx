import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostActivityType, type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'
import EditableDropdown from '../../ui/EditableDropdown'

const AddActivity = ({
	rooms,
	onClose
}: {
	rooms: RoomType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [activity, setActivity] = useState<PostActivityType>({
		name: '',
		roomId: ''
	})
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

	const postActivity = useCallback((activity: PostActivityType): void => {
		axios.post(API_URL + '/v1/activities', activity, { withCredentials: true }).then((response) => {
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setActivity({
			...activity,
			name: v
		})
	}, [activity])

	const handleRoomIdChange = useCallback((v: string): void => {
		// convert string to the object
		const room = rooms.find((room) => room._id === v)
		if (room === undefined && v !== 'null-option') {
			return
		}
		setActivity({
			...activity,
			roomId: ((room?._id) != null) ? room._id : null
		})
	}, [activity, rooms])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postActivity(activity)
	}, [postActivity, activity])

	return (
		<CloseableModal onClose={onClose}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Aktivitet'}</p>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							minSize={10}
							required={true}
							onChange={handleNameChange}
							maxLength={50}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<EditableDropdown
						options={rooms.map((room) => ({
							value: room._id,
							label: room.name
						}))}
						initialValue={activity.roomId ?? 'null-option'}
						onChange={handleRoomIdChange}
						placeholder="Vælg Spisested"
						allowNullOption={true}
						fieldName="roomId"
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

export default AddActivity
