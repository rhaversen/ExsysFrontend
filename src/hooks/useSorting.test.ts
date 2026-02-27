import { renderHook, act } from '@testing-library/react'

import useSorting from './useSorting'

describe('useSorting', () => {
	describe('initialization', () => {
		it('initializes with default sort field and direction', () => {
			const { result } = renderHook(() => useSorting('Produkter'))
			expect(result.current.sortField).toBe('createdAt')
			expect(result.current.sortDirection).toBe('desc')
		})

		it('returns sorting options for the specified type', () => {
			const { result } = renderHook(() => useSorting('Produkter'))
			expect(result.current.sortingOptions).toBeDefined()
			expect(result.current.sortingOptions.length).toBeGreaterThan(0)
		})

		it('returns isEnabled true when type is provided', () => {
			const { result } = renderHook(() => useSorting('Produkter'))
			expect(result.current.isEnabled).toBe(true)
		})
	})

	describe('null type handling', () => {
		it('returns inactive state when type is null', () => {
			const { result } = renderHook(() => useSorting(null))
			expect(result.current.isEnabled).toBe(false)
			expect(result.current.sortingOptions).toEqual([])
		})

		it('sortByField returns items unchanged when type is null', () => {
			const { result } = renderHook(() => useSorting(null))
			const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
			const sorted = result.current.sortByField(items)
			expect(sorted).toEqual(items)
		})
	})

	describe('type change reset', () => {
		it('resets sort field and direction when type changes', () => {
			const { result, rerender } = renderHook(
				({ type }: { type: 'Produkter' | 'Tilvalg' }) => useSorting(type),
				{ initialProps: { type: 'Produkter' } }
			)

			act(() => {
				result.current.setSortField('name')
				result.current.setSortDirection('asc')
			})

			expect(result.current.sortField).toBe('name')
			expect(result.current.sortDirection).toBe('asc')

			rerender({ type: 'Tilvalg' })

			expect(result.current.sortField).toBe('createdAt')
			expect(result.current.sortDirection).toBe('desc')
		})
	})

	describe('sortByField - string sorting', () => {
		it('sorts strings ascending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('name')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ name: 'Charlie' },
				{ name: 'Alice' },
				{ name: 'Bob' }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].name).toBe('Alice')
			expect(sorted[1].name).toBe('Bob')
			expect(sorted[2].name).toBe('Charlie')
		})

		it('sorts strings descending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('name')
				result.current.setSortDirection('desc')
			})

			const items = [
				{ name: 'Alice' },
				{ name: 'Charlie' },
				{ name: 'Bob' }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].name).toBe('Charlie')
			expect(sorted[1].name).toBe('Bob')
			expect(sorted[2].name).toBe('Alice')
		})

		it('sorts strings case-insensitively', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('name')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ name: 'banana' },
				{ name: 'Apple' },
				{ name: 'CHERRY' }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].name).toBe('Apple')
			expect(sorted[1].name).toBe('banana')
			expect(sorted[2].name).toBe('CHERRY')
		})
	})

	describe('sortByField - number sorting', () => {
		it('sorts numbers ascending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('price')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ price: 30 },
				{ price: 10 },
				{ price: 20 }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].price).toBe(10)
			expect(sorted[1].price).toBe(20)
			expect(sorted[2].price).toBe(30)
		})

		it('sorts numbers descending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('price')
				result.current.setSortDirection('desc')
			})

			const items = [
				{ price: 10 },
				{ price: 30 },
				{ price: 20 }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].price).toBe(30)
			expect(sorted[1].price).toBe(20)
			expect(sorted[2].price).toBe(10)
		})
	})

	describe('sortByField - nested property sorting', () => {
		it('sorts by nested property', () => {
			const { result } = renderHook(() => useSorting('Aktiviteter'))

			act(() => {
				result.current.setSortField('roomId.name')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ roomId: { name: 'C-room' } },
				{ roomId: { name: 'A-room' } },
				{ roomId: { name: 'B-room' } }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].roomId.name).toBe('A-room')
			expect(sorted[1].roomId.name).toBe('B-room')
			expect(sorted[2].roomId.name).toBe('C-room')
		})

		it('handles undefined nested properties', () => {
			const { result } = renderHook(() => useSorting('Aktiviteter'))

			act(() => {
				result.current.setSortField('roomId.name')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ roomId: { name: 'B-room' } },
				{ roomId: undefined },
				{ roomId: { name: 'A-room' } }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted).toHaveLength(3)
		})
	})

	describe('sortByField - orderWindow special cases', () => {
		it('sorts by orderWindow.from.hour using specialized function', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('orderWindow.from.hour')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ isActive: true, orderWindow: { from: { hour: 14, minute: 0 }, to: { hour: 18, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 12, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 10, minute: 0 }, to: { hour: 14, minute: 0 } } }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].orderWindow.from.hour).toBe(8)
			expect(sorted[1].orderWindow.from.hour).toBe(10)
			expect(sorted[2].orderWindow.from.hour).toBe(14)
		})

		it('sorts by orderWindow.from.hour descending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('orderWindow.from.hour')
				result.current.setSortDirection('desc')
			})

			const items = [
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 12, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 14, minute: 0 }, to: { hour: 18, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 10, minute: 0 }, to: { hour: 14, minute: 0 } } }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].orderWindow.from.hour).toBe(14)
			expect(sorted[1].orderWindow.from.hour).toBe(10)
			expect(sorted[2].orderWindow.from.hour).toBe(8)
		})

		it('sorts by orderWindow.to.hour ascending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('orderWindow.to.hour')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 18, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 12, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 14, minute: 0 } } }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].orderWindow.to.hour).toBe(12)
			expect(sorted[1].orderWindow.to.hour).toBe(14)
			expect(sorted[2].orderWindow.to.hour).toBe(18)
		})

		it('sorts by orderWindow.to.hour descending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('orderWindow.to.hour')
				result.current.setSortDirection('desc')
			})

			const items = [
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 12, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 18, minute: 0 } } },
				{ isActive: true, orderWindow: { from: { hour: 8, minute: 0 }, to: { hour: 14, minute: 0 } } }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].orderWindow.to.hour).toBe(18)
			expect(sorted[1].orderWindow.to.hour).toBe(14)
			expect(sorted[2].orderWindow.to.hour).toBe(12)
		})
	})

	describe('sortByField - date sorting', () => {
		it('sorts dates ascending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('createdAt')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ createdAt: new Date('2026-03-01') },
				{ createdAt: new Date('2026-01-01') },
				{ createdAt: new Date('2026-02-01') }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].createdAt.getMonth()).toBe(0)
			expect(sorted[1].createdAt.getMonth()).toBe(1)
			expect(sorted[2].createdAt.getMonth()).toBe(2)
		})

		it('sorts dates descending', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('createdAt')
				result.current.setSortDirection('desc')
			})

			const items = [
				{ createdAt: new Date('2026-01-01') },
				{ createdAt: new Date('2026-03-01') },
				{ createdAt: new Date('2026-02-01') }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted[0].createdAt.getMonth()).toBe(2)
			expect(sorted[1].createdAt.getMonth()).toBe(1)
			expect(sorted[2].createdAt.getMonth()).toBe(0)
		})
	})

	describe('sortByField - fallback comparison', () => {
		it('falls back to string comparison for mixed types', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('value')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ value: true },
				{ value: false },
				{ value: null }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted).toHaveLength(3)
		})
	})

	describe('does not mutate original array', () => {
		it('returns a new sorted array', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('name')
				result.current.setSortDirection('asc')
			})

			const original = [
				{ name: 'Charlie' },
				{ name: 'Alice' },
				{ name: 'Bob' }
			]
			const sorted = result.current.sortByField(original)

			expect(original[0].name).toBe('Charlie')
			expect(sorted[0].name).toBe('Alice')
			expect(sorted).not.toBe(original)
		})
	})

	describe('sorting options by type', () => {
		it('returns correct options for Produkter', () => {
			const { result } = renderHook(() => useSorting('Produkter'))
			const props = result.current.sortingOptions.map(o => o.prop)
			expect(props).toContain('name')
			expect(props).toContain('price')
			expect(props).toContain('isActive')
		})

		it('returns correct options for Tilvalg', () => {
			const { result } = renderHook(() => useSorting('Tilvalg'))
			const props = result.current.sortingOptions.map(o => o.prop)
			expect(props).toContain('name')
			expect(props).toContain('price')
		})

		it('returns correct options for Aktiviteter', () => {
			const { result } = renderHook(() => useSorting('Aktiviteter'))
			const props = result.current.sortingOptions.map(o => o.prop)
			expect(props).toContain('name')
			expect(props).toContain('roomId.name')
		})

		it('returns correct options for Kiosker', () => {
			const { result } = renderHook(() => useSorting('Kiosker'))
			const props = result.current.sortingOptions.map(o => o.prop)
			expect(props).toContain('name')
			expect(props).toContain('kioskTag')
		})
	})

	describe('equal values', () => {
		it('maintains stability for equal string values', () => {
			const { result } = renderHook(() => useSorting('Produkter'))

			act(() => {
				result.current.setSortField('name')
				result.current.setSortDirection('asc')
			})

			const items = [
				{ name: 'Same', id: 1 },
				{ name: 'Same', id: 2 },
				{ name: 'Same', id: 3 }
			]
			const sorted = result.current.sortByField(items)

			expect(sorted).toHaveLength(3)
		})
	})
})
