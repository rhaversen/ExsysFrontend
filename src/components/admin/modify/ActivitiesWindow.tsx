import { type ActivityType } from '@/types/backendDataTypes'
import { type ReactElement, useCallback } from 'react'

const ActivitiesWindow = ({
	kioskName,
	activities,
	kioskActivities,
	onAddActivity,
	onDeleteActivity,
	onClose
}: {
	kioskName: string
	activities: ActivityType[]
	kioskActivities: ActivityType[]
	onAddActivity: (v: ActivityType) => void
	onDeleteActivity: (v: ActivityType) => void
	onClose: () => void
}): ReactElement => {
	const handleToggle = useCallback((activity: ActivityType): void => {
		if (kioskActivities.map((activity) => activity._id).includes(activity._id)) {
			onDeleteActivity(activity)
		} else {
			onAddActivity(activity)
		}
	}, [kioskActivities, onDeleteActivity, onAddActivity])

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
			<div className="absolute bg-white rounded-3xl p-10 flex flex-col items-center">
				<h2 className="text-lg font-bold text-gray-800">
					{`Tilføj aktivitet til ${kioskName}`}
				</h2>
				<div className="bg-white p-2 rounded">
					{activities.map((activity) => (
						<div
							key={activity._id}
							className="flex flex-wrap flex-row items-center p-1 mb-2 text-gray-800"
						>
							<input
								title="Add Option"
								type="checkbox"
								className="cursor-pointer w-5 h-5"
								checked={kioskActivities.map((activity) => activity._id).includes(activity._id)}
								onChange={() => {
									handleToggle(activity)
								}}
							/>
							<span className="ml-2">{activity.name}</span>
						</div>
					))}
				</div>
				<div className="flex justify-center gap-4">
					<button
						type="button"
						className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
						onClick={onClose}
					>
						{'Færdig'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ActivitiesWindow
