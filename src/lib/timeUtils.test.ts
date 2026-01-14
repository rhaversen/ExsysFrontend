import { type OrderWindow, type KioskType, type ProductType, type ConfigsType, type Time } from '@/types/backendDataTypes'

import {
	getNextOrderWindowChange,
	isCurrentTimeInOrderWindow,
	isKioskDeactivated,
	getNextOpen,
	timeSince,
	timeUntil,
	sortProductsByOrderWindowFrom,
	sortProductsByOrderWindowTo,
	getTimeStringFromOrderWindowTime,
	getNextAvailableProductOrderWindowFrom,
	formatRelativeDateLabel,
	formatFullDateLabel
} from './timeUtils'

describe('isCurrentTimeInOrderWindow', () => {
	const createWindow = (fromHour: number, fromMinute: number, toHour: number, toMinute: number): OrderWindow => ({
		from: { hour: fromHour, minute: fromMinute },
		to: { hour: toHour, minute: toMinute }
	})

	describe('normal windows (same day)', () => {
		it('returns true when current time is within window', () => {
			const window = createWindow(8, 0, 14, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.useRealTimers()
		})

		it('returns false when current time is before window', () => {
			const window = createWindow(8, 0, 14, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})

		it('returns false when current time is after window', () => {
			const window = createWindow(8, 0, 14, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T15:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})

		it('returns true at exact start time', () => {
			const window = createWindow(8, 0, 14, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T08:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.useRealTimers()
		})

		it('returns false at exact end time', () => {
			const window = createWindow(8, 0, 14, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T14:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})
	})

	describe('midnight-spanning windows', () => {
		it('returns true during evening portion (after from)', () => {
			const window = createWindow(22, 0, 6, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T23:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.useRealTimers()
		})

		it('returns true during morning portion (before to)', () => {
			const window = createWindow(22, 0, 6, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T03:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.useRealTimers()
		})

		it('returns false during gap (afternoon)', () => {
			const window = createWindow(22, 0, 6, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})

		it('returns true at exact start of midnight-spanning window', () => {
			const window = createWindow(22, 0, 6, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T22:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.useRealTimers()
		})

		it('returns false at exact end of midnight-spanning window', () => {
			const window = createWindow(22, 0, 6, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T06:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})
	})

	describe('edge cases', () => {
		it('handles window with same from and to as zero-length (always closed)', () => {
			const window = createWindow(12, 0, 12, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:00:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})

		it('handles minute-level precision at boundary', () => {
			const window = createWindow(8, 30, 14, 45)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T08:29:59'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.setSystemTime(new Date('2026-01-14T08:30:00'))
			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.setSystemTime(new Date('2026-01-14T14:44:59'))
			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.setSystemTime(new Date('2026-01-14T14:45:00'))
			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})

		it('ignores seconds - only checks hours and minutes', () => {
			const window = createWindow(8, 0, 14, 0)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:59:59'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.setSystemTime(new Date('2026-01-14T08:00:01'))
			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.useRealTimers()
		})

		it('handles single-minute window', () => {
			const window = createWindow(12, 30, 12, 31)
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:29:00'))

			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.setSystemTime(new Date('2026-01-14T12:30:00'))
			expect(isCurrentTimeInOrderWindow(window)).toBe(true)

			jest.setSystemTime(new Date('2026-01-14T12:31:00'))
			expect(isCurrentTimeInOrderWindow(window)).toBe(false)

			jest.useRealTimers()
		})
	})
})

describe('getNextOrderWindowChange', () => {
	const createWindow = (fromHour: number, fromMinute: number, toHour: number, toMinute: number): OrderWindow => ({
		from: { hour: fromHour, minute: fromMinute },
		to: { hour: toHour, minute: toMinute }
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns null for empty array', () => {
		expect(getNextOrderWindowChange([])).toBeNull()
	})

	describe('normal windows', () => {
		it('returns opening time when before window opens', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
			const windows = [createWindow(8, 0, 14, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T08:00:00'))
		})

		it('returns closing time when inside window', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
			const windows = [createWindow(8, 0, 14, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T14:00:00'))
		})

		it('returns next day opening time when after window closes', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T15:00:00'))
			const windows = [createWindow(8, 0, 14, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-15T08:00:00'))
		})
	})

	describe('midnight-spanning windows', () => {
		it('returns opening time when before evening open', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T20:00:00'))
			const windows = [createWindow(22, 0, 6, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T22:00:00'))
		})

		it('returns morning closing time when in evening portion', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T23:00:00'))
			const windows = [createWindow(22, 0, 6, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-15T06:00:00'))
		})

		it('returns morning closing time when in morning portion', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T03:00:00'))
			const windows = [createWindow(22, 0, 6, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T06:00:00'))
		})

		it('returns evening opening when in gap', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:00:00'))
			const windows = [createWindow(22, 0, 6, 0)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T22:00:00'))
		})
	})

	describe('multiple windows', () => {
		it('returns soonest change across all windows', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
			const windows = [
				createWindow(10, 0, 14, 0),
				createWindow(8, 0, 12, 0)
			]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T08:00:00'))
		})

		it('returns soonest closing time when inside multiple windows', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T11:00:00'))
			const windows = [
				createWindow(10, 0, 14, 0),
				createWindow(8, 0, 12, 0)
			]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T12:00:00'))
		})
	})

	describe('edge cases', () => {
		it('handles windows with minute precision', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T08:25:00'))
			const windows = [createWindow(8, 30, 14, 45)]

			const result = getNextOrderWindowChange(windows)

			expect(result).toEqual(new Date('2026-01-14T08:30:00'))
		})
	})
})

describe('isKioskDeactivated', () => {
	const createKiosk = (overrides: Partial<KioskType> = {}): KioskType => ({
		_id: 'kiosk1',
		name: 'Test Kiosk',
		kioskTag: 'TEST',
		readerId: null,
		enabledActivities: [],
		deactivated: false,
		deactivatedUntil: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns false for active kiosk with no deactivation', () => {
		const kiosk = createKiosk()
		expect(isKioskDeactivated(kiosk)).toBe(false)
	})

	it('returns true when deactivated is true', () => {
		const kiosk = createKiosk({ deactivated: true })
		expect(isKioskDeactivated(kiosk)).toBe(true)
	})

	it('returns true when deactivated is true even if deactivatedUntil is in past', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const kiosk = createKiosk({
			deactivated: true,
			deactivatedUntil: new Date('2026-01-14T08:00:00').toISOString()
		})
		expect(isKioskDeactivated(kiosk)).toBe(true)
	})

	it('returns true when deactivatedUntil is in future', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const kiosk = createKiosk({
			deactivatedUntil: new Date('2026-01-14T12:00:00').toISOString()
		})
		expect(isKioskDeactivated(kiosk)).toBe(true)
	})

	it('returns false when deactivatedUntil is in past', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const kiosk = createKiosk({
			deactivatedUntil: new Date('2026-01-14T08:00:00').toISOString()
		})
		expect(isKioskDeactivated(kiosk)).toBe(false)
	})

	it('returns false when deactivatedUntil is exactly now', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const kiosk = createKiosk({
			deactivatedUntil: new Date('2026-01-14T10:00:00').toISOString()
		})
		expect(isKioskDeactivated(kiosk)).toBe(false)
	})

	it('returns true 1ms before deactivatedUntil expires', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T09:59:59.999'))
		const kiosk = createKiosk({
			deactivatedUntil: new Date('2026-01-14T10:00:00').toISOString()
		})
		expect(isKioskDeactivated(kiosk)).toBe(true)
	})

	it('returns false 1ms after deactivatedUntil expires', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00.001'))
		const kiosk = createKiosk({
			deactivatedUntil: new Date('2026-01-14T10:00:00').toISOString()
		})
		expect(isKioskDeactivated(kiosk)).toBe(false)
	})

	it('handles null deactivatedUntil', () => {
		const kiosk = createKiosk({ deactivatedUntil: null })
		expect(isKioskDeactivated(kiosk)).toBe(false)
	})
})

describe('getNextOpen', () => {
	const createProduct = (
		id: string,
		isActive: boolean,
		fromHour: number,
		toHour: number,
		fromMinute = 0,
		toMinute = 0
	): ProductType => ({
		_id: id,
		name: `Product ${id}`,
		price: 100,
		isActive,
		orderWindow: {
			from: { hour: fromHour, minute: fromMinute },
			to: { hour: toHour, minute: toMinute }
		},
		options: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	})

	const createKiosk = (overrides: Partial<KioskType> = {}): KioskType => ({
		_id: 'kiosk1',
		name: 'Test Kiosk',
		kioskTag: 'TEST',
		readerId: null,
		enabledActivities: [],
		deactivated: false,
		deactivatedUntil: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides
	})

	const createConfig = (disabledWeekdays: number[] = []): ConfigsType => ({
		_id: 'config1',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		configs: { disabledWeekdays }
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('guard clauses', () => {
		it('returns null when configs is null', () => {
			const kiosk = createKiosk()
			const products = [createProduct('p1', true, 8, 14)]

			expect(getNextOpen(null, kiosk, products)).toBeNull()
		})

		it('returns null when kiosk is null', () => {
			const config = createConfig()
			const products = [createProduct('p1', true, 8, 14)]

			expect(getNextOpen(config, null, products)).toBeNull()
		})

		it('returns null when products array is empty', () => {
			const config = createConfig()
			const kiosk = createKiosk()

			expect(getNextOpen(config, kiosk, [])).toBeNull()
		})

		it('returns null when kiosk is permanently deactivated', () => {
			const config = createConfig()
			const kiosk = createKiosk({ deactivated: true })
			const products = [createProduct('p1', true, 8, 14)]

			expect(getNextOpen(config, kiosk, products)).toBeNull()
		})

		it('returns null when all weekdays are disabled', () => {
			const config = createConfig([0, 1, 2, 3, 4, 5, 6])
			const kiosk = createKiosk()
			const products = [createProduct('p1', true, 8, 14)]

			expect(getNextOpen(config, kiosk, products)).toBeNull()
		})

		it('returns null when all products are inactive', () => {
			const config = createConfig()
			const kiosk = createKiosk()
			const products = [
				createProduct('p1', false, 8, 14),
				createProduct('p2', false, 10, 16)
			]

			expect(getNextOpen(config, kiosk, products)).toBeNull()
		})
	})

	describe('basic scenarios', () => {
		it('returns next product opening when kiosk is currently closed', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))

			const config = createConfig()
			const kiosk = createKiosk()
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-14T08:00:00'))
		})

		it('returns current time when kiosk is currently open', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const config = createConfig()
			const kiosk = createKiosk()
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-14T10:00:00'))
		})

		it('returns next day opening when after all windows today', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T15:00:00'))

			const config = createConfig()
			const kiosk = createKiosk()
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-15T08:00:00'))
		})
	})

	describe('disabled weekdays', () => {
		it('skips disabled weekdays to find next open', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-17T10:00:00'))

			const config = createConfig([0, 6])
			const kiosk = createKiosk()
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result?.getDay()).not.toBe(0)
			expect(result?.getDay()).not.toBe(6)
		})
	})

	describe('deactivatedUntil scenarios', () => {
		it('returns deactivatedUntil time when within product window', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T09:00:00'))

			const config = createConfig()
			const deactivatedUntil = new Date('2026-01-14T11:00:00').toISOString()
			const kiosk = createKiosk({ deactivatedUntil })
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-14T11:00:00'))
		})

		it('returns next product opening when deactivatedUntil is after window closes', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T09:00:00'))

			const config = createConfig()
			const deactivatedUntil = new Date('2026-01-14T15:00:00').toISOString()
			const kiosk = createKiosk({ deactivatedUntil })
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-15T08:00:00'))
		})
	})

	describe('multiple products', () => {
		it('returns earliest opening across multiple products', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))

			const config = createConfig()
			const kiosk = createKiosk()
			const products = [
				createProduct('p1', true, 10, 14),
				createProduct('p2', true, 8, 12),
				createProduct('p3', true, 12, 16)
			]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-14T08:00:00'))
		})

		it('ignores inactive products when finding next open', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))

			const config = createConfig()
			const kiosk = createKiosk()
			const products = [
				createProduct('p1', false, 6, 10),
				createProduct('p2', true, 8, 14)
			]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-14T08:00:00'))
		})

		it('sorts products by minute when hours are equal', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))

			const config = createConfig()
			const kiosk = createKiosk()
			const products = [
				createProduct('p1', true, 8, 14, 45),
				createProduct('p2', true, 8, 12, 15),
				createProduct('p3', true, 8, 10, 30)
			]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-14T08:15:00'))
		})
	})

	describe('deactivatedUntil on different day edge cases', () => {
		it('updates original search day when deactivatedUntil is on a different day', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const config = createConfig()
			const deactivatedUntil = new Date('2026-01-15T09:00:00').toISOString()
			const kiosk = createKiosk({ deactivatedUntil })
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-01-15T09:00:00'))
		})

		it('updates original search day when deactivatedUntil month differs', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-31T10:00:00'))

			const config = createConfig()
			const deactivatedUntil = new Date('2026-02-01T09:00:00').toISOString()
			const kiosk = createKiosk({ deactivatedUntil })
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2026-02-01T09:00:00'))
		})

		it('updates original search day when deactivatedUntil year differs', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-12-31T10:00:00'))

			const config = createConfig()
			const deactivatedUntil = new Date('2027-01-01T09:00:00').toISOString()
			const kiosk = createKiosk({ deactivatedUntil })
			const products = [createProduct('p1', true, 8, 14)]

			const result = getNextOpen(config, kiosk, products)

			expect(result).toEqual(new Date('2027-01-01T09:00:00'))
		})
	})
})

describe('getNextOrderWindowChange edge cases', () => {
	const createWindow = (fromHour: number, fromMinute: number, toHour: number, toMinute: number): OrderWindow => ({
		from: { hour: fromHour, minute: fromMinute },
		to: { hour: toHour, minute: toMinute }
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('handles non-zero same from and to (midnight spanning edge case)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:00:00'))
		const windows = [createWindow(12, 30, 12, 30)]

		const result = getNextOrderWindowChange(windows)

		expect(result).not.toBeNull()
	})

	it('handles window starting at midnight (00:00)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T23:30:00'))
		const windows = [createWindow(0, 0, 6, 0)]

		const result = getNextOrderWindowChange(windows)

		expect(result).toEqual(new Date('2026-01-15T00:00:00'))
	})

	it('handles window ending at midnight (00:00 next day)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T22:00:00'))
		const windows = [createWindow(20, 0, 0, 0)]

		const result = getNextOrderWindowChange(windows)

		expect(result).toEqual(new Date('2026-01-15T00:00:00'))
	})

	it('handles many overlapping windows efficiently', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const windows = Array.from({ length: 100 }, (_, i) =>
			createWindow(8 + (i % 10), i % 60, 14 + (i % 6), i % 60)
		)

		const start = performance.now()
		const result = getNextOrderWindowChange(windows)
		const duration = performance.now() - start

		expect(result).not.toBeNull()
		expect(duration).toBeLessThan(100)
	})

	it('handles identical windows (duplicates)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const windows = [
			createWindow(8, 0, 14, 0),
			createWindow(8, 0, 14, 0),
			createWindow(8, 0, 14, 0)
		]

		const result = getNextOrderWindowChange(windows)

		expect(result).toEqual(new Date('2026-01-14T14:00:00'))
	})
})

describe('timeSince', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns seconds for very recent times', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:30'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('30 sekunder siden')
	})

	it('returns singular second', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:01'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('1 sekund siden')
	})

	it('returns minutes for times a few minutes ago', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:05:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('5 minutter siden')
	})

	it('returns singular minute', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:01:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('1 minut siden')
	})

	it('returns hours and minutes', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:30:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('2 timer og 30 minutter siden')
	})

	it('returns singular hour', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T11:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('1 time siden')
	})

	it('returns hours without minutes when exact hours', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T13:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('3 timer siden')
	})

	it('returns days and hours', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-16T14:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('2 dage og 4 timer siden')
	})

	it('returns singular day', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-15T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('1 dag siden')
	})

	it('returns days without hours when exact days', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-17T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('3 dage siden')
	})

	it('returns months and days', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-03-24T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('2 måneder og 9 dage siden')
	})

	it('returns singular month', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-02-13T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('1 måned siden')
	})

	it('returns months without days when exact months', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-04-14T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('3 måneder siden')
	})

	it('returns years and months', () => {
		jest.useFakeTimers().setSystemTime(new Date('2028-03-14T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('2 år og 2 måneder siden')
	})

	it('returns singular year', () => {
		jest.useFakeTimers().setSystemTime(new Date('2027-01-14T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('1 år siden')
	})

	it('returns years without months when exact years', () => {
		jest.useFakeTimers().setSystemTime(new Date('2029-01-14T10:00:00'))
		const result = timeSince('2026-01-14T10:00:00')
		expect(result).toBe('3 år siden')
	})

	it('handles future dates (clamps to 0 seconds)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeSince('2026-01-14T10:05:00')
		expect(result).toBe('0 sekunder siden')
	})
})

describe('timeUntil', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns expired for past dates', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:05:00'))
		const result = timeUntil('2026-01-14T10:00:00')
		expect(result).toBe('Udløbet')
	})

	it('returns expired when date is exactly now', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T10:00:00')
		expect(result).toBe('Udløbet')
	})

	it('returns seconds for very soon times', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T10:00:30')
		expect(result).toBe('om 30 sekunder')
	})

	it('returns singular second', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T10:00:01')
		expect(result).toBe('om 1 sekund')
	})

	it('returns minutes for times a few minutes away', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T10:05:00')
		expect(result).toBe('om 5 minutter')
	})

	it('returns singular minute', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T10:01:00')
		expect(result).toBe('om 1 minut')
	})

	it('returns hours and minutes', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T12:30:00')
		expect(result).toBe('om 2 timer og 30 minutter')
	})

	it('returns singular hour', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T11:00:00')
		expect(result).toBe('om 1 time')
	})

	it('returns hours without minutes when exact hours', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-14T13:00:00')
		expect(result).toBe('om 3 timer')
	})

	it('returns days and hours', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-16T14:00:00')
		expect(result).toBe('om 2 dage og 4 timer')
	})

	it('returns singular day', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-15T10:00:00')
		expect(result).toBe('om 1 dag')
	})

	it('returns days without hours when exact days', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-01-17T10:00:00')
		expect(result).toBe('om 3 dage')
	})

	it('returns months and days', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-03-24T10:00:00')
		expect(result).toBe('om 2 måneder og 9 dage')
	})

	it('returns singular month', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-02-13T10:00:00')
		expect(result).toBe('om 1 måned')
	})

	it('returns months without days when exact months', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2026-04-14T10:00:00')
		expect(result).toBe('om 3 måneder')
	})

	it('returns years and months', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2028-03-14T10:00:00')
		expect(result).toBe('om 2 år og 2 måneder')
	})

	it('returns singular year', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2027-01-14T10:00:00')
		expect(result).toBe('om 1 år')
	})

	it('returns years without months when exact years', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = timeUntil('2029-01-14T10:00:00')
		expect(result).toBe('om 3 år')
	})

	it('accepts number timestamp', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const futureTimestamp = new Date('2026-01-14T10:05:00').valueOf()
		const result = timeUntil(futureTimestamp)
		expect(result).toBe('om 5 minutter')
	})
})

describe('sortProductsByOrderWindowFrom', () => {
	const createProduct = (id: string, fromHour: number, fromMinute: number): ProductType => ({
		_id: id,
		name: `Product ${id}`,
		price: 100,
		isActive: true,
		orderWindow: {
			from: { hour: fromHour, minute: fromMinute },
			to: { hour: 23, minute: 0 }
		},
		options: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	})

	it('sorts products by order window from time ascending', () => {
		const products = [
			createProduct('p3', 12, 0),
			createProduct('p1', 8, 0),
			createProduct('p2', 10, 30)
		]

		const sorted = sortProductsByOrderWindowFrom(products)

		expect(sorted.map(p => p._id)).toEqual(['p1', 'p2', 'p3'])
	})

	it('considers minutes when hours are equal', () => {
		const products = [
			createProduct('p2', 8, 30),
			createProduct('p1', 8, 0),
			createProduct('p3', 8, 45)
		]

		const sorted = sortProductsByOrderWindowFrom(products)

		expect(sorted.map(p => p._id)).toEqual(['p1', 'p2', 'p3'])
	})

	it('handles products with null order window', () => {
		const p1 = createProduct('p1', 8, 0)
		const p2: ProductType = {
			...createProduct('p2', 12, 0),
			orderWindow: undefined as unknown as ProductType['orderWindow']
		}

		const sorted = sortProductsByOrderWindowFrom([p2, p1])

		expect(sorted[0]._id).toBe('p1')
	})

	it('handles empty array', () => {
		const sorted = sortProductsByOrderWindowFrom([])
		expect(sorted).toEqual([])
	})

	it('handles single product', () => {
		const products = [createProduct('p1', 8, 0)]
		const sorted = sortProductsByOrderWindowFrom(products)
		expect(sorted.map(p => p._id)).toEqual(['p1'])
	})
})

describe('sortProductsByOrderWindowTo', () => {
	const createProduct = (id: string, toHour: number, toMinute: number): ProductType => ({
		_id: id,
		name: `Product ${id}`,
		price: 100,
		isActive: true,
		orderWindow: {
			from: { hour: 0, minute: 0 },
			to: { hour: toHour, minute: toMinute }
		},
		options: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	})

	it('sorts products by order window to time ascending', () => {
		const products = [
			createProduct('p3', 18, 0),
			createProduct('p1', 12, 0),
			createProduct('p2', 14, 30)
		]

		const sorted = sortProductsByOrderWindowTo(products)

		expect(sorted.map(p => p._id)).toEqual(['p1', 'p2', 'p3'])
	})

	it('considers minutes when hours are equal', () => {
		const products = [
			createProduct('p2', 14, 30),
			createProduct('p1', 14, 0),
			createProduct('p3', 14, 45)
		]

		const sorted = sortProductsByOrderWindowTo(products)

		expect(sorted.map(p => p._id)).toEqual(['p1', 'p2', 'p3'])
	})

	it('handles products with null order window', () => {
		const p1 = createProduct('p1', 14, 0)
		const p2: ProductType = {
			...createProduct('p2', 18, 0),
			orderWindow: undefined as unknown as ProductType['orderWindow']
		}

		const sorted = sortProductsByOrderWindowTo([p2, p1])

		expect(sorted[0]._id).toBe('p1')
	})

	it('handles empty array', () => {
		const sorted = sortProductsByOrderWindowTo([])
		expect(sorted).toEqual([])
	})
})

describe('getTimeStringFromOrderWindowTime', () => {
	it('formats single digit hours with leading zero', () => {
		const time: Time = { hour: 8, minute: 30 }
		expect(getTimeStringFromOrderWindowTime(time)).toBe('08:30')
	})

	it('formats single digit minutes with leading zero', () => {
		const time: Time = { hour: 14, minute: 5 }
		expect(getTimeStringFromOrderWindowTime(time)).toBe('14:05')
	})

	it('formats midnight correctly', () => {
		const time: Time = { hour: 0, minute: 0 }
		expect(getTimeStringFromOrderWindowTime(time)).toBe('00:00')
	})

	it('formats end of day correctly', () => {
		const time: Time = { hour: 23, minute: 59 }
		expect(getTimeStringFromOrderWindowTime(time)).toBe('23:59')
	})

	it('formats double digit hours and minutes correctly', () => {
		const time: Time = { hour: 12, minute: 45 }
		expect(getTimeStringFromOrderWindowTime(time)).toBe('12:45')
	})
})

describe('getNextAvailableProductOrderWindowFrom', () => {
	const createProduct = (
		id: string,
		isActive: boolean,
		fromHour: number,
		fromMinute: number
	): ProductType => ({
		_id: id,
		name: `Product ${id}`,
		price: 100,
		isActive,
		orderWindow: {
			from: { hour: fromHour, minute: fromMinute },
			to: { hour: 23, minute: 0 }
		},
		options: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns null for empty products array', () => {
		expect(getNextAvailableProductOrderWindowFrom([])).toBeNull()
	})

	it('returns null when all products are inactive', () => {
		const products = [
			createProduct('p1', false, 8, 0),
			createProduct('p2', false, 10, 0)
		]
		expect(getNextAvailableProductOrderWindowFrom(products)).toBeNull()
	})

	it('returns soonest upcoming product opening today', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
		const products = [
			createProduct('p1', true, 10, 0),
			createProduct('p2', true, 8, 0)
		]

		const result = getNextAvailableProductOrderWindowFrom(products)

		expect(result).not.toBeNull()
		expect(result?.product._id).toBe('p2')
		expect(result?.from).toEqual({ hour: 8, minute: 0 })
		expect(result?.date).toEqual(new Date('2026-01-14T08:00:00'))
	})

	it('returns tomorrow when all openings have passed today', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T15:00:00'))
		const products = [
			createProduct('p1', true, 10, 0),
			createProduct('p2', true, 8, 0)
		]

		const result = getNextAvailableProductOrderWindowFrom(products)

		expect(result).not.toBeNull()
		expect(result?.date).toEqual(new Date('2026-01-15T08:00:00'))
	})

	it('returns today opening when exactly at from time', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T08:00:00'))
		const products = [createProduct('p1', true, 8, 0)]

		const result = getNextAvailableProductOrderWindowFrom(products)

		expect(result?.date).toEqual(new Date('2026-01-15T08:00:00'))
	})

	it('handles minute-level precision', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T08:29:00'))
		const products = [createProduct('p1', true, 8, 30)]

		const result = getNextAvailableProductOrderWindowFrom(products)

		expect(result?.date).toEqual(new Date('2026-01-14T08:30:00'))
	})

	it('skips inactive products', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
		const products = [
			createProduct('p1', false, 6, 0),
			createProduct('p2', true, 10, 0)
		]

		const result = getNextAvailableProductOrderWindowFrom(products)

		expect(result?.product._id).toBe('p2')
	})
})

describe('formatRelativeDateLabel', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns "Ukendt dato" for null', () => {
		expect(formatRelativeDateLabel(null)).toBe('Ukendt dato')
	})

	it('returns "i dag" with time for today', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2026-01-14T14:30:00'))
		expect(result).toBe('i dag kl. 14:30')
	})

	it('returns "i morgen" with time for tomorrow', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2026-01-15T09:45:00'))
		expect(result).toBe('i morgen kl. 09:45')
	})

	it('returns full date when year differs from today', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2027-01-14T14:30:00'))
		expect(result).toMatch(/Thursday d\. 14\/01 kl\. 14:30/)
	})

	it('returns full date when month differs from today (same year)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2026-02-14T14:30:00'))
		expect(result).toMatch(/Saturday d\. 14\/02 kl\. 14:30/)
	})

	it('returns full date when day differs from today (same year and month)', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2026-01-16T14:30:00'))
		expect(result).toMatch(/Friday d\. 16\/01 kl\. 14:30/)
	})

	it('returns full date for other days', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2026-01-20T14:30:00'))
		expect(result).toMatch(/Tuesday d\. 20\/01 kl\. 14:30/)
	})

	it('handles string date input', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel('2026-01-14T14:30:00')
		expect(result).toBe('i dag kl. 14:30')
	})

	it('handles midnight correctly', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const result = formatRelativeDateLabel(new Date('2026-01-14T00:00:00'))
		expect(result).toBe('i dag kl. 00:00')
	})
})

describe('formatFullDateLabel', () => {
	it('formats date with weekday and time', () => {
		const result = formatFullDateLabel(new Date('2026-01-14T14:30:00'))
		expect(result).toMatch(/Wednesday d\. 14\/01 kl\. 14:30/)
	})

	it('capitalizes first letter', () => {
		const result = formatFullDateLabel(new Date('2026-01-14T14:30:00'))
		expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase())
	})

	it('handles midnight correctly', () => {
		const result = formatFullDateLabel(new Date('2026-01-14T00:00:00'))
		expect(result).toMatch(/kl\. 00:00/)
	})

	it('handles different weekdays', () => {
		const monday = formatFullDateLabel(new Date('2026-01-12T10:00:00'))
		const friday = formatFullDateLabel(new Date('2026-01-16T10:00:00'))

		expect(monday).toMatch(/Monday/)
		expect(friday).toMatch(/Friday/)
	})
})
