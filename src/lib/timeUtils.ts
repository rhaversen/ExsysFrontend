import { type ProductType, type OrderWindow, type Time, type KioskType } from '@/types/backendDataTypes'

export function convertLocalOrderWindowToUTC (orderWindow: OrderWindow): OrderWindow {
	const { from, to } = orderWindow

	// Create Date objects for the 'from' and 'to' times in local time
	const fromDate = new Date()
	fromDate.setHours(from.hour, from.minute, 0, 0)

	const toDate = new Date()
	toDate.setHours(to.hour, to.minute, 0, 0)

	// If 'from' time is later than 'to' time, adjust the 'to' date to the next day
	if (fromDate > toDate) {
		toDate.setDate(toDate.getDate() + 1)
	}

	// Use convertTimeToUTC for time conversion
	const fromUTC = convertLocalTimeToUTC({ hour: fromDate.getHours(), minute: fromDate.getMinutes() })
	const toUTC = convertLocalTimeToUTC({ hour: toDate.getHours(), minute: toDate.getMinutes() })

	return {
		from: fromUTC,
		to: toUTC
	}
}

export function convertUTCOrderWindowToLocal (orderWindow: OrderWindow): OrderWindow {
	const { from, to } = orderWindow

	// Get the current time in UTC
	const now = new Date()
	const currentYear = now.getUTCFullYear()
	const currentMonth = now.getUTCMonth()
	const currentDate = now.getUTCDate()

	// Create Date objects for the 'from' and 'to' times in UTC
	const fromDate = new Date(Date.UTC(currentYear, currentMonth, currentDate, from.hour, from.minute))
	const toDate = new Date(Date.UTC(currentYear, currentMonth, currentDate, to.hour, to.minute))

	// If 'from' time is later than 'to' time, adjust the 'to' date to the next day
	if (fromDate > toDate) {
		toDate.setDate(toDate.getDate() + 1)
	}

	// Use convertTimeFromUTC for time conversion
	const fromLocal = convertUTCTimeToLocal({ hour: fromDate.getUTCHours(), minute: fromDate.getUTCMinutes() })
	const toLocal = convertUTCTimeToLocal({ hour: toDate.getUTCHours(), minute: toDate.getUTCMinutes() })

	return {
		from: fromLocal,
		to: toLocal
	}
}

const convertLocalTimeToUTC = (time: Time): Time => {
	const date = new Date()
	date.setHours(time.hour, time.minute, 0, 0)
	const utcDate = new Date(date.toUTCString())
	return {
		hour: utcDate.getUTCHours(),
		minute: utcDate.getUTCMinutes()
	}
}

export const convertUTCTimeToLocal = (time: Time): Time => {
	const date = new Date()
	date.setUTCHours(time.hour, time.minute, 0, 0)
	const localDate = new Date(date.toString())
	return {
		hour: localDate.getHours(),
		minute: localDate.getMinutes()
	}
}

export function isCurrentTimeInLocalOrderWindow (orderWindow: OrderWindow): boolean {
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

	if (seconds <= 0) return 'Udløbet'

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

export function isKioskClosed (kiosk: KioskType): boolean {
	if (kiosk.manualClosed) return true
	if (kiosk.closedUntil != null) {
		const closedUntilDate = new Date(kiosk.closedUntil)
		return closedUntilDate > new Date()
	}
	return false
}

export function sortProductsByLocalOrderWindowFrom (products: ProductType[]): ProductType[] {
	return products.sort((a, b) => {
		const aOrderWindow = a.orderWindow
		const bOrderWindow = b.orderWindow

		const aFrom = aOrderWindow.from.hour * 60 + aOrderWindow.from.minute
		const bFrom = bOrderWindow.from.hour * 60 + bOrderWindow.from.minute

		return aFrom - bFrom
	})
}

export function sortProductsByLocalOrderWindowTo (products: ProductType[]): ProductType[] {
	return products.sort((a, b) => {
		const aOrderWindow = a.orderWindow
		const bOrderWindow = b.orderWindow

		const aTo = aOrderWindow.to.hour * 60 + aOrderWindow.to.minute
		const bTo = bOrderWindow.to.hour * 60 + bOrderWindow.to.minute

		return aTo - bTo
	})
}

export function getTimeStringFromLocalOrderWindowTime (orderWindowTime: Time): string {
	return `${orderWindowTime.hour.toString().padStart(2, '0')}:${orderWindowTime.minute.toString().padStart(2, '0')}`
}

// Returns the soonest next available product time, even if currently available, looping over products and days
// Assumes products are in local time (orderWindow is local)
export function getNextAvailableProductTimeLocal (products: ProductType[]): { product: ProductType, from: Time, date: Date } | null {
	const now = new Date()
	let soonest: { product: ProductType, from: Time, date: Date } | null = null
	for (const product of products) {
		if (!product.isActive) continue
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
