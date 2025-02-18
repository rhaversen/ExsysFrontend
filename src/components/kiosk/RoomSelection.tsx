import { type RoomType } from '@/types/backendDataTypes'
import { KioskImages } from '@/lib/images'
import React, { type ReactElement } from 'react'
import AsyncImage from '@/components/ui/AsyncImage'

interface Props {
	rooms: RoomType[]
	onRoomSelect: (room: RoomType) => void
	onBack: () => void
	selectedActivity: string
}

export default function RoomSelection ({ rooms, onRoomSelect, onBack, selectedActivity }: Props): ReactElement {
	return (
		<main className="flex flex-col h-full">
			<div className="w-full px-8 pt-4">
				<button
					onClick={onBack}
					className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
				>
					<AsyncImage
						src={KioskImages.back.src}
						alt={KioskImages.back.alt}
						className="w-6 h-6 mr-2 rotate-180"
						width={24}
						height={24}
						quality={75}
						priority={false}
						draggable={false}
					/>
					<span>{'Tilbage'}</span>
				</button>
			</div>
			<div className="flex-grow flex items-center">
				<div className="w-full flex flex-col items-center gap-8">
					<header className="w-full">
						<h1 className="p-0 text-center text-gray-800 text-5xl font-bold">
							{selectedActivity}
						</h1>
						<p className="m-4 p-0 text-center text-gray-600 text-xl">
							{'Vælg dit lokale'}
						</p>
					</header>
					<div className="flex flex-wrap justify-center">
						{rooms.map((room) => (
							<button
								key={room._id}
								onClick={() => { onRoomSelect(room) }}
								className="p-10 m-5 bg-white rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
							>
								<h2 className="text-3xl font-bold mb-2 text-gray-800">
									{room.name}
								</h2>
								{room.description.length > 0 && (
									<p className="text-gray-600 text-xl">
										{room.description}
									</p>
								)}
							</button>
						))}
					</div>
				</div>
			</div>
		</main>
	)
}
