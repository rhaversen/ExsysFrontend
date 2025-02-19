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
		className={`font-bold transition-colors duration-300 flex-1 flex justify-center items-center
                    ${isActive ? 'text-blue-700' : 'text-gray-800'}
                    ${canClick ? 'cursor-pointer' : ''}`}
		onClick={onClick}
		disabled={!canClick}
		type='button'
	>
		<div className="text-lg p-2 flex flex-col items-center text-center rounded-lg"
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
	const getProgress = (): number => {
		switch (viewState) {
			case 'activity':
				return 0
			case 'room':
				return 50
			case 'order':
				return 100
			default:
				return 0
		}
	}

	const skipAnimation = viewState === 'order' && (selectedRoom == null)

	return (
		<div className="w-full bg-gray-300 relative transition-all duration-300 ease-in-out h-16">
			{/* Progress bar overlay */}
			<div
				className={`absolute h-full bg-blue-200 ${skipAnimation ? '' : 'transition-all duration-300 ease-in-out'}`}
				style={{ width: `${getProgress()}%` }}
			/>

			{/* Navigation items */}
			<div className="flex justify-around h-full relative z-10 gap-10">
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
					selectedName={undefined}
					label="Vælg Bestilling"
				/>
			</div>
		</div>
	)
}
