'use client'

import Activity from '@/components/orderstation/Activity'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [activities, setActivities] = useState<ActivityType[]>([])

	const router = useRouter()
	const { addError } = useError()

	const fetchActivities = useCallback(async () => {
		const kioskResponse = await axios.get(API_URL + '/v1/kiosks/me', { withCredentials: true })
		const kiosk = kioskResponse.data as KioskType

		const ActivitiesResponse = await axios.get(API_URL + '/v1/activities', { withCredentials: true })
		const activities = ActivitiesResponse.data as ActivityType[]

		// Set activities that are assigned to the kiosk
		const kioskActivities = activities.filter((activity) => kiosk.activities.includes(activity._id))

		setActivities(kioskActivities)
	}, [API_URL, setActivities])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return
		fetchActivities().catch((error) => {
			console.error(error)
			addError(error)
		})
	}, [API_URL, addError, fetchActivities])

	useEffect(() => {
		if (activities.length === 1) {
			router.push(`/orderstation/${activities[0]._id}`)
		}
	}, [activities, router, addError])

	const handleActivitySelect = useCallback((activityId: ActivityType['_id']): void => {
		router.push(`/orderstation/${activityId}`)
	}, [router])

	useInterval(fetchActivities, 1000 * 60 * 60) // Fetch rooms every hour

	return (
		<main className="flex flex-col justify-center items-center h-screen">
			<h1 className="m-10 p-0 text-center text-gray-800 text-4xl">Bestil til aktivitet:</h1>
			<div className="flex flex-wrap justify-center items-center p-20">
				{activities.map((activity) => (
					<Activity
						key={activity._id}
						activity={activity}
						onActivitySelect={handleActivitySelect}
					/>
				))}
				{activities.length === 0 && (
					<p className="text-center text-gray-800 text-2xl">Der er ingen rum tilknyttet denne kiosk</p>
				)}
			</div>
		</main>
	)
}
