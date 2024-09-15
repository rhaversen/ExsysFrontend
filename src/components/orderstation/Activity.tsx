import { type ActivityType } from '@/types/backendDataTypes'
import React, { type ReactElement } from 'react'

const Activity = ({
	activity,
	onActivitySelect
}: {
	activity: ActivityType
	onActivitySelect: (activityId: ActivityType['_id']) => void
}): ReactElement => {
	return (
		<button
			type="button"
			onClick={() => {
				onActivitySelect(activity._id)
			}}
			className="p-10 m-5 bg-white rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
		>
			<h2 className="text-3xl font-bold mb-2 text-gray-800">
				{activity.name}
			</h2>
		</button>
	)
}

export default Activity
