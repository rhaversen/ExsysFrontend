import { type ActivityType, type RoomType } from '@/types/backendDataTypes'
import { type ViewState } from '@/types/frontendDataTypes'
import React from 'react'

const ProgressButton = ({
	isActive,
	canClick,
	canClickMessage,
	onClick,
	selectedName,
	label
}: {
	isActive: boolean
	canClick: boolean
	canClickMessage: string
	onClick: () => void
	selectedName?: string
	label: string
}): React.ReactElement => (
	<button
		className={`font-bold h-14 transition-colors duration-300 flex-1 flex justify-center items-start
                    ${isActive ? 'text-blue-700' : 'text-gray-800'}
                    ${canClick ? 'cursor-pointer' : ''}`}
		onClick={onClick}
		disabled={!canClick}
		type='button'
	>
		<div className="text-lg flex flex-col items-center justify-start text-center rounded-lg"
		>
			{selectedName ?? label}
			{canClick && (
				<div className="text-md text-gray-700">{canClickMessage}</div>
			)}
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
			case 'activity':
				return 1 / 6 * 100
			case 'room':
				return 50
			case 'order':
				return 5 / 6 * 100
			default:
				return 0
		}
	}

	const isMarkerActive = (markerState: string): boolean => {
		const states = ['activity', 'room', 'order']
		const currentIndex = states.indexOf(viewState)
		const markerIndex = states.indexOf(markerState)
		return markerIndex < currentIndex
	}

	return (
		<div className="w-full flex flex-col bg-zinc-100 shadow-b-md relative">
			{/* Top progress bar container */}
			<div className="w-full h-3 mt-2 mb-1 rounded-full">
				{/* Progress bar overlay */}
				<div className="h-full transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-400 to-blue-600 rounded-r-full"
					style={{
						width: `${getProgress(viewState)}%`
					}}
				/>

			</div>

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
			<div className="flex justify-around items-start h-full">
				<ProgressButton
					isActive={viewState === 'activity'}
					canClick={canClickActivity}
					canClickMessage="Tryk her for at ændre aktivitet"
					onClick={() => { canClickActivity && onProgressClick('activity') }}
					selectedName={selectedActivity?.name}
					label="Vælg Aktivitet"
				/>
				<ProgressButton
					isActive={viewState === 'room'}
					canClick={canClickRoom}
					canClickMessage="Tryk her for at ændre lokale"
					onClick={() => { canClickRoom && onProgressClick('room') }}
					selectedName={selectedRoom?.name}
					label="Vælg Lokale"
				/>
				<ProgressButton
					isActive={viewState === 'order'}
					canClick={canClickOrder}
					canClickMessage="Tryk her for at ændre bestilling"
					onClick={() => { canClickOrder && onProgressClick('order') }}
					label="Vælg Bestilling"
				/>
			</div>
		</div>
	)
}
