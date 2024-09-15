import CloseableModal from '@/components/ui/CloseableModal'
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
		<CloseableModal onClose={onClose}>
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
		</CloseableModal>
	)
}

export default ActivitiesWindow
