import { type ActivityType, type RoomType } from '@/types/backendDataTypes'
import { type ViewState } from '@/types/frontendDataTypes'
import React from 'react'

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
                    transition-all duration-300 ease-in-out shadow-[0_4px_0_#CBD5E1,0_2px_4px_rgba(0,0,0,0.1)]
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
	selectedActivity,
	selectedRoom
}: {
	viewState: ViewState
	canClickActivity: boolean
	canClickRoom: boolean
	canClickOrder: boolean
	onProgressClick: (view: ViewState) => void
	selectedActivity: ActivityType | null
	selectedRoom: RoomType | null
}): React.ReactElement {
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
					</div>
				</>
			)}
		</div>
	)
}
