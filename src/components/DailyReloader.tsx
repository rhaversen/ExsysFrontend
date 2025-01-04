'use client'

import { useEffect } from 'react'

export default function DailyReloader ({
	reloadHour = 0,
	randomDelayMinutes = 10
}: {
	reloadHour?: number
	randomDelayMinutes?: number
}): null {
	useEffect(() => {
		const setMidnightReload = (): NodeJS.Timeout | undefined => {
			try {
				const now = new Date()
				const target = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getHours() >= reloadHour ? now.getDate() + 1 : now.getDate(),
					reloadHour,
					0,
					0
				)
				// Add random delay between 0-10 minutes
				const randomDelay = Math.floor(Math.random() * randomDelayMinutes * 60 * 1000)
				const msToReload = target.getTime() - now.getTime() + randomDelay

				console.log(`Page will reload in ${Math.floor(msToReload / 1000 / 60)} minutes`)

				return setTimeout(() => {
					window.location.reload()
				}, msToReload)
			} catch (error) {
				console.error('Failed to set reload timer')
				return undefined
			}
		}

		const timeoutId = setMidnightReload()
		return () => { (timeoutId !== null) && clearTimeout(timeoutId) }
	}, [randomDelayMinutes, reloadHour])

	return null
}
