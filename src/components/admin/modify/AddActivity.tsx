import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType, type ActivityType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const AddActivity = ({
	rooms,
	onActivityPosted,
	onClose
}: {
	rooms: RoomType[]
	onActivityPosted: (activity: ActivityType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [activity, setActivity] = useState<Omit<ActivityType, '_id'>>({
		name: '',
		roomId: {
			_id: '',
			name: '',
			description: ''
		}
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

	const postActivity = useCallback((activity: Omit<ActivityType, '_id'>): void => {
		axios.post(API_URL + '/v1/activities', activity, { withCredentials: true }).then((response) => {
			onActivityPosted(response.data as ActivityType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onActivityPosted, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setActivity({
			...activity,
			name: v
		})
	}, [activity])

	const handleRoomIdChange = useCallback((v: string): void => {
		// convert string to the object
		const room = rooms.find((room) => room._id === v)
		if (room === undefined) {
			return
		}
		setActivity({
			...activity,
			roomId: room
		})
	}, [activity, rooms])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postActivity(activity)
	}, [postActivity, activity])

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
						<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Rum'}</p>
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
									validate: (v: string) => v.length <= 20,
									message: 'Navn må maks være 20 tegn'
								}]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<select
								className="border border-gray-300 rounded-md p-2"
								value={activity.roomId._id}
								onChange={(e) => { handleRoomIdChange(e.target.value) }}
								title="Vælg rum"
							>
								<option value="">Vælg rum</option>
								{/* Map over the rooms and render an option for each room */}
								{rooms.map((room) => (
									<option key={room._id} value={room._id}>
										{room.name}
									</option>
								))}
							</select>
						</div>
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

export default AddActivity