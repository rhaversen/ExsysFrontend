import { renderHook, act, waitFor } from '@testing-library/react'

import { useInactivityTimeout } from './useInactivityTimeout'

describe('useInactivityTimeout', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	describe('initialization', () => {
		it('initializes with showWarning as false', () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			expect(result.current.showWarning).toBe(false)
		})

		it('does not show warning immediately', () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 10000,
					enabled: true,
					onTimeout
				})
			)

			expect(result.current.showWarning).toBe(false)
		})
	})

	describe('timer behavior', () => {
		it('shows warning after timeout expires', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			expect(result.current.showWarning).toBe(false)

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})
		})

		it('does not show warning before timeout expires', () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 10000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(9999)
			})

			expect(result.current.showWarning).toBe(false)
		})

		it('does not start timer when disabled', () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: false,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(10000)
			})

			expect(result.current.showWarning).toBe(false)
		})
	})

	describe('enabling and disabling', () => {
		it('clears warning when disabled', async () => {
			const onTimeout = jest.fn()
			const { result, rerender } = renderHook(
				({ enabled }) => useInactivityTimeout({
					timeoutMs: 5000,
					enabled,
					onTimeout
				}),
				{ initialProps: { enabled: true } }
			)

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})

			rerender({ enabled: false })

			expect(result.current.showWarning).toBe(false)
		})

		it('starts timer when enabled changes to true', async () => {
			const onTimeout = jest.fn()
			const { result, rerender } = renderHook(
				({ enabled }) => useInactivityTimeout({
					timeoutMs: 5000,
					enabled,
					onTimeout
				}),
				{ initialProps: { enabled: false } }
			)

			act(() => {
				jest.advanceTimersByTime(10000)
			})

			expect(result.current.showWarning).toBe(false)

			rerender({ enabled: true })

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})
		})
	})

	describe('dismissWarning', () => {
		it('hides warning when dismissed', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})

			act(() => {
				result.current.dismissWarning()
			})

			expect(result.current.showWarning).toBe(false)
		})

		it('restarts timer after dismissing warning', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})

			act(() => {
				result.current.dismissWarning()
			})

			expect(result.current.showWarning).toBe(false)

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})
		})
	})

	describe('handleTimeout', () => {
		it('calls onTimeout callback when handleTimeout is invoked', () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				result.current.handleTimeout()
			})

			expect(onTimeout).toHaveBeenCalledTimes(1)
		})

		it('hides warning when handleTimeout is called', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(5000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})

			act(() => {
				result.current.handleTimeout()
			})

			expect(result.current.showWarning).toBe(false)
		})
	})

	describe('callback reference stability', () => {
		it('uses updated onTimeout callback even if passed later', () => {
			const firstCallback = jest.fn()
			const secondCallback = jest.fn()

			const { result, rerender } = renderHook(
				({ callback }) => useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout: callback
				}),
				{ initialProps: { callback: firstCallback } }
			)

			rerender({ callback: secondCallback })

			act(() => {
				result.current.handleTimeout()
			})

			expect(firstCallback).not.toHaveBeenCalled()
			expect(secondCallback).toHaveBeenCalledTimes(1)
		})
	})

	describe('event listeners', () => {
		it('resets timer on mouse activity events', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(3000)
			})

			expect(result.current.showWarning).toBe(false)

			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove'))
			})

			act(() => {
				jest.advanceTimersByTime(3000)
			})

			expect(result.current.showWarning).toBe(false)

			act(() => {
				jest.advanceTimersByTime(2000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})
		})

		it('resets timer on click events', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(4000)
			})

			act(() => {
				document.dispatchEvent(new MouseEvent('click'))
			})

			act(() => {
				jest.advanceTimersByTime(4000)
			})

			expect(result.current.showWarning).toBe(false)

			act(() => {
				jest.advanceTimersByTime(1000)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})
		})

		it('resets timer on keyboard events', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(4000)
			})

			act(() => {
				document.dispatchEvent(new KeyboardEvent('keydown'))
			})

			act(() => {
				jest.advanceTimersByTime(4000)
			})

			expect(result.current.showWarning).toBe(false)
		})

		it('removes event listeners on cleanup', () => {
			const onTimeout = jest.fn()
			const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
			const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

			const { unmount } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 5000,
					enabled: true,
					onTimeout
				})
			)

			const eventsAdded = addEventListenerSpy.mock.calls.length

			unmount()

			expect(removeEventListenerSpy).toHaveBeenCalledTimes(eventsAdded)

			addEventListenerSpy.mockRestore()
			removeEventListenerSpy.mockRestore()
		})
	})

	describe('timeout configuration', () => {
		it('respects different timeout values', async () => {
			const onTimeout = jest.fn()
			const { result } = renderHook(() =>
				useInactivityTimeout({
					timeoutMs: 1000,
					enabled: true,
					onTimeout
				})
			)

			act(() => {
				jest.advanceTimersByTime(999)
			})

			expect(result.current.showWarning).toBe(false)

			act(() => {
				jest.advanceTimersByTime(1)
			})

			await waitFor(() => {
				expect(result.current.showWarning).toBe(true)
			})
		})
	})
})
