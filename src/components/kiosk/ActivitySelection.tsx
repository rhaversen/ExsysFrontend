import Activity from '@/components/kiosk/Activity'
import { type ActivityType } from '@/types/backendDataTypes'
import React, { type ReactElement } from 'react'

const ActivitySelection = ({
	activities,
	onActivitySelect
}: {
	activities: ActivityType[]
	onActivitySelect: (activity: ActivityType) => void
}): ReactElement => {
	return (
		<main className="flex flex-col justify-center items-center h-screen">
			<h1 className="m-10 p-0 text-center text-gray-800 text-4xl">{'Bestil til aktivitet:'}</h1>
			<div className="flex flex-wrap justify-center items-center p-20">
				{activities.map((activity) => (
					<Activity
						key={activity._id}
						activity={activity}
						onActivitySelect={onActivitySelect}
					/>
				))}
				{activities.length === 0 && (
					<div>
						<p className="text-center text-gray-800 text-2xl">{'Der er ikke fundet nogle aktiviteter'}</p>
						<p className="text-center text-gray-800 text-2xl">{'Kontakt venligst personalet'}</p>
					</div>
				)}
			</div>
		</main>
	)
}

export default ActivitySelection
