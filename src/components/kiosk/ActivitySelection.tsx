import { type ActivityType } from '@/types/backendDataTypes'
import React, { type ReactElement } from 'react'

const ActivitySelection = ({
	activities,
	kioskActivities,
	onActivitySelect
}: {
	activities: ActivityType[]
	kioskActivities: ActivityType[]
	onActivitySelect: (activity: ActivityType) => void
}): ReactElement => {
	const otherActivities = activities.filter(activity =>
		!kioskActivities.some(ka => ka._id === activity._id)
	)

	return (
		<main className="flex flex-col justify-center items-center h-full bg-zinc-100">
			<header className="mb-8 flex flex-col gap-5">
				<h1 className="text-center text-gray-800 text-5xl font-bold">{'Bestilling af brød, kaffe og the'}</h1>
				<p className="text-center text-gray-600 text-xl">{'Vælg din aktivitet for at komme i gang'}</p>
			</header>

			{kioskActivities.length > 0 && (
				<div className="flex flex-wrap justify-center">
					{kioskActivities.map((activity) => (
						<button
							key={activity._id}
							type="button"
							onClick={() => { onActivitySelect(activity) }}
							className="p-10 m-5 bg-white rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
						>
							<h2 className="text-3xl font-bold mb-2 text-gray-800">
								{activity.name}
							</h2>
						</button>
					))}
				</div>
			)}

			{otherActivities.length > 0 && (
				<div className="w-full max-w-4xl mt-8">
					<div className="rounded grid grid-cols-2 gap-4">
						{otherActivities.map((activity, index) => (
							<div key={activity._id}>
								<button
									onClick={() => { onActivitySelect(activity) }}
									className="w-full text-left py-3 px-4 bg-white hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
								>
									<span className="font-semibold text-lg text-gray-900">{activity.name}</span>
								</button>
								{index < otherActivities.length - 1 && (
									<div className="border-b border-gray-200" />
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{activities.length === 0 && (
				<div>
					<p className="text-center text-gray-800 text-2xl">{'Der er ikke fundet nogle aktiviteter'}</p>
					<p className="text-center text-gray-800 text-2xl">{'Kontakt venligst personalet'}</p>
				</div>
			)}
		</main>
	)
}

export default ActivitySelection
