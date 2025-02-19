import { type RoomType } from '@/types/backendDataTypes'
import { KioskImages } from '@/lib/images'
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import TimeoutWarningWindow from './TimeoutWarningWindow'
import AsyncImage from '@/components/ui/AsyncImage'
import { useConfig } from '@/contexts/ConfigProvider'

export default function RoomSelection ({
	rooms,
	onRoomSelect,
	onBack,
	onReset,
	selectedActivity
}: {
	rooms: RoomType[]
	onRoomSelect: (room: RoomType) => void
	onBack: () => void
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
