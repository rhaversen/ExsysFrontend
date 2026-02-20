'use client'

import { useEffect } from 'react'

import { useConfig } from '@/contexts/ConfigProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

export default function DailyReloader (): null {
	const { config } = useConfig()
	const { addError } = useError()

	const reloadMsSinceMidnight = config?.configs.kioskReloadMsSinceMidnight ?? 10800000 // 3 AM default
	const randomDelayMinutes = 10

	useEffect(() => {
		const setReloadTimer = (): NodeJS.Timeout | undefined => {
			try {
				const now = new Date()
				const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
				const todayReloadTime = midnightToday + reloadMsSinceMidnight
				const targetTime = now.getTime() >= todayReloadTime
					? todayReloadTime + 86400000 // Tomorrow
					: todayReloadTime

				const randomDelay = Math.floor(Math.random() * randomDelayMinutes * 60 * 1000)
				const msToReload = targetTime - now.getTime() + randomDelay

				console.info(`Page will reload in ${Math.floor(msToReload / 1000 / 60)} minutes`)

				return setTimeout(() => {
					window.location.reload()
				}, msToReload)
			} catch (error) {
				addError('Failed to set reload timer', error)
				return undefined
			}
		}

		const timeoutId = setReloadTimer()
		return () => {
			if (timeoutId !== null && timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [addError, randomDelayMinutes, reloadMsSinceMidnight])

	return null
}
