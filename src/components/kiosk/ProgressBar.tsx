import React from 'react'

import { type ActivityType, type RoomType } from '@/types/backendDataTypes'
import { type ViewState } from '@/types/frontendDataTypes'

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
		className={`font-bold h-14 rounded-xl flex-1 flex justify-center items-center m-2 border border-gray-200
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
		if (viewState === 'welcome') { return false }
		const states = ['activity', 'room', 'order']
		const currentIndex = states.indexOf(viewState)
		const markerIndex = states.indexOf(markerState)
		return markerIndex < currentIndex
	}

	const markerClass = (state: 'activity' | 'room' | 'order'): string =>
		`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-colors duration-300
		${isMarkerActive(state) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`

	return (
		<div className={`w-full flex flex-col ${viewState !== 'welcome' ? 'shadow-b-md' : ''}`}>
			{/* Progress bar with markers */}
			<div className="relative w-full h-4 flex items-center mt-2 mb-1">
				{/* Track */}
				<div className="absolute inset-x-0 h-3 rounded-full bg-gray-200" />
				{/* Fill */}
				<div
					className={`absolute h-3 left-0 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ease-in-out ${getProgress(viewState) !== 100 ? 'rounded-r-full' : ''}`}
					style={{ width: `${getProgress(viewState)}%` }}
				/>
				{/* Markers */}
				{viewState !== 'welcome' && (
					<>
						<div className={markerClass('activity')} style={{ left: `${getProgress('activity')}%` }} />
						<div className={markerClass('room')} style={{ left: `${getProgress('room')}%` }} />
						<div className={markerClass('order')} style={{ left: `${getProgress('order')}%` }} />
					</>
				)}
			</div>

			{viewState !== 'welcome' && (
				<div className="relative flex justify-center items-center h-full px-[20%]">
					<div className="absolute left-4 h-full flex items-center">
						<button
							onClick={() => { onProgressClick('welcome') }}
							className="font-bold h-14 rounded-xl flex justify-center items-center m-2 border border-gray-200
									transition-all duration-300 shadow-[0_4px_0_#CBD5E1,0_2px_4px_rgba(0,0,0,0.1)]
									transform -translate-y-[4px] text-gray-800 bg-white"
							type="button"
						>
							<div className="text-xl flex flex-col items-center justify-center text-center p-3">
								{'Start Forfra'}
							</div>
						</button>
					</div>
					<ProgressButton
						isActive={viewState === 'activity'}
						canClick={canClickActivity}
						onClick={() => { if (canClickActivity) { onProgressClick('activity') } }}
						selectedName={selectedActivity?.name}
						label="Aktivitet"
					/>
					<ProgressButton
						isActive={viewState === 'room'}
						canClick={canClickRoom}
						onClick={() => { if (canClickRoom) { onProgressClick('room') } }}
						selectedName={selectedRoom?.name}
						label="Spisested"
					/>
					<ProgressButton
						isActive={viewState === 'order'}
						canClick={canClickOrder}
						onClick={() => { if (canClickOrder) { onProgressClick('order') } }}
						label="Bestilling"
					/>
				</div>
			)}
		</div>
	)
}
