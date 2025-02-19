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
		<main className="flex flex-col justify-center items-center h-full bg-zinc-100">
			<header className="mb-8 flex flex-col gap-5">
				<h1 className="text-center text-gray-800 text-5xl font-bold">{'Bestilling af brød, kaffe og the'}</h1>
				<p className="text-center text-gray-600 text-xl">{'Vælg din aktivitet for at komme i gang'}</p>
			</header>
			<div className="flex flex-wrap justify-center items-center p-20">
				{activities.map((activity) => (
					<button
						key={activity._id}
						type="button"
						onClick={() => {
							onActivitySelect(activity)
						}}
						className="p-10 m-5 bg-white rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						<h2 className="text-3xl font-bold mb-2 text-gray-800">
							{activity.name}
						</h2>
					</button>
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
