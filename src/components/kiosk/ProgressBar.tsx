import { type ActivityType, type RoomType } from '@/types/backendDataTypes'
import { type ViewState } from '@/types/frontendDataTypes'
import React from 'react'
import { KioskImages } from '@/lib/images'
import AsyncImage from '../ui/AsyncImage'

const ProgressButton = ({
	isActive,
	canClick,
	onClick,
	selectedName,
	label
}: {
	isActive: boolean
	canClick: boolean
	onClick: () => void
	selectedName?: string
	label: string
}): React.ReactElement => (
	<button
		className={`font-bold h-14 rounded-xl flex-1 flex justify-center items-center m-2
                    transition-all duration-300 shadow-[0_4px_0_#CBD5E1,0_2px_4px_rgba(0,0,0,0.1)]
					transform
                    ${isActive
		? 'text-blue-700 bg-white'
		: canClick
			? 'text-gray-800 bg-white'
			: 'text-gray-400 bg-gray-100'
	}
                    ${canClick && !isActive
		? '-translate-y-[4px]'
		: 'shadow-none'}`}

		onClick={onClick}
		disabled={!canClick}
		type='button'
	>
		<div className="text-xl flex flex-col items-center justify-center text-center p-3">
			{selectedName ?? label}
		</div>
	</button>
)

export default function ProgressBar ({
	viewState,
	canClickActivity,
	canClickRoom,
	canClickOrder,
	onProgressClick,
	onReset,
	selectedActivity,
	selectedRoom
}: {
	viewState: ViewState
	canClickActivity: boolean
	canClickRoom: boolean
	canClickOrder: boolean
	onProgressClick: (view: ViewState) => void
	onReset: () => void
	selectedActivity: ActivityType | null
	selectedRoom: RoomType | null
}): React.ReactElement {
	const [resetPressed, setResetPressed] = React.useState(false)

	const getProgress = (viewState: string): number => {
		switch (viewState) {
			case 'welcome':
				return 100
			case 'activity':
				return 3 / 10 * 100
			case 'room':
				return 5 / 10 * 100
			case 'order':
				return 7 / 10 * 100
			default:
				return 0
		}
	}

	const isMarkerActive = (markerState: string): boolean => {
		if (viewState === 'welcome') return false
		const states = ['activity', 'room', 'order']
		const currentIndex = states.indexOf(viewState)
		const markerIndex = states.indexOf(markerState)
		return markerIndex < currentIndex
	}

	return (
		<div className={`w-full flex flex-col relative ${viewState !== 'welcome' ? 'shadow-b-md bg-zinc-100' : ''}`}>
			{/* Top progress bar container */}
			<div className="w-full h-3 mt-2 mb-1 rounded-full">
				{/* Progress bar overlay */}
				<div className={`h-full transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-400 to-blue-600 ${getProgress(viewState) !== 100 ? 'rounded-r-full' : ''}`}
					style={{
						width: `${getProgress(viewState)}%`
					}}
				/>
			</div>

			{viewState !== 'welcome' && (
				<>
					{/* Progress markers */}
					<div className="absolute w-full">
						<div className={`w-4 h-4 rounded-full border-2 absolute top-1 -translate-x-1/2 ${isMarkerActive('activity') ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}
							style={{ left: `${getProgress('activity')}%` }}
						></div>
						<div className={`w-4 h-4 rounded-full border-2 absolute top-1 -translate-x-1/2 ${isMarkerActive('room') ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}
							style={{ left: `${getProgress('room')}%` }}
						></div>
						<div className={`w-4 h-4 rounded-full border-2 absolute top-1 -translate-x-1/2 ${isMarkerActive('order') ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}
							style={{ left: `${getProgress('order')}%` }}
						></div>
					</div>

					{/* Navigation buttons */}
					<div className="flex justify-center items-center h-full px-[20%]">
						{/* 'Start Forfra' on the left */}
						<div className="absolute left-4 h-full flex items-center">
							<button
								onClick={() => {
									setResetPressed(true)
									onReset()
									setTimeout(() => { setResetPressed(false) }, 300)
								}}
								className={`font-bold h-14 p-4 rounded-full flex-1 flex justify-center items-center m-2
									transition-all duration-300 shadow-[0_4px_0_#CBD5E1,0_2px_4px_rgba(0,0,0,0.1)]
									transform ${resetPressed ? 'translate-y-0 shadow-none' : '-translate-y-[4px]'}
									text-gray-800 bg-white`}
							>
								<div className="text-md flex flex-col items-center justify-center text-center">
									{'Start Forfra\r'}
								</div>
							</button>
						</div>
						<ProgressButton
							isActive={viewState === 'activity'}
							canClick={canClickActivity}
							onClick={() => { canClickActivity && onProgressClick('activity') }}
							selectedName={selectedActivity?.name}
							label="Aktivitet"
						/>
						<ProgressButton
							isActive={viewState === 'room'}
							canClick={canClickRoom}
							onClick={() => { canClickRoom && onProgressClick('room') }}
							selectedName={selectedRoom?.name}
							label="Spisested"
						/>
						<ProgressButton
							isActive={viewState === 'order'}
							canClick={canClickOrder}
							onClick={() => { canClickOrder && onProgressClick('order') }}
							label="Bestilling"
						/>
						{/* 'Hjem' on the right */}
						<div className="absolute right-4 h-full flex items-center">
							<button
								title="Gå til forside"
								onClick={() => { onProgressClick('welcome') }}
								className="font-bold h-14 w-14 rounded-full flex justify-center items-center m-2
									transition-all duration-300 shadow-[0_4px_0_#CBD5E1,0_2px_4px_rgba(0,0,0,0.1)]
									transform text-gray-800 bg-white"
							>
								<AsyncImage
									src={KioskImages.home.src}
									alt={KioskImages.home.alt}
									className="w-6 h-6"
									width={24}
									height={24}
									quality={75}
									priority={false}
									draggable={false}
								/>
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
