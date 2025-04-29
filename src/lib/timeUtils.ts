import dayjs from 'dayjs'

import { type ProductType, type OrderWindow, type Time, type KioskType, ConfigsType } from '@/types/backendDataTypes'

export function isCurrentTimeInOrderWindow (orderWindow: OrderWindow): boolean {
	const now = new Date()
	const currentHour = now.getHours()
	const currentMinute = now.getMinutes()

	const fromHour = orderWindow.from.hour
	const fromMinute = orderWindow.from.minute
	const toHour = orderWindow.to.hour
	const toMinute = orderWindow.to.minute

	// If from is after to, it spans over midnight
	if (fromHour > toHour || (fromHour === toHour && fromMinute > toMinute)) {
		// Check if current time is after from or before to
		return (currentHour > fromHour || (currentHour === fromHour && currentMinute >= fromMinute)) ||
			(currentHour < toHour || (currentHour === toHour && currentMinute < toMinute))
	} else {
		// Check if current time is within from and to
		return (currentHour >= fromHour && currentHour <= toHour) &&
			(currentHour === fromHour ? currentMinute >= fromMinute : true) &&
			(currentHour === toHour ? currentMinute < toMinute : true)
	}
}

export function timeSince (dateString: string): string {
	const seconds = Math.max(Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000), 0)

	let interval = Math.floor(seconds / 31536000)
	if (interval >= 1) {
		const months = Math.floor((seconds % 31536000) / 2592000)
		return `${interval} år${months > 0 ? ` og ${months} måned${months !== 1 ? 'er' : ''}` : ''} siden`
	}

	interval = Math.floor(seconds / 2592000)
	if (interval >= 1) {
		const days = Math.floor((seconds % 2592000) / 86400)
		return `${interval} måned${interval !== 1 ? 'er' : ''}${days > 0 ? ` og ${days} dag${days !== 1 ? 'e' : ''}` : ''} siden`
	}

	interval = Math.floor(seconds / 86400)
	if (interval >= 1) {
		const hours = Math.floor((seconds % 86400) / 3600)
		return `${interval} dag${interval !== 1 ? 'e' : ''}${hours > 0 ? ` og ${hours} time${hours !== 1 ? 'r' : ''}` : ''} siden`
	}

	interval = Math.floor(seconds / 3600)
	if (interval >= 1) {
		const minutes = Math.floor((seconds % 3600) / 60)
		return `${interval} time${interval !== 1 ? 'r' : ''}${minutes > 0 ? ` og ${minutes} minut${minutes !== 1 ? 'ter' : ''}` : ''} siden`
	}

	interval = Math.floor(seconds / 60)
	if (interval >= 1) {
		return `${interval} minut${interval !== 1 ? 'ter' : ''} siden`
	}

	return `${seconds} sekund${seconds !== 1 ? 'er' : ''} siden`
}

export function timeUntil (dateString: string | number): string {
	const seconds = Math.floor((new Date(dateString).valueOf() - new Date().getTime()) / 1000)

	if (seconds <= 0) { return 'Udløbet' }

	let interval = Math.floor(seconds / 31536000)
	if (interval >= 1) {
		const months = Math.floor((seconds % 31536000) / 2592000)
		return `om ${interval} år${months > 0 ? ` og ${months} måned${months !== 1 ? 'er' : ''}` : ''}`
	}

	interval = Math.floor(seconds / 2592000)
	if (interval >= 1) {
		const days = Math.floor((seconds % 2592000) / 86400)
		return `om ${interval} måned${interval !== 1 ? 'er' : ''}${days > 0 ? ` og ${days} dag${days !== 1 ? 'e' : ''}` : ''}`
	}

	interval = Math.floor(seconds / 86400)
	if (interval >= 1) {
		const hours = Math.floor((seconds % 86400) / 3600)
		return `om ${interval} dag${interval !== 1 ? 'e' : ''}${hours > 0 ? ` og ${hours} time${hours !== 1 ? 'r' : ''}` : ''}`
	}

	interval = Math.floor(seconds / 3600)
	if (interval >= 1) {
		const minutes = Math.floor((seconds % 3600) / 60)
		return `om ${interval} time${interval !== 1 ? 'r' : ''}${minutes > 0 ? ` og ${minutes} minut${minutes !== 1 ? 'ter' : ''}` : ''}`
	}

	interval = Math.floor(seconds / 60)
	if (interval >= 1) {
		return `om ${interval} minut${interval !== 1 ? 'ter' : ''}`
	}

	return `om ${seconds} sekund${seconds !== 1 ? 'er' : ''}`
}

export function isKioskClosedBackendState (kiosk: KioskType): boolean {
	if (kiosk.manualClosed) { return true }
	if (kiosk.closedUntil != null) {
		const closedUntilDate = new Date(kiosk.closedUntil)
		return closedUntilDate > new Date()
	}
	return false
}

export function sortProductsByOrderWindowFrom (products: ProductType[]): ProductType[] {
	return products.sort((a, b) => {
		const aOrderWindow = a.orderWindow
		const bOrderWindow = b.orderWindow

		const aFrom = (aOrderWindow?.from.hour ?? Number.POSITIVE_INFINITY) * 60 + (aOrderWindow?.from.minute ?? Number.POSITIVE_INFINITY)
		const bFrom = (bOrderWindow?.from.hour ?? Number.POSITIVE_INFINITY) * 60 + (bOrderWindow?.from.minute ?? Number.POSITIVE_INFINITY)

		return aFrom - bFrom
	})
}

export function sortProductsByOrderWindowTo (products: ProductType[]): ProductType[] {
	return products.sort((a, b) => {
		const aOrderWindow = a.orderWindow
		const bOrderWindow = b.orderWindow

		const aTo = (aOrderWindow?.to.hour ?? Number.POSITIVE_INFINITY) * 60 + (aOrderWindow?.to.minute ?? Number.POSITIVE_INFINITY)
		const bTo = (bOrderWindow?.to.hour ?? Number.POSITIVE_INFINITY) * 60 + (bOrderWindow?.to.minute ?? Number.POSITIVE_INFINITY)

		return aTo - bTo
	})
}

export function getTimeStringFromOrderWindowTime (orderWindowTime: Time): string {
	return `${orderWindowTime.hour.toString().padStart(2, '0')}:${orderWindowTime.minute.toString().padStart(2, '0')}`
}

// Returns the soonest next available product time, even if currently available, looping over products and days
export function getNextAvailableProductOrderWindowFrom (products: ProductType[]): { product: ProductType, from: Time, date: Date } | null {
	const now = new Date()
	let soonest: { product: ProductType, from: Time, date: Date } | null = null
	for (const product of products) {
		if (!product.isActive) { continue }
		const { from } = product.orderWindow
		// Calculate the next occurrence of the 'from' time (today if still upcoming, else tomorrow)
		const fromDateToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), from.hour, from.minute, 0, 0)
		let nextFromDate: Date
		if (now < fromDateToday) {
			nextFromDate = fromDateToday
		} else {
			// If already past, next occurrence is tomorrow
			nextFromDate = new Date(fromDateToday)
			nextFromDate.setDate(nextFromDate.getDate() + 1)
		}
		if (soonest === null || nextFromDate < soonest.date) {
			soonest = { product, from, date: new Date(nextFromDate) }
		}
	}
	return soonest
}

export function getNextOpen (configs: ConfigsType | null, kiosk: KioskType | null, products: ProductType[]): Date | null {
	// 1. Guard Clauses & Initial Setup
	if (configs == null || kiosk == null || products.length === 0) {
		return null // No kiosk or products, can't determine opening time
	}
	if (kiosk.manualClosed === true) {
		return null // Manually closed, no predictable opening
	}
	const disabledWeekdays = configs.configs.disabledWeekdays
	if (disabledWeekdays.length === 7) {
		return null // Closed every day
	}
	const activeProducts = products.filter(p => p.isActive)
	if (activeProducts.length === 0) {
		return null // No products available to be sold
	}

	// 2. Determine the Earliest Possible Start Point
	const now = new Date()
	let searchStartTime = new Date(now) // Start checking from now
	const originalSearchStartDay = new Date(searchStartTime) // Keep track of the initial day
	originalSearchStartDay.setHours(0, 0, 0, 0)

	// Factor in kiosk.closedUntil if it's in the future
	if (kiosk.closedUntil != null) {
		const closedUntilDate = new Date(kiosk.closedUntil)
		if (closedUntilDate > searchStartTime) {
			searchStartTime = closedUntilDate
			// Update originalSearchStartDay if closedUntil pushes it to a new day
			if (searchStartTime.getDate() !== originalSearchStartDay.getDate() ||
				searchStartTime.getMonth() !== originalSearchStartDay.getMonth() ||
				searchStartTime.getFullYear() !== originalSearchStartDay.getFullYear()) {
				originalSearchStartDay.setFullYear(searchStartTime.getFullYear(), searchStartTime.getMonth(), searchStartTime.getDate())
			}
		}
	}

	// Get all unique product opening times, sorted
	const uniqueOpeningTimes = [...new Map(
		activeProducts.map(p => [`${p.orderWindow.from.hour}:${p.orderWindow.from.minute}`, p.orderWindow.from])
	).values()].sort((a, b) => {
		if (a.hour !== b.hour) { return a.hour - b.hour }
		return a.minute - b.minute
	})

	if (uniqueOpeningTimes.length === 0) {
		// Should be caught by activeProducts check, but as a safeguard
		return null
	}

	// 3. Iterate Forward Day by Day to Find the First Valid Opening Slot
	const checkDate = new Date(searchStartTime) // Start checking from the day of the earliest possible start
	checkDate.setHours(0, 0, 0, 0) // Normalize to the start of the day for iteration

	for (let i = 0; i < 365; i++) { // Limit search to 1 year ahead
		const currentDayOfWeek = checkDate.getDay()

		// A. Check if the current day is disabled
		if (disabledWeekdays.includes(currentDayOfWeek)) {
			// Advance to the start of the next day
			checkDate.setDate(checkDate.getDate() + 1)
			continue // Check the new day
		}

		// B. Day is enabled. Check all potential opening times for this day.
		for (const openingTime of uniqueOpeningTimes) {
			const potentialOpeningDateTime = new Date(checkDate)
			potentialOpeningDateTime.setHours(openingTime.hour, openingTime.minute, 0, 0)

			// C. Check if this potential opening time is on or after our search start time.
			if (potentialOpeningDateTime >= searchStartTime) {
				// Found the next valid opening time based on product window start
				return potentialOpeningDateTime
			} else {
				// D. Potential opening is *before* searchStartTime.
				//    Check if searchStartTime falls *within* the order window of any product starting at this time.
				//    This handles the case where closedUntil is later than the nominal product start time.
				//    Only do this check if we are still on the *original* search start day.
				const isSameDayAsOriginalSearch =
					checkDate.getFullYear() === originalSearchStartDay.getFullYear() &&
					checkDate.getMonth() === originalSearchStartDay.getMonth() &&
					checkDate.getDate() === originalSearchStartDay.getDate()

				if (isSameDayAsOriginalSearch) {
					const relevantProducts = activeProducts.filter(p =>
						p.orderWindow.from.hour === openingTime.hour &&
						p.orderWindow.from.minute === openingTime.minute
					)

					for (const product of relevantProducts) {
						const orderWindowEndDate = new Date(checkDate)
						orderWindowEndDate.setHours(product.orderWindow.to.hour, product.orderWindow.to.minute, 59, 999)

						// If the search start time is within this product's window (even if the window started earlier)
						if (searchStartTime < orderWindowEndDate) {
							// The effective opening time is the searchStartTime itself
							return searchStartTime
						}
					}
				}
			}
		}

		// E. If we reach here, no opening time on the *current* enabled day was valid
		//    (either all openings were before searchStartTime and searchStartTime wasn't within their window,
		//     or the day was disabled).
		//    Advance to the start of the next day.
		checkDate.setDate(checkDate.getDate() + 1)
		// Reset searchStartTime to the beginning of the next valid day if we advance
		// This prevents the closedUntil time from incorrectly affecting future days.
		if (checkDate > searchStartTime) {
			searchStartTime = new Date(checkDate) // Start search from 00:00 on the next day
		}
	}

	// 4. If loop completes without finding an opening (highly unlikely with guards)
	return null
}

// Helper to check if a date is today (local time)
function isDateToday (date: Date): boolean {
	const now = new Date()
	return (
		date.getFullYear() === now.getFullYear() &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate()
	)
}

// Helper to check if a date is tomorrow (local time)
function isDateTomorrow (date: Date): boolean {
	const now = new Date()
	const tomorrow = new Date(now)
	tomorrow.setHours(0, 0, 0, 0)
	tomorrow.setDate(now.getDate() + 1)
	return (
		date.getFullYear() === tomorrow.getFullYear() &&
			date.getMonth() === tomorrow.getMonth() &&
			date.getDate() === tomorrow.getDate()
	)
}

// Helper to format opening message
export function getOpeningMessage (date: Date): string {
	const timeStr = dayjs(date).format('HH:mm')
	if (isDateToday(date)) {
		return `Kiosken åbner igen kl. ${timeStr}`
	} else if (isDateTomorrow(date)) {
		return `Kiosken åbner igen i morgen kl. ${timeStr}`
	} else {
		const formatted = dayjs(date).format('dddd [d.] DD/MM').charAt(0).toUpperCase() + dayjs(date).format('dddd [d.] DD/MM').slice(1)
		return `Kiosken åbner igen ${formatted} kl. ${timeStr}`
	}
}
