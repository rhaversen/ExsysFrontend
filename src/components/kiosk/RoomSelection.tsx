import { type RoomType } from '@/types/backendDataTypes'
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import TimeoutWarningWindow from './TimeoutWarningWindow'
import { useConfig } from '@/contexts/ConfigProvider'

export default function RoomSelection ({
	rooms,
	activityRooms,
	onRoomSelect,
	onReset,
	selectedActivity
}: {
	rooms: RoomType[]
	activityRooms: RoomType[]
	onRoomSelect: (room: RoomType) => void
	onReset: () => void
	selectedActivity: string
}): ReactElement {
	const { config } = useConfig()
	const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
	const timeoutMs = config?.configs.kioskInactivityTimeoutMs ?? 1000 * 60
	const resetTimerRef = useRef<NodeJS.Timeout>(undefined)

	const resetTimer = useCallback(() => {
		clearTimeout(resetTimerRef.current)
		resetTimerRef.current = setTimeout(() => {
			setShowTimeoutWarning(true)
		}, timeoutMs)
	}, [timeoutMs])

	useEffect(() => {
		resetTimer()

		return () => {
			clearTimeout(resetTimerRef.current)
		}
	}, [resetTimer])

	useEffect(() => {
		const events = ['touchstart', 'touchmove']
		const handleResetTimer = (): void => {
			if (!showTimeoutWarning) {
				resetTimer()
			}
		}

		events.forEach(event => {
			document.addEventListener(event, handleResetTimer)
		})

		return () => {
			events.forEach(event => {
				document.removeEventListener(event, handleResetTimer)
			})
		}
	}, [resetTimer, showTimeoutWarning])

	const otherRooms = rooms.filter(room => !activityRooms.some(ar => ar._id === room._id))

	return (
		<main className="flex flex-col h-full">
			<div className="flex-grow flex items-center">
				<div className="w-full flex flex-col items-center gap-4">
					<header className="mb-8 flex flex-col gap-5">
						<h1 className="text-center text-gray-800 text-5xl font-bold">{'Vælg dit spisested'}</h1>
						<p className="text-center text-gray-600 text-xl">{'Vælg lokalet hvor bestillingen skal leveres til'}</p>
					</header>
					{activityRooms.length > 0 && (
						<div className="flex flex-wrap justify-center">
							{activityRooms.map((room) => (
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
					)}
					{otherRooms.length > 0 && (
						<div className="w-full max-w-4xl mt-8">
							<div className="rounded grid grid-cols-2 gap-4">
								{otherRooms.map((room, index) => (
									<div key={room._id}>
										<button
											onClick={() => { onRoomSelect(room) }}
											className="w-full text-left py-3 px-4 bg-white hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
										>
											<div className="grid grid-cols-2 gap-4">
												<span className="font-semibold text-lg text-gray-900">{room.name}</span>
												{(room.description.length > 0) && (
													<span className="text-gray-700">
														{room.description}
													</span>
												)}
											</div>
										</button>
										{index < otherRooms.length - 1 && (
											<div className="border-b border-gray-200" />
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Timeout Warning Modal */}
			{showTimeoutWarning && (
				<TimeoutWarningWindow
					onTimeout={() => { onReset() }}
					onClose={() => {
						setShowTimeoutWarning(false)
						resetTimer()
					}}
				/>
			)}
		</main>
	)
}
