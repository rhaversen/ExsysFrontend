import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type PostRoomType, type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../../ui/CompletePostControls'

const Room = ({
	rooms,
	onClose
}: {
	rooms: RoomType[]
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
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError])

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
		<CloseableModal onClose={onClose}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Nyt Spisested'}</p>
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
			<CompletePostControls
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default Room
