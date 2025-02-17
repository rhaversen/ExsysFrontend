import Activity from '@/components/kiosk/activities/Activity'
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
		<main className="flex flex-col justify-center items-center h-full">
			<header className="mb-8">
				<h1 className="m-10 p-0 text-center text-gray-800 text-5xl font-bold">{'Bestilling af brød, kaffe og the'}</h1>
				<p className="m-4 p-0 text-center text-gray-600 text-xl">{'Vælg en aktivitet for at komme i gang'}</p>
			</header>
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
