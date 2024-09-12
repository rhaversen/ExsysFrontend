import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostRoomType, type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const Room = ({
	rooms,
	onRoomPosted,
	onClose
}: {
	rooms: RoomType[]
	onRoomPosted: (room: RoomType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [room, setRoom] = useState<PostRoomType>({
		name: '',
		description: ''
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

	const postRoom = useCallback((room: PostRoomType): void => {
		axios.post(API_URL + '/v1/rooms', room, { withCredentials: true }).then((response) => {
			onRoomPosted(response.data as RoomType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onRoomPosted, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setRoom({
			...room,
			name: v
		})
	}, [room])

	const handleDescriptionChange = useCallback((v: string): void => {
		setRoom({
			...room,
			description: v
		})
	}, [room])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postRoom(room)
	}, [postRoom, room])

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
								fieldName="name"
								placeholder="Navn"
								minSize={10}
								required={true}
								onChange={handleNameChange}
								maxLength={50}
								validations={[{
									validate: (v: string) => !rooms.some((room) => room.name === v),
									message: 'Navn er allerede i brug'
								}]}
								onValidationChange={handleValidationChange}
							/>
						</div>
						<div className="text-gray-800">
							<EditableField
								fieldName="description"
								placeholder="Beskrivelse"
								italic={true}
								minSize={10}
								required={true}
								onChange={handleDescriptionChange}
								maxLength={50}
								onValidationChange={handleValidationChange}
							/>
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

export default Room
