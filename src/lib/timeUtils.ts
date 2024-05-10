import { type OrderWindow } from '@/lib/backendDataTypes'

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
	return {
		from: {
			hour: fromUTCDate.getUTCHours(),
			minute: fromUTCDate.getUTCMinutes()
		},
		to: {
			hour: toUTCDate.getUTCHours(),
			minute: toUTCDate.getUTCMinutes()
		}
	}
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
	return {
		from: {
			hour: fromDate.getHours(),
			minute: fromDate.getMinutes()

		},
		to: {
			hour: toDate.getHours(),
			minute: toDate.getMinutes()

		}
	}
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
