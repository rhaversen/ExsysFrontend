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
		className={`font-bold transition-colors duration-300 flex-1 flex justify-center items-center
                    ${isActive ? 'text-blue-700' : 'text-gray-800'}
                    ${canClick ? 'cursor-pointer' : ''}`}
		onClick={onClick}
		disabled={!canClick}
		type='button'
	>
		<div className="text-lg p-2 flex flex-col items-center text-center rounded-lg"
		>
			<div className='flex items-center justify-center gap-1'>
				{(selectedName != null) && (
					<div className="text-sm text-gray-500">{label + ':'}</div>
				)}
				{selectedName ?? `Vælg ${label}`}
			</div>
			{canClick && (
				<div className="text-md text-gray-700">{'Ret valg'}</div>
			)}
		</div>
	</button>
)

export default function ProgressBar ({
	viewState,
	canClickActivity,
	canClickRoom,
	onProgressClick,
	selectedActivity,
	selectedRoom
}: {
	viewState: ViewState
	canClickActivity: () => boolean
	canClickRoom: () => boolean
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
		<div className="w-full bg-gray-300 relative transition-all duration-300 ease-in-out h-20">
			{/* Progress bar overlay */}
			<div
				className={`absolute h-full bg-blue-200 ${skipAnimation ? '' : 'transition-all duration-300 ease-in-out'}`}
				style={{ width: `${getProgress()}%` }}
			/>

			{/* Navigation items */}
			<div className="flex justify-around h-full relative z-10 gap-10">
				<ProgressButton
					isActive={viewState === 'activity'}
					canClick={canClickActivity()}
					onClick={() => { canClickActivity() && onProgressClick('activity') }}
					selectedName={selectedActivity?.name}
					label="Aktivitet"
				/>
				<ProgressButton
					isActive={viewState === 'room'}
					canClick={canClickRoom()}
					onClick={() => { canClickRoom() && onProgressClick('room') }}
					selectedName={selectedRoom?.name}
					label="Rum"
				/>
				<div className="text-center flex-1 flex items-center justify-center">
					<div className={`font-bold transition-colors duration-300 text-lg p-2
							${viewState === 'order' ? 'text-blue-700' : 'text-gray-700'}`}
					>
						{'Bestil'}
					</div>
				</div>
			</div>
		</div>
	)
}
