import { renderHook, act } from '@testing-library/react'

import { useViewTransition } from './useViewTransition'

describe('useViewTransition', () => {
	type TestView = 'home' | 'products' | 'cart' | 'checkout'
	const viewOrder: TestView[] = ['home', 'products', 'cart', 'checkout']

	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('initialization', () => {
		it('initializes with the provided initial view', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			expect(result.current.currentView).toBe('home')
		})

		it('initializes with isTransitioning as false', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			expect(result.current.isTransitioning).toBe(false)
		})

		it('initializes slideDirection as right', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			expect(result.current.slideDirection).toBe('right')
		})
	})

	describe('navigateTo - forward navigation', () => {
		it('navigates to the next view', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('products')
		})

		it('sets slideDirection to right when navigating forward', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('cart')
			})

			expect(result.current.slideDirection).toBe('right')
		})

		it('skips intermediate views', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('checkout')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('checkout')
		})
	})

	describe('navigateTo - backward navigation', () => {
		it('navigates to a previous view', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'checkout',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('home')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('home')
		})

		it('sets slideDirection to left when navigating backward', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'cart',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('home')
			})

			expect(result.current.slideDirection).toBe('left')
		})
	})

	describe('transition state', () => {
		it('sets isTransitioning to true during transition', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			expect(result.current.isTransitioning).toBe(true)
		})

		it('sets isTransitioning to false after transition completes', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			expect(result.current.isTransitioning).toBe(true)

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.isTransitioning).toBe(false)
		})

		it('does not change view until transition completes', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			expect(result.current.currentView).toBe('home')
			expect(result.current.isTransitioning).toBe(true)

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('products')
		})
	})

	describe('navigation blocking', () => {
		it('ignores navigation to the same view', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('home')
			})

			expect(result.current.isTransitioning).toBe(false)
		})

		it('ignores navigation while transitioning', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			expect(result.current.isTransitioning).toBe(true)

			act(() => {
				result.current.navigateTo('cart')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('products')
		})
	})

	describe('sequential navigation', () => {
		it('allows navigation after previous transition completes', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('products')
			expect(result.current.isTransitioning).toBe(false)

			act(() => {
				result.current.navigateTo('cart')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('cart')
		})
	})

	describe('transition timing', () => {
		it('completes transition after exactly 100ms', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			act(() => {
				jest.advanceTimersByTime(99)
			})

			expect(result.current.isTransitioning).toBe(true)
			expect(result.current.currentView).toBe('home')

			act(() => {
				jest.advanceTimersByTime(1)
			})

			expect(result.current.isTransitioning).toBe(false)
			expect(result.current.currentView).toBe('products')
		})
	})

	describe('view order edge cases', () => {
		it('handles navigation from first to last view', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('checkout')
			})

			expect(result.current.slideDirection).toBe('right')

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('checkout')
		})

		it('handles navigation from last to first view', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'checkout',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('home')
			})

			expect(result.current.slideDirection).toBe('left')

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('home')
		})
	})

	describe('timer cleanup', () => {
		it('clears pending timeout when navigateTo is called during transition', () => {
			const { result } = renderHook(() =>
				useViewTransition<TestView>({
					initialView: 'home',
					viewOrder
				})
			)

			act(() => {
				result.current.navigateTo('products')
			})

			act(() => {
				jest.advanceTimersByTime(50)
			})

			act(() => {
				result.current.navigateTo('home')
			})

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('products')
		})
	})

	describe('different view configurations', () => {
		it('works with two views', () => {
			type TwoViews = 'a' | 'b'
			const twoViewOrder: TwoViews[] = ['a', 'b']

			const { result } = renderHook(() =>
				useViewTransition<TwoViews>({
					initialView: 'a',
					viewOrder: twoViewOrder
				})
			)

			act(() => {
				result.current.navigateTo('b')
			})

			expect(result.current.slideDirection).toBe('right')

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('b')
		})

		it('works with many views', () => {
			type ManyViews = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6'
			const manyViewOrder: ManyViews[] = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']

			const { result } = renderHook(() =>
				useViewTransition<ManyViews>({
					initialView: 'v3',
					viewOrder: manyViewOrder
				})
			)

			act(() => {
				result.current.navigateTo('v5')
			})

			expect(result.current.slideDirection).toBe('right')

			act(() => {
				jest.advanceTimersByTime(100)
			})

			act(() => {
				result.current.navigateTo('v2')
			})

			expect(result.current.slideDirection).toBe('left')

			act(() => {
				jest.advanceTimersByTime(100)
			})

			expect(result.current.currentView).toBe('v2')
		})
	})
})
