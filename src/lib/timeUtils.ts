import { type ProductType, type OrderWindow, type Time, type KioskType } from '@/types/backendDataTypes'

export function convertOrderWindowToUTC (orderWindow: OrderWindow): OrderWindow {
	const {
		from,
		to
	} = orderWindow

	// Create Date objects for the 'from' and 'to' times in local time
	const fromDate = new Date()
	fromDate.setHours(from.hour, from.minute, 0, 0)

	const toDate = new Date()
	toDate.setHours(to.hour, to.minute, 0, 0)

	// If 'from' time is later than 'to' time, adjust the 'to' date to the next day
	if (fromDate > toDate) {
		toDate.setDate(toDate.getDate() + 1)
	}

	// Convert the Date objects to UTC
	const fromUTCDate = new Date(fromDate.toUTCString())
	const toUTCDate = new Date(toDate.toUTCString())

	// Return the new orderWindow object in UTC
	const orderWindowConverted = {
		from: {
			hour: fromUTCDate.getUTCHours(),
			minute: fromUTCDate.getUTCMinutes()
		},
		to: {
			hour: toUTCDate.getUTCHours(),
			minute: toUTCDate.getUTCMinutes()
		}
	}
	return orderWindowConverted
}

export function convertOrderWindowFromUTC (orderWindow: OrderWindow): OrderWindow {
	const {
		from,
		to
	} = orderWindow

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

	// Return the new orderWindow object in local time
	const orderWindowConverted = {
		from: {
			hour: fromDate.getHours(),
			minute: fromDate.getMinutes()
		},
		to: {
			hour: toDate.getHours(),
			minute: toDate.getMinutes()
		}
	}
	return orderWindowConverted
}

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

export function sortProductsByOrderwindow (products: ProductType[]): ProductType[] {
	return products.sort((a, b) => {
		const aOrderWindow = a.orderWindow
		const bOrderWindow = b.orderWindow

		const aFrom = aOrderWindow.from.hour * 60 + aOrderWindow.from.minute
		const bFrom = bOrderWindow.from.hour * 60 + bOrderWindow.from.minute

		return aFrom - bFrom
	})
}

export function getTimeStringFromOrderwindowTime (orderWindowTime: Time): string {
	return `${orderWindowTime.hour.toString().padStart(2, '0')}:${orderWindowTime.minute.toString().padStart(2, '0')}`
}
