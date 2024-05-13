import { type RoomType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import axios from 'axios'

const Room = ({
	onRoomPosted,
	onClose
}: {
	onRoomPosted: (room: RoomType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [room, setRoom] = useState<Omit<RoomType, '_id'>>({
		name: '',
		description: ''
	})

	const postRoom = (room: Omit<RoomType, '_id'>): void => {
		axios.post(API_URL + '/v1/rooms', room).then((response) => {
			onRoomPosted(response.data as RoomType)
			onClose()
		}).catch((error) => {
			console.error('Error updating room:', error)
		})
	}

	const handleNameChange = (v: string): void => {
		setRoom({
			...room,
			name: v
		})
	}

	const handleDescriptionChange = (v: string): void => {
		setRoom({
			...room,
			description: v
		})
	}

	const handleCancelPost = (): void => {
		onClose()
	}

	const handleCompletePost = (): void => {
		postRoom(room)
	}

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
						<div className="font-bold p-2 text-black">
							<EditableField
								text={room.name}
								italic={false}
								editable={true}
								edited={false}
								onChange={(v: string) => {
									handleNameChange(v)
								}}
							/>
						</div>
						<div className="text-gray-700">
							<EditableField
								text={room.description}
								italic={true}
								editable={true}
								edited={false}
								onChange={(v: string) => {
									handleDescriptionChange(v)
								}}
							/>
						</div>
					</div>
				</div>
				<div className="flex flex-row justify-center gap-4">
					<button
						type="button"
						className="bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4"
						onClick={handleCancelPost}
					>
						{'Annuller'}
					</button>
					<button
						type="button"
						className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
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
