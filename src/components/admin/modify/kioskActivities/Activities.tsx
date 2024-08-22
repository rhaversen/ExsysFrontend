import Activity from '@/components/admin/modify/kioskActivities/Activity'
import { type ActivityType } from '@/types/backendDataTypes'
import { type ReactElement } from 'react'

const Activities = ({
	selectedActivities,
	editable,
	onDeleteActivity,
	showActivities
}: {
	selectedActivities: ActivityType[]
	editable: boolean
	onDeleteActivity: (v: ActivityType) => void
	showActivities: () => void
}): ReactElement => {
	return (
		<div className="flex flex-row flex-wrap">
			{selectedActivities.map((activity) => (
				<Activity
					key={activity._id}
					activity={activity}
					editable={editable}
					onDelete={onDeleteActivity}
				/>
			))}
			{editable &&
				<div className="m-1 text-center font-semibold border-2 border-blue-500 rounded-full">
					<button
						type="button"
						className="cursor-pointer"
						onClick={() => {
							showActivities()
						}}
					>
						<div className="text-blue-500 px-3 items-center">{' + '}</div>
					</button>
				</div>
			}
		</div>
	)
}

export default Activities
