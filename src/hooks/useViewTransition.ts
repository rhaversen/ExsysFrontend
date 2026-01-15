import { useState, useCallback, useRef } from 'react'

const TRANSITION_DURATION_MS = 100

interface UseViewTransitionOptions<T extends string> {
	initialView: T
	viewOrder: T[]
	onNavigate?: (view: T) => void
}

interface UseViewTransitionReturn<T extends string> {
	currentView: T
	isTransitioning: boolean
	slideDirection: 'left' | 'right'
	navigateTo: (newView: T) => void
}

export function useViewTransition<T extends string> ({
	initialView,
	viewOrder,
	onNavigate
}: UseViewTransitionOptions<T>): UseViewTransitionReturn<T> {
	const [currentView, setCurrentView] = useState<T>(initialView)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	const navigateTo = useCallback((newView: T) => {
		if (newView === currentView || isTransitioning) { return }

		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
		}

		if (onNavigate !== undefined) {
			onNavigate(newView)
		}

		const direction = viewOrder.indexOf(newView) > viewOrder.indexOf(currentView) ? 'right' : 'left'
		setSlideDirection(direction)
		setIsTransitioning(true)

		timeoutRef.current = setTimeout(() => {
			setCurrentView(newView)
			setIsTransitioning(false)
		}, TRANSITION_DURATION_MS)
	}, [currentView, isTransitioning, viewOrder, onNavigate])

	return {
		currentView,
		isTransitioning,
		slideDirection,
		navigateTo
	}
}
