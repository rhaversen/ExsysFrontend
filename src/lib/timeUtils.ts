interface Time {
	hour: number;
	minute: number;
}

export interface OrderWindow {
	from: Time;
	to: Time;
}

export function convertOrderWindowToUTC(orderWindow: OrderWindow): OrderWindow {
	const { from, to } = orderWindow

	// Create Date objects for the 'from' and 'to' times in UTC
	let fromDate = new Date(Date.UTC(1970, 0, 1, from.hour, from.minute))
	let toDate = new Date(Date.UTC(1970, 0, 1, to.hour, to.minute))

	// If 'from' time is later than 'to' time, adjust the 'to' date to the next day
	if (fromDate > toDate) {
		toDate.setDate(toDate.getDate() + 1)
	}

	// Convert to UTC
	const fromInUTC: Time = {
		hour: fromDate.getUTCHours(),
		minute: fromDate.getUTCMinutes()
	}

	const toInUTC: Time = {
		hour: toDate.getUTCHours(),
		minute: toDate.getUTCMinutes()
	}

	// Return the new orderWindow object in UTC
	return { from: fromInUTC, to: toInUTC }
}

export function convertOrderWindowFromUTC(orderWindow: OrderWindow): OrderWindow {
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

	// Return the new orderWindow object in local time
	return {
		from: {
			hour: fromDate.getHours(),
			minute: fromDate.getMinutes()

		}, to: {
			hour: toDate.getHours(),
			minute: toDate.getMinutes()

		}
	}
}

export function isCurrentTimeInUTCOrderWindow(orderWindow: OrderWindow): boolean {
	const { from, to } = orderWindow

	// Get the current time in UTC
	const now = new Date()
	const currentYear = now.getUTCFullYear()
	const currentMonth = now.getUTCMonth()
	const currentDate = now.getUTCDate()

	// Create Date objects for the 'from' and 'to' times in UTC
	let fromDate = new Date(Date.UTC(currentYear, currentMonth, currentDate, from.hour, from.minute))
	let toDate = new Date(Date.UTC(currentYear, currentMonth, currentDate, to.hour, to.minute))

	// If 'from' time is later than 'to' time, adjust the 'to' date to the next day
	if (fromDate > toDate) {
		toDate.setDate(toDate.getDate() + 1)
	}

	// Check if the current time is within the order window
	if (fromDate.getTime() <= now.getTime() && now.getTime() <= toDate.getTime()) {
		return true
	}

	return false
}
