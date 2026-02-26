import { type ProductType, type ActivityType, type KioskType, type ConfigsType } from '@/types/backendDataTypes'

import {
	filterAvailableActivities,
	filterAvailableProducts,
	isKioskCurrentlyClosed
} from './kioskAvailability'

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
	imageURL: undefined,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString()
})

const createActivity = (id: string, disabledProducts: string[] = []): ActivityType => ({
	_id: id,
	name: `Activity ${id}`,
	disabledProducts,
	enabledRooms: [],
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString()
})

const createKiosk = (enabledActivities: string[]): KioskType => ({
	_id: 'kiosk1',
	name: 'Test Kiosk',
	kioskTag: 'TEST',
	readerId: null,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	deactivated: false,
	deactivatedUntil: null,
	enabledActivities
})

const createConfig = (disabledWeekdays: number[] = []): ConfigsType => ({
	_id: 'config1',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	configs: {
		kioskInactivityTimeoutMs: 30000,
		kioskInactivityTimeoutWarningMs: 10000,
		kioskOrderConfirmationTimeoutMs: 5000,
		disabledWeekdays,
		kioskPassword: 'test',
		kioskFeedbackBannerDelayMs: 5000,
		kioskWelcomeMessage: 'Welcome',
		kioskReloadMsSinceMidnight: 0
	}
})

describe('filterAvailableProducts', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns empty array for empty input', () => {
		expect(filterAvailableProducts([])).toEqual([])
	})

	it('filters out inactive products', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const products = [
			createProduct('1', true, 8, 14),
			createProduct('2', false, 8, 14)
		]

		const result = filterAvailableProducts(products)

		expect(result).toHaveLength(1)
		expect(result[0]._id).toBe('1')
	})

	it('filters out products outside order window', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const products = [
			createProduct('1', true, 8, 14),
			createProduct('2', true, 15, 20)
		]

		const result = filterAvailableProducts(products)

		expect(result).toHaveLength(1)
		expect(result[0]._id).toBe('1')
	})

	it('includes products within order window', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:00:00'))

		const products = [
			createProduct('1', true, 8, 14),
			createProduct('2', true, 10, 16)
		]

		const result = filterAvailableProducts(products)

		expect(result).toHaveLength(2)
	})

	it('filters out product that is both inactive and outside window', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const products = [
			createProduct('1', true, 8, 14),
			createProduct('2', false, 15, 20)
		]

		const result = filterAvailableProducts(products)

		expect(result).toHaveLength(1)
		expect(result[0]._id).toBe('1')
	})

	it('preserves product order from input', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const products = [
			createProduct('z', true, 8, 14),
			createProduct('a', true, 8, 14),
			createProduct('m', true, 8, 14)
		]

		const result = filterAvailableProducts(products)

		expect(result.map(p => p._id)).toEqual(['z', 'a', 'm'])
	})

	it('updates availability when time changes', () => {
		const products = [
			createProduct('1', true, 8, 14),
			createProduct('2', true, 15, 20)
		]

		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['1'])

		jest.setSystemTime(new Date('2026-01-14T16:00:00'))
		expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['2'])

		jest.setSystemTime(new Date('2026-01-14T14:30:00'))
		expect(filterAvailableProducts(products)).toEqual([])
	})
})

describe('filterAvailableActivities', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns empty array when kiosk is null', () => {
		const activities = [createActivity('a1')]
		const products = [createProduct('1', true, 8, 14)]

		expect(filterAvailableActivities(activities, null, products)).toEqual([])
	})

	it('filters out activities not enabled on kiosk', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const activities = [
			createActivity('a1'),
			createActivity('a2')
		]
		const kiosk = createKiosk(['a1'])
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities(activities, kiosk, products)

		expect(result).toHaveLength(1)
		expect(result[0]._id).toBe('a1')
	})

	it('filters out activities with no available products', () => {
		const activities = [
			createActivity('a1', ['1']),
			createActivity('a2', [])
		]
		const kiosk = createKiosk(['a1', 'a2'])
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities(activities, kiosk, products)

		expect(result).toHaveLength(1)
		expect(result[0]._id).toBe('a2')
	})

	it('includes activities with at least one available product', () => {
		const activities = [
			createActivity('a1', ['1']),
			createActivity('a2', ['2'])
		]
		const kiosk = createKiosk(['a1', 'a2'])
		const products = [
			createProduct('1', true, 8, 14),
			createProduct('2', true, 8, 14)
		]

		const result = filterAvailableActivities(activities, kiosk, products)

		expect(result).toHaveLength(2)
	})

	it('sorts activities alphabetically by name', () => {
		const activities = [
			{ ...createActivity('a1'), name: 'Zebra' },
			{ ...createActivity('a2'), name: 'Apple' },
			{ ...createActivity('a3'), name: 'Mango' }
		]
		const kiosk = createKiosk(['a1', 'a2', 'a3'])
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities(activities, kiosk, products)

		expect(result.map(a => a.name)).toEqual(['Apple', 'Mango', 'Zebra'])
	})

	it('handles kiosk with undefined enabledActivities gracefully', () => {
		const activities = [createActivity('a1'), createActivity('a2')]
		const kiosk = { ...createKiosk([]), enabledActivities: undefined as unknown as string[] }
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities(activities, kiosk, products)

		expect(result).toEqual([])
	})

	it('handles empty activities array', () => {
		const kiosk = createKiosk(['a1', 'a2'])
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities([], kiosk, products)

		expect(result).toEqual([])
	})

	it('handles empty available products array', () => {
		const activities = [createActivity('a1')]
		const kiosk = createKiosk(['a1'])

		const result = filterAvailableActivities(activities, kiosk, [])

		expect(result).toEqual([])
	})

	it('sorts activities with special characters using localeCompare', () => {
		const activities = [
			{ ...createActivity('a1'), name: 'Øl' },
			{ ...createActivity('a2'), name: 'Æble' },
			{ ...createActivity('a3'), name: 'Appelsin' },
			{ ...createActivity('a4'), name: 'Åben' }
		]
		const kiosk = createKiosk(['a1', 'a2', 'a3', 'a4'])
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities(activities, kiosk, products)

		const expectedOrder = [...activities].sort((a, b) => a.name.localeCompare(b.name)).map(a => a.name)
		expect(result.map(a => a.name)).toEqual(expectedOrder)
	})

	it('handles case-sensitive sorting', () => {
		const activities = [
			{ ...createActivity('a1'), name: 'zebra' },
			{ ...createActivity('a2'), name: 'Apple' },
			{ ...createActivity('a3'), name: 'apple' }
		]
		const kiosk = createKiosk(['a1', 'a2', 'a3'])
		const products = [createProduct('1', true, 8, 14)]

		const result = filterAvailableActivities(activities, kiosk, products)

		expect(result[0].name.toLowerCase()).toBe('apple')
		expect(result[result.length - 1].name).toBe('zebra')
	})
})

describe('isKioskCurrentlyClosed', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('returns true when kiosk is null', () => {
		const config = createConfig()
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(null, config, products)).toBe(true)
	})

	it('returns true when config is null', () => {
		const kiosk = createKiosk(['a1'])
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(kiosk, null, products)).toBe(true)
	})

	it('returns true when kiosk is deactivated', () => {
		const kiosk = { ...createKiosk(['a1']), deactivated: true }
		const config = createConfig()
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(kiosk, config, products)).toBe(true)
	})

	it('returns true when kiosk is deactivated until future time', () => {
		const futureDate = new Date(Date.now() + 3600000).toISOString()
		const kiosk = { ...createKiosk(['a1']), deactivatedUntil: futureDate }
		const config = createConfig()
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(kiosk, config, products)).toBe(true)
	})

	it('returns false when kiosk deactivatedUntil is in the past', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const pastDate = new Date('2026-01-14T09:00:00').toISOString()
		const kiosk = { ...createKiosk(['a1']), deactivatedUntil: pastDate }
		const config = createConfig()
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(kiosk, config, products)).toBe(false)
	})

	it('returns true when no products are available', () => {
		const kiosk = createKiosk(['a1'])
		const config = createConfig()

		expect(isKioskCurrentlyClosed(kiosk, config, [])).toBe(true)
	})

	it('returns true when current weekday is disabled', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const kiosk = createKiosk(['a1'])
		const config = createConfig([3])
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(kiosk, config, products)).toBe(true)
	})

	it('returns false when kiosk is active with available products on enabled day', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const kiosk = createKiosk(['a1'])
		const config = createConfig([0, 6])
		const products = [createProduct('1', true, 8, 14)]

		expect(isKioskCurrentlyClosed(kiosk, config, products)).toBe(false)
	})
})

describe('integration: product availability affects activity availability', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('activities become unavailable when their only product window closes', () => {
		const products = [
			createProduct('morning', true, 8, 12),
			createProduct('afternoon', true, 13, 17)
		]
		const activities = [
			createActivity('breakfast', ['afternoon']),
			createActivity('lunch', ['morning'])
		]
		const kiosk = createKiosk(['breakfast', 'lunch'])

		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		const morningProducts = filterAvailableProducts(products)
		const morningActivities = filterAvailableActivities(activities, kiosk, morningProducts)
		expect(morningActivities.map(a => a._id)).toEqual(['breakfast'])

		jest.setSystemTime(new Date('2026-01-14T14:00:00'))
		const afternoonProducts = filterAvailableProducts(products)
		const afternoonActivities = filterAvailableActivities(activities, kiosk, afternoonProducts)
		expect(afternoonActivities.map(a => a._id)).toEqual(['lunch'])
	})
})

describe('product order window transitions', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	describe('products coming into view', () => {
		it('product becomes available exactly when window opens', () => {
			const products = [createProduct('p1', true, 10, 14)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T09:59:59'))
			expect(filterAvailableProducts(products)).toHaveLength(0)

			jest.setSystemTime(new Date('2026-01-14T10:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)
		})

		it('product with minute precision becomes available at exact time', () => {
			const products = [createProduct('p1', true, 10, 14, 30, 45)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:29:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)

			jest.setSystemTime(new Date('2026-01-14T10:30:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)
		})

		it('multiple products with staggered openings appear in sequence', () => {
			const products = [
				createProduct('p1', true, 8, 20),
				createProduct('p2', true, 10, 20),
				createProduct('p3', true, 12, 20)
			]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual([])

			jest.setSystemTime(new Date('2026-01-14T08:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1'])

			jest.setSystemTime(new Date('2026-01-14T10:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1', 'p2'])

			jest.setSystemTime(new Date('2026-01-14T12:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1', 'p2', 'p3'])
		})
	})

	describe('products going out of view', () => {
		it('product becomes unavailable exactly when window closes', () => {
			const products = [createProduct('p1', true, 8, 14)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T13:59:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T14:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)
		})

		it('product with minute precision closes at exact time', () => {
			const products = [createProduct('p1', true, 8, 14, 0, 30)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T14:29:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T14:30:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)
		})

		it('multiple products with staggered closings disappear in sequence', () => {
			const products = [
				createProduct('p1', true, 8, 12),
				createProduct('p2', true, 8, 14),
				createProduct('p3', true, 8, 16)
			]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T11:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1', 'p2', 'p3'])

			jest.setSystemTime(new Date('2026-01-14T12:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p2', 'p3'])

			jest.setSystemTime(new Date('2026-01-14T14:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p3'])

			jest.setSystemTime(new Date('2026-01-14T16:00:00'))
			expect(filterAvailableProducts(products)).toEqual([])
		})
	})

	describe('midnight-spanning windows', () => {
		it('product spanning midnight is available in evening', () => {
			const products = [createProduct('night', true, 22, 6)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T23:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)
		})

		it('product spanning midnight is available in early morning', () => {
			const products = [createProduct('night', true, 22, 6)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T03:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)
		})

		it('product spanning midnight is unavailable during day gap', () => {
			const products = [createProduct('night', true, 22, 6)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T12:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)
		})

		it('product spanning midnight opens at evening time', () => {
			const products = [createProduct('night', true, 22, 6)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T21:59:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)

			jest.setSystemTime(new Date('2026-01-14T22:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)
		})

		it('product spanning midnight closes at morning time', () => {
			const products = [createProduct('night', true, 22, 6)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T05:59:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T06:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)
		})
	})

	describe('overlapping windows', () => {
		it('handles multiple overlapping windows correctly', () => {
			const products = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 10, 16),
				createProduct('p3', true, 12, 18)
			]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T09:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1'])

			jest.setSystemTime(new Date('2026-01-14T11:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1', 'p2'])

			jest.setSystemTime(new Date('2026-01-14T13:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p1', 'p2', 'p3'])

			jest.setSystemTime(new Date('2026-01-14T15:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p2', 'p3'])

			jest.setSystemTime(new Date('2026-01-14T17:00:00'))
			expect(filterAvailableProducts(products).map(p => p._id)).toEqual(['p3'])
		})
	})
})

describe('activity availability transitions', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	describe('activities coming into view', () => {
		it('activity becomes available when its first product window opens', () => {
			const products = [
				createProduct('morning', true, 8, 12),
				createProduct('afternoon', true, 14, 18)
			]
			const activities = [createActivity('activity1', ['afternoon'])]
			const kiosk = createKiosk(['activity1'])

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
			let availableProducts = filterAvailableProducts(products)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(0)

			jest.setSystemTime(new Date('2026-01-14T08:00:00'))
			availableProducts = filterAvailableProducts(products)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(1)
		})

		it('activity becomes available when kiosk enables it', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [createProduct('p1', true, 8, 14)]
			const activities = [createActivity('a1'), createActivity('a2')]
			const availableProducts = filterAvailableProducts(products)

			const kiosk1 = createKiosk(['a1'])
			expect(filterAvailableActivities(activities, kiosk1, availableProducts).map(a => a._id)).toEqual(['a1'])

			const kiosk2 = createKiosk(['a1', 'a2'])
			expect(filterAvailableActivities(activities, kiosk2, availableProducts).map(a => a._id)).toEqual(['a1', 'a2'])
		})
	})

	describe('activities going out of view', () => {
		it('activity becomes unavailable when its only product window closes', () => {
			const products = [createProduct('p1', true, 8, 14)]
			const activities = [createActivity('a1')]
			const kiosk = createKiosk(['a1'])

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T13:00:00'))
			let availableProducts = filterAvailableProducts(products)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T14:00:00'))
			availableProducts = filterAvailableProducts(products)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(0)
		})

		it('activity becomes unavailable when kiosk disables it', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [createProduct('p1', true, 8, 14)]
			const activities = [createActivity('a1'), createActivity('a2')]
			const availableProducts = filterAvailableProducts(products)

			const kioskBefore = createKiosk(['a1', 'a2'])
			expect(filterAvailableActivities(activities, kioskBefore, availableProducts)).toHaveLength(2)

			const kioskAfter = createKiosk(['a1'])
			expect(filterAvailableActivities(activities, kioskAfter, availableProducts).map(a => a._id)).toEqual(['a1'])
		})

		it('activity becomes unavailable when all its products are disabled', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = createKiosk(['a1'])
			const activities = [createActivity('a1', ['p2'])]

			const productsBefore = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 8, 14)
			]
			let availableProducts = filterAvailableProducts(productsBefore)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(1)

			const productsAfter = [
				createProduct('p1', false, 8, 14),
				createProduct('p2', true, 8, 14)
			]
			availableProducts = filterAvailableProducts(productsAfter)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(0)
		})
	})

	describe('activity with multiple products', () => {
		it('activity remains available as long as one product is available', () => {
			const products = [
				createProduct('p1', true, 8, 12),
				createProduct('p2', true, 10, 14),
				createProduct('p3', true, 12, 16)
			]
			const activities = [createActivity('a1')]
			const kiosk = createKiosk(['a1'])

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T08:00:00'))
			expect(filterAvailableActivities(activities, kiosk, filterAvailableProducts(products))).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T13:00:00'))
			expect(filterAvailableActivities(activities, kiosk, filterAvailableProducts(products))).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T15:00:00'))
			expect(filterAvailableActivities(activities, kiosk, filterAvailableProducts(products))).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-14T16:00:00'))
			expect(filterAvailableActivities(activities, kiosk, filterAvailableProducts(products))).toHaveLength(0)
		})

		it('activity with some disabled products still works with remaining products', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 8, 14),
				createProduct('p3', true, 8, 14)
			]
			const activities = [createActivity('a1', ['p1', 'p2'])]
			const kiosk = createKiosk(['a1'])

			const availableProducts = filterAvailableProducts(products)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(1)
		})

		it('activity with all products disabled becomes unavailable', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 8, 14)
			]
			const activities = [createActivity('a1', ['p1', 'p2'])]
			const kiosk = createKiosk(['a1'])

			const availableProducts = filterAvailableProducts(products)
			expect(filterAvailableActivities(activities, kiosk, availableProducts)).toHaveLength(0)
		})
	})
})

describe('kiosk open/close transitions', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	describe('kiosk opening', () => {
		it('kiosk opens when first product window opens', () => {
			const kiosk = createKiosk(['a1'])
			const config = createConfig()

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T07:00:00'))
			const products = [createProduct('p1', true, 8, 14)]
			let availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(true)

			jest.setSystemTime(new Date('2026-01-14T08:00:00'))
			availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(false)
		})

		it('kiosk opens when deactivatedUntil time passes', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T09:00:00'))

			const config = createConfig()
			const products = [createProduct('p1', true, 8, 14)]
			const availableProducts = filterAvailableProducts(products)
			const deactivatedUntil = new Date('2026-01-14T10:00:00').toISOString()
			const kiosk = { ...createKiosk(['a1']), deactivatedUntil }

			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(true)

			jest.setSystemTime(new Date('2026-01-14T10:00:01'))
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(false)
		})

		it('kiosk opens when weekday becomes enabled (next day)', () => {
			const kiosk = createKiosk(['a1'])
			const products = [createProduct('p1', true, 8, 14)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
			const configDisabled = createConfig([3])
			let availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, configDisabled, availableProducts)).toBe(true)

			jest.setSystemTime(new Date('2026-01-15T10:00:00'))
			const configEnabled = createConfig([3])
			availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, configEnabled, availableProducts)).toBe(false)
		})
	})

	describe('kiosk closing', () => {
		it('kiosk closes when last product window closes', () => {
			const kiosk = createKiosk(['a1'])
			const config = createConfig()

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T13:00:00'))
			const products = [createProduct('p1', true, 8, 14)]
			let availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(false)

			jest.setSystemTime(new Date('2026-01-14T14:00:00'))
			availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(true)
		})

		it('kiosk closes when manually deactivated', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const config = createConfig()
			const products = [createProduct('p1', true, 8, 14)]
			const availableProducts = filterAvailableProducts(products)

			const kioskActive = createKiosk(['a1'])
			expect(isKioskCurrentlyClosed(kioskActive, config, availableProducts)).toBe(false)

			const kioskDeactivated = { ...createKiosk(['a1']), deactivated: true }
			expect(isKioskCurrentlyClosed(kioskDeactivated, config, availableProducts)).toBe(true)
		})

		it('kiosk closes on disabled weekday', () => {
			const kiosk = createKiosk(['a1'])
			const products = [createProduct('p1', true, 8, 14)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-15T10:00:00'))
			const configEnabled = createConfig([])
			const availableProducts = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, configEnabled, availableProducts)).toBe(false)

			const configDisabled = createConfig([4])
			expect(isKioskCurrentlyClosed(kiosk, configDisabled, availableProducts)).toBe(true)
		})

		it('kiosk closes when all products become inactive', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = createKiosk(['a1'])
			const config = createConfig()

			const activeProducts = [createProduct('p1', true, 8, 14)]
			let availableProducts = filterAvailableProducts(activeProducts)
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(false)

			const inactiveProducts = [createProduct('p1', false, 8, 14)]
			availableProducts = filterAvailableProducts(inactiveProducts)
			expect(isKioskCurrentlyClosed(kiosk, config, availableProducts)).toBe(true)
		})
	})
})

describe('product and activity removal scenarios', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	describe('removing products', () => {
		it('removing the last product closes the kiosk', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = createKiosk(['a1'])
			const config = createConfig()

			const withProducts = [createProduct('p1', true, 8, 14)]
			expect(isKioskCurrentlyClosed(kiosk, config, filterAvailableProducts(withProducts))).toBe(false)

			expect(isKioskCurrentlyClosed(kiosk, config, [])).toBe(true)
		})

		it('removing a product updates activity availability', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = createKiosk(['a1', 'a2'])
			const activities = [
				createActivity('a1', ['p2']),
				createActivity('a2', ['p1'])
			]

			const allProducts = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 8, 14)
			]
			let availableProducts = filterAvailableProducts(allProducts)
			expect(filterAvailableActivities(activities, kiosk, availableProducts).map(a => a._id)).toEqual(['a1', 'a2'])

			const oneProduct = [createProduct('p1', true, 8, 14)]
			availableProducts = filterAvailableProducts(oneProduct)
			expect(filterAvailableActivities(activities, kiosk, availableProducts).map(a => a._id)).toEqual(['a1'])
		})
	})

	describe('removing activities', () => {
		it('removing activity from kiosk updates available activities', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [createProduct('p1', true, 8, 14)]
			const activities = [createActivity('a1'), createActivity('a2'), createActivity('a3')]
			const availableProducts = filterAvailableProducts(products)

			const kioskAll = createKiosk(['a1', 'a2', 'a3'])
			expect(filterAvailableActivities(activities, kioskAll, availableProducts)).toHaveLength(3)

			const kioskPartial = createKiosk(['a1', 'a3'])
			expect(filterAvailableActivities(activities, kioskPartial, availableProducts).map(a => a._id)).toEqual(['a1', 'a3'])

			const kioskNone = createKiosk([])
			expect(filterAvailableActivities(activities, kioskNone, availableProducts)).toHaveLength(0)
		})

		it('removing activity from activities array updates results', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [createProduct('p1', true, 8, 14)]
			const kiosk = createKiosk(['a1', 'a2', 'a3'])
			const availableProducts = filterAvailableProducts(products)

			const allActivities = [createActivity('a1'), createActivity('a2'), createActivity('a3')]
			expect(filterAvailableActivities(allActivities, kiosk, availableProducts)).toHaveLength(3)

			const someActivities = [createActivity('a1'), createActivity('a3')]
			expect(filterAvailableActivities(someActivities, kiosk, availableProducts).map(a => a._id)).toEqual(['a1', 'a3'])
		})
	})
})

describe('complex real-world scenarios', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	it('full day cycle with breakfast, lunch, and dinner', () => {
		const products = [
			createProduct('breakfast-item', true, 7, 10),
			createProduct('lunch-item', true, 11, 14),
			createProduct('dinner-item', true, 17, 21)
		]
		const activities = [
			createActivity('breakfast', ['lunch-item', 'dinner-item']),
			createActivity('lunch', ['breakfast-item', 'dinner-item']),
			createActivity('dinner', ['breakfast-item', 'lunch-item'])
		]
		const kiosk = createKiosk(['breakfast', 'lunch', 'dinner'])
		const config = createConfig()

		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T06:00:00'))
		let available = filterAvailableProducts(products)
		expect(available).toHaveLength(0)
		expect(filterAvailableActivities(activities, kiosk, available)).toHaveLength(0)
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-14T08:00:00'))
		available = filterAvailableProducts(products)
		expect(available.map(p => p._id)).toEqual(['breakfast-item'])
		expect(filterAvailableActivities(activities, kiosk, available).map(a => a._id)).toEqual(['breakfast'])
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(false)

		jest.setSystemTime(new Date('2026-01-14T10:30:00'))
		available = filterAvailableProducts(products)
		expect(available).toHaveLength(0)
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-14T12:00:00'))
		available = filterAvailableProducts(products)
		expect(available.map(p => p._id)).toEqual(['lunch-item'])
		expect(filterAvailableActivities(activities, kiosk, available).map(a => a._id)).toEqual(['lunch'])
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(false)

		jest.setSystemTime(new Date('2026-01-14T15:00:00'))
		available = filterAvailableProducts(products)
		expect(available).toHaveLength(0)
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-14T19:00:00'))
		available = filterAvailableProducts(products)
		expect(available.map(p => p._id)).toEqual(['dinner-item'])
		expect(filterAvailableActivities(activities, kiosk, available).map(a => a._id)).toEqual(['dinner'])
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(false)

		jest.setSystemTime(new Date('2026-01-14T21:00:00'))
		available = filterAvailableProducts(products)
		expect(available).toHaveLength(0)
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(true)
	})

	it('night shift scenario with midnight-spanning window', () => {
		const products = [
			createProduct('day-snack', true, 8, 18),
			createProduct('night-snack', true, 22, 6)
		]
		const activities = [
			createActivity('day-activity', ['night-snack']),
			createActivity('night-activity', ['day-snack'])
		]
		const kiosk = createKiosk(['day-activity', 'night-activity'])
		const config = createConfig()

		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))
		let available = filterAvailableProducts(products)
		expect(available.map(p => p._id)).toEqual(['day-snack'])
		expect(filterAvailableActivities(activities, kiosk, available).map(a => a._id)).toEqual(['day-activity'])

		jest.setSystemTime(new Date('2026-01-14T20:00:00'))
		available = filterAvailableProducts(products)
		expect(available).toHaveLength(0)
		expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-14T23:00:00'))
		available = filterAvailableProducts(products)
		expect(available.map(p => p._id)).toEqual(['night-snack'])
		expect(filterAvailableActivities(activities, kiosk, available).map(a => a._id)).toEqual(['night-activity'])

		jest.setSystemTime(new Date('2026-01-15T03:00:00'))
		available = filterAvailableProducts(products)
		expect(available.map(p => p._id)).toEqual(['night-snack'])
		expect(filterAvailableActivities(activities, kiosk, available).map(a => a._id)).toEqual(['night-activity'])
	})

	it('weekend closure scenario', () => {
		const products = [createProduct('p1', true, 8, 14)]
		const kiosk = createKiosk(['a1'])
		const configWeekendClosed = createConfig([0, 6])

		jest.useFakeTimers().setSystemTime(new Date('2026-01-16T10:00:00'))
		let available = filterAvailableProducts(products)
		expect(isKioskCurrentlyClosed(kiosk, configWeekendClosed, available)).toBe(false)

		jest.setSystemTime(new Date('2026-01-17T10:00:00'))
		available = filterAvailableProducts(products)
		expect(isKioskCurrentlyClosed(kiosk, configWeekendClosed, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-18T10:00:00'))
		available = filterAvailableProducts(products)
		expect(isKioskCurrentlyClosed(kiosk, configWeekendClosed, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-19T10:00:00'))
		available = filterAvailableProducts(products)
		expect(isKioskCurrentlyClosed(kiosk, configWeekendClosed, available)).toBe(false)
	})

	it('temporary deactivation scenario', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const products = [createProduct('p1', true, 8, 14)]
		const config = createConfig()
		const available = filterAvailableProducts(products)

		const kioskActive = createKiosk(['a1'])
		expect(isKioskCurrentlyClosed(kioskActive, config, available)).toBe(false)

		const deactivatedUntil = new Date('2026-01-14T12:00:00').toISOString()
		const kioskDeactivatedUntilLater = {
			...createKiosk(['a1']),
			deactivatedUntil
		}
		expect(isKioskCurrentlyClosed(kioskDeactivatedUntilLater, config, available)).toBe(true)

		jest.setSystemTime(new Date('2026-01-14T12:00:01'))
		expect(isKioskCurrentlyClosed(kioskDeactivatedUntilLater, config, available)).toBe(false)
	})

	it('multiple kiosks with different enabled activities', () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

		const products = [createProduct('p1', true, 8, 14)]
		const activities = [
			createActivity('a1'),
			createActivity('a2'),
			createActivity('a3')
		]
		const availableProducts = filterAvailableProducts(products)

		const kiosk1 = createKiosk(['a1', 'a2'])
		const kiosk2 = createKiosk(['a2', 'a3'])
		const kiosk3 = createKiosk(['a1', 'a3'])

		expect(filterAvailableActivities(activities, kiosk1, availableProducts).map(a => a._id)).toEqual(['a1', 'a2'])
		expect(filterAvailableActivities(activities, kiosk2, availableProducts).map(a => a._id)).toEqual(['a2', 'a3'])
		expect(filterAvailableActivities(activities, kiosk3, availableProducts).map(a => a._id)).toEqual(['a1', 'a3'])
	})
})

describe('edge cases and boundary conditions', () => {
	afterEach(() => {
		jest.useRealTimers()
	})

	describe('data integrity edge cases', () => {
		it('handles product with undefined imageURL', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const product: ProductType = {
				_id: 'p1',
				name: 'Product',
				price: 100,
				isActive: true,
				orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 14, minute: 0 } },
				options: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}

			const result = filterAvailableProducts([product])

			expect(result).toHaveLength(1)
		})

		it('handles activity with empty disabledProducts vs populated', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const activities = [
				createActivity('a1', []),
				createActivity('a2', ['nonexistent-product'])
			]
			const kiosk = createKiosk(['a1', 'a2'])
			const products = [createProduct('p1', true, 8, 14)]

			const result = filterAvailableActivities(activities, kiosk, filterAvailableProducts(products))

			expect(result.map(a => a._id)).toEqual(['a1', 'a2'])
		})

		it('handles product IDs with special characters', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [
				{ ...createProduct('prod-with-dash', true, 8, 14) },
				{ ...createProduct('prod_with_underscore', true, 8, 14) },
				{ ...createProduct('507f1f77bcf86cd799439011', true, 8, 14) }
			]

			const result = filterAvailableProducts(products)

			expect(result).toHaveLength(3)
		})
	})

	describe('time boundary edge cases', () => {
		it('handles exact midnight (00:00) as window start', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T00:00:00'))

			const products = [createProduct('p1', true, 0, 6)]

			const result = filterAvailableProducts(products)

			expect(result).toHaveLength(1)
		})

		it('handles 23:59 as window end', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T23:58:00'))

			const products = [createProduct('p1', true, 20, 23, 0, 59)]

			const result = filterAvailableProducts(products)

			expect(result).toHaveLength(1)
		})

		it('handles transition across midnight boundary', () => {
			const products = [createProduct('night', true, 22, 2)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T23:59:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-15T00:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-15T00:01:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-15T01:59:00'))
			expect(filterAvailableProducts(products)).toHaveLength(1)

			jest.setSystemTime(new Date('2026-01-15T02:00:00'))
			expect(filterAvailableProducts(products)).toHaveLength(0)
		})

		it('handles day-of-week change at midnight for isKioskClosed', () => {
			const kiosk = createKiosk(['a1'])
			const products = [createProduct('p1', true, 0, 6)]

			jest.useFakeTimers().setSystemTime(new Date('2026-01-17T23:59:00'))
			const configSaturdayClosed = createConfig([6])
			let available = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, configSaturdayClosed, available)).toBe(true)

			jest.setSystemTime(new Date('2026-01-18T00:00:00'))
			available = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, configSaturdayClosed, available)).toBe(false)

			const configSundayClosed = createConfig([0])
			expect(isKioskCurrentlyClosed(kiosk, configSundayClosed, available)).toBe(true)

			jest.setSystemTime(new Date('2026-01-19T00:00:00'))
			available = filterAvailableProducts(products)
			expect(isKioskCurrentlyClosed(kiosk, configSundayClosed, available)).toBe(false)
		})
	})

	describe('large dataset performance', () => {
		it('handles many products efficiently', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = Array.from({ length: 1000 }, (_, i) =>
				createProduct(`p${i}`, i % 2 === 0, 8, 14)
			)

			const start = performance.now()
			const result = filterAvailableProducts(products)
			const duration = performance.now() - start

			expect(result).toHaveLength(500)
			expect(duration).toBeLessThan(100)
		})

		it('handles many activities efficiently', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const activities = Array.from({ length: 500 }, (_, i) =>
				createActivity(`a${i}`, i % 3 === 0 ? ['p0'] : [])
			)
			const kiosk = createKiosk(activities.map(a => a._id))
			const products = [createProduct('p0', true, 8, 14), createProduct('p1', true, 8, 14)]
			const availableProducts = filterAvailableProducts(products)

			const start = performance.now()
			const result = filterAvailableActivities(activities, kiosk, availableProducts)
			const duration = performance.now() - start

			expect(result.length).toBeGreaterThan(0)
			expect(duration).toBeLessThan(100)
		})
	})

	describe('weekday edge cases', () => {
		it('handles all weekdays correctly (0=Sunday through 6=Saturday)', () => {
			const kiosk = createKiosk(['a1'])
			const products = [createProduct('p1', true, 0, 23, 0, 59)]

			const dates = [
				new Date('2026-01-11T12:00:00'),
				new Date('2026-01-12T12:00:00'),
				new Date('2026-01-13T12:00:00'),
				new Date('2026-01-14T12:00:00'),
				new Date('2026-01-15T12:00:00'),
				new Date('2026-01-16T12:00:00'),
				new Date('2026-01-17T12:00:00')
			]

			dates.forEach((date, expectedDay) => {
				jest.useFakeTimers().setSystemTime(date)
				const available = filterAvailableProducts(products)
				const configDisableDay = createConfig([expectedDay])

				expect(isKioskCurrentlyClosed(kiosk, configDisableDay, available)).toBe(true)

				const configEnableDay = createConfig([])
				expect(isKioskCurrentlyClosed(kiosk, configEnableDay, available)).toBe(false)

				jest.useRealTimers()
			})
		})

		it('handles multiple disabled weekdays', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = createKiosk(['a1'])
			const products = [createProduct('p1', true, 8, 14)]
			const available = filterAvailableProducts(products)

			const configWorkdaysOnly = createConfig([0, 6])
			expect(isKioskCurrentlyClosed(kiosk, configWorkdaysOnly, available)).toBe(false)

			const configWeekendsOnly = createConfig([1, 2, 3, 4, 5])
			expect(isKioskCurrentlyClosed(kiosk, configWeekendsOnly, available)).toBe(true)
		})
	})

	describe('activity-product relationship edge cases', () => {
		it('activity disabling all products makes it unavailable', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 8, 14)
			]
			const activities = [createActivity('a1', ['p1', 'p2'])]
			const kiosk = createKiosk(['a1'])
			const available = filterAvailableProducts(products)

			const result = filterAvailableActivities(activities, kiosk, available)

			expect(result).toHaveLength(0)
		})

		it('activity disabling some products still shows with remaining', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [
				createProduct('p1', true, 8, 14),
				createProduct('p2', true, 8, 14),
				createProduct('p3', true, 8, 14)
			]
			const activities = [createActivity('a1', ['p1', 'p2'])]
			const kiosk = createKiosk(['a1'])
			const available = filterAvailableProducts(products)

			const result = filterAvailableActivities(activities, kiosk, available)

			expect(result).toHaveLength(1)
		})

		it('handles activity referencing non-existent product IDs in disabledProducts', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const products = [createProduct('p1', true, 8, 14)]
			const activities = [createActivity('a1', ['nonexistent1', 'nonexistent2'])]
			const kiosk = createKiosk(['a1'])
			const available = filterAvailableProducts(products)

			const result = filterAvailableActivities(activities, kiosk, available)

			expect(result).toHaveLength(1)
		})
	})

	describe('kiosk state combinations', () => {
		it('deactivated takes precedence over deactivatedUntil in past', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = {
				...createKiosk(['a1']),
				deactivated: true,
				deactivatedUntil: new Date('2026-01-14T08:00:00').toISOString()
			}
			const config = createConfig()
			const products = [createProduct('p1', true, 8, 14)]
			const available = filterAvailableProducts(products)

			expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(true)
		})

		it('both deactivated false and deactivatedUntil null means open', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = {
				...createKiosk(['a1']),
				deactivated: false,
				deactivatedUntil: null
			}
			const config = createConfig()
			const products = [createProduct('p1', true, 8, 14)]
			const available = filterAvailableProducts(products)

			expect(isKioskCurrentlyClosed(kiosk, config, available)).toBe(false)
		})

		it('empty enabledActivities array means no activities available', () => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-14T10:00:00'))

			const kiosk = createKiosk([])
			const activities = [createActivity('a1'), createActivity('a2')]
			const products = [createProduct('p1', true, 8, 14)]
			const available = filterAvailableProducts(products)

			const result = filterAvailableActivities(activities, kiosk, available)

			expect(result).toHaveLength(0)
		})
	})
})
