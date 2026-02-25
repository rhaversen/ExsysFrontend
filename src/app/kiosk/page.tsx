'use client'

import dayjs from 'dayjs'
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DeliveryInfoSelection from '@/components/kiosk/DeliveryInfoSelection'
import KioskFeedbackInfo from '@/components/kiosk/KioskFeedbackInfo'
import KioskSessionInfo from '@/components/kiosk/KioskSessionInfo'
import OrderView from '@/components/kiosk/OrderView'
import ProgressBar from '@/components/kiosk/ProgressBar'
import TimeoutWarningWindow from '@/components/kiosk/TimeoutWarningWindow'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { useConfig } from '@/contexts/ConfigProvider'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { useKioskData } from '@/hooks/useKioskData'
import { useKioskPing } from '@/hooks/useKioskPing'
import { useKioskRecovery } from '@/hooks/useKioskRecovery'
import { useViewTransition } from '@/hooks/useViewTransition'
import { formatRelativeDateLabel, getNextOpen } from '@/lib/timeUtils'
import { type CartType, type ViewState } from '@/types/frontendDataTypes'

import 'dayjs/locale/da'

dayjs.locale('da')

const EMPTY_CART: CartType = { products: {}, options: {}, productOrder: [] }
const VIEW_ORDER: ViewState[] = ['welcome', 'activity', 'room', 'order', 'feedback']

export default function Page (): ReactElement {
	const { config } = useConfig()
	const { track, endSession } = useAnalytics()

	const {
		kiosk,
		products,
		options,
		rooms,
		availableProducts,
		availableActivities,
		checkoutMethods,
		isKioskClosed,
		selectedActivity,
		setSelectedActivity,
		selectedRoom,
		setSelectedRoom
	} = useKioskData()

	const { currentView, isTransitioning, slideDirection, navigateTo } = useViewTransition({
		initialView: 'welcome' as ViewState,
		viewOrder: VIEW_ORDER
	})

	const [cart, setCart] = useState<CartType>(EMPTY_CART)
	const [isOrderInProgress, setIsOrderInProgress] = useState(false)

	useKioskPing(isKioskClosed ? 'closed' : currentView)
	useKioskRecovery()

	const kioskInactivityTimeoutMs = config?.configs.kioskInactivityTimeoutMs ?? 60000
	const kioskFeedbackBannerDelayMs = config?.configs.kioskFeedbackBannerDelayMs ?? 5000
	const kioskWelcomeMessage = config?.configs.kioskWelcomeMessage ?? 'Bestilling af brød, kaffe og the'

	const resetSession = useCallback(() => {
		void endSession()
		setSelectedActivity(null)
		setSelectedRoom(null)
		setCart(EMPTY_CART)
		setIsOrderInProgress(false)
		navigateTo('welcome')
	}, [setSelectedActivity, setSelectedRoom, navigateTo, endSession])

	const isTimerEnabled = currentView !== 'welcome' && !isOrderInProgress

	const { showWarning: showTimeoutWarning, dismissWarning: dismissTimeoutWarning, handleTimeout } = useInactivityTimeout({
		timeoutMs: kioskInactivityTimeoutMs,
		enabled: isTimerEnabled,
		onTimeout: resetSession
	})

	const [showFeedbackBanner, setShowFeedbackBanner] = useState(false)
	const feedbackBannerTimerRef = useRef<NodeJS.Timeout>(undefined)

	useEffect(() => {
		if (currentView === 'welcome') {
			feedbackBannerTimerRef.current = setTimeout(() => {
				setShowFeedbackBanner(true)
			}, kioskFeedbackBannerDelayMs)
		} else {
			clearTimeout(feedbackBannerTimerRef.current)
			setShowFeedbackBanner(false)
		}
		return () => clearTimeout(feedbackBannerTimerRef.current)
	}, [currentView, kioskFeedbackBannerDelayMs])

	useEffect(() => {
		if (isKioskClosed) {
			resetSession()
		}
	}, [isKioskClosed, resetSession])

	const getRoomsForActivity = useCallback((activity: typeof selectedActivity) => {
		if (!activity) { return [] }
		return rooms
			.filter(room => activity.enabledRooms.includes(room._id))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [rooms])

	const handleActivitySelect = useCallback((activity: typeof selectedActivity) => {
		if (!activity) { return }
		track('activity_select', { activityId: activity._id })
		setSelectedRoom(null)
		setSelectedActivity(activity)

		const activityRooms = getRoomsForActivity(activity)
		if (activityRooms.length === 1) {
			track('room_auto_select', { roomId: activityRooms[0]._id })
			setSelectedRoom(activityRooms[0])
			track('nav_auto_to_order')
			navigateTo('order')
		} else {
			track('nav_auto_to_room')
			navigateTo('room')
		}
	}, [setSelectedActivity, setSelectedRoom, navigateTo, getRoomsForActivity, track])

	const handleRoomSelect = useCallback((room: typeof selectedRoom) => {
		if (!room) { return }
		track('room_select', { roomId: room._id })
		setSelectedRoom(room)
		track('nav_auto_to_order')
		navigateTo('order')
	}, [setSelectedRoom, navigateTo, track])

	const canClickActivity = currentView !== 'activity'
	const canClickRoom = currentView !== 'room' && selectedActivity !== null
	const canClickOrder = currentView !== 'order' && selectedRoom !== null && selectedActivity !== null

	const handleProgressClick = useCallback((clickedView: ViewState) => {
		if (clickedView === currentView) { return }

		switch (clickedView) {
			case 'activity':
				if (canClickActivity) {
					track('nav_to_activity')
					navigateTo('activity')
				}
				break
			case 'room':
				if (canClickRoom) {
					track('nav_to_room')
					navigateTo('room')
				}
				break
			case 'order':
				if (canClickOrder) {
					track('nav_to_order')
					navigateTo('order')
				}
				break
			case 'welcome':
				track('nav_to_welcome')
				resetSession()
				break
		}
	}, [currentView, canClickActivity, canClickRoom, canClickOrder, resetSession, navigateTo, track])

	const handleOrderClose = useCallback(() => {
		resetSession()
	}, [resetSession])

	const handleOrderStart = useCallback(() => {
		setIsOrderInProgress(true)
	}, [])

	const handleFeedbackBannerClick = useCallback(() => {
		track('feedback_banner_click')
		clearTimeout(feedbackBannerTimerRef.current)
		setShowFeedbackBanner(false)
		navigateTo('feedback')
	}, [navigateTo, track])

	const filteredRooms = useMemo(() => {
		if (!selectedActivity) { return [] }
		return rooms
			.filter(room => selectedActivity.enabledRooms.includes(room._id))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [rooms, selectedActivity])

	const filteredProducts = useMemo(() => {
		if (!selectedActivity) { return [] }
		return availableProducts
			.filter(product => !selectedActivity.disabledProducts.includes(product._id))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [availableProducts, selectedActivity])

	const sortedOptions = useMemo(() => {
		return options.sort((a, b) => a.name.localeCompare(b.name))
	}, [options])

	useEffect(() => {
		const productUrls = products.map(p => p.imageURL).filter((url): url is string => Boolean(url))
		const optionUrls = options.map(o => o.imageURL).filter((url): url is string => Boolean(url))

		const preloadNextImage = (url: string, width: number, quality: number): void => {
			const nextImageUrl = `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`
			const img = new Image()
			img.src = nextImageUrl
		}

		productUrls.forEach(url => { preloadNextImage(url, 256, 75) })
		optionUrls.forEach(url => { preloadNextImage(url, 256, 75) })
	}, [products, options])

	useEffect(() => {
		if (currentView === 'activity' && !kiosk) {
			navigateTo('welcome')
		} else if (currentView === 'room' && !selectedActivity) {
			navigateTo('activity')
		} else if (currentView === 'order') {
			if (!kiosk || !selectedActivity) {
				setSelectedRoom(null)
				navigateTo('activity')
			} else if (!selectedRoom) {
				navigateTo('room')
			}
		}
	}, [currentView, kiosk, selectedActivity, selectedRoom, navigateTo, setSelectedRoom])

	const renderCurrentView = (): ReactElement | null => {
		switch (currentView) {
			case 'welcome':
				return (
					<div className="fixed inset-0 flex flex-col items-center justify-center">
						<h1 className="text-gray-800 mb-8 text-7xl font-bold text-center">
							{kioskWelcomeMessage}
						</h1>
						<button
							onClick={() => {
								track('session_start')
								if (availableActivities.length === 1) {
									const singleActivity = availableActivities[0]
									track('activity_auto_select', { activityId: singleActivity._id })
									setSelectedActivity(singleActivity)
									const activityRooms = getRoomsForActivity(singleActivity)
									if (activityRooms.length === 1) {
										track('room_auto_select', { roomId: activityRooms[0]._id })
										setSelectedRoom(activityRooms[0])
										track('nav_auto_to_order')
										navigateTo('order')
									} else {
										track('nav_auto_to_room')
										navigateTo('room')
									}
								} else {
									track('nav_auto_to_activity')
									navigateTo('activity')
								}
							}}
							className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-8 rounded-xl text-3xl
								shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:scale-102 hover:shadow-[0_0_25px_rgba(0,0,0,0.3)] active:scale-98
								transition-all duration-150 relative overflow-hidden
								before:absolute before:inset-0 before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full before:animate-shimmer"
						>
							{'Tryk her for at starte'}
						</button>
					</div>
				)

			case 'activity':
				if (!kiosk) {
					return null
				}
				return (
					<DeliveryInfoSelection
						title="Vælg din aktivitet"
						subtitle="Tryk for at vælge den aktivitet du deltager i"
						items={availableActivities}
						currentSelectionId={selectedActivity?._id}
						onSelect={handleActivitySelect}
					/>
				)

			case 'room':
				if (!selectedActivity) {
					return null
				}
				return (
					<DeliveryInfoSelection
						title="Vælg dit spisested"
						subtitle="Tryk for at vælge lokalet hvor bestillingen skal leveres til"
						items={filteredRooms}
						currentSelectionId={selectedRoom?._id}
						onSelect={handleRoomSelect}
					/>
				)

			case 'order':
				if (!kiosk || !selectedActivity || !selectedRoom) {
					return null
				}
				return (
					<OrderView
						kiosk={kiosk}
						products={filteredProducts}
						options={sortedOptions}
						activity={selectedActivity}
						room={selectedRoom}
						checkoutMethods={checkoutMethods}
						cart={cart}
						updateCart={setCart}
						onClose={handleOrderClose}
						onOrderStart={handleOrderStart}
					/>
				)

			case 'feedback':
				return <KioskFeedbackInfo onBack={() => navigateTo('welcome')} />

			default:
				navigateTo('welcome')
				return null
		}
	}

	if (isKioskClosed) {
		const nextOpen = getNextOpen(config, kiosk, products)

		return (
			<div className="flex flex-col h-screen">
				<div className="flex-1">
					<div className="fixed inset-0 flex items-center justify-center bg-black">
						<div className="bg-gray-900/50 p-10 rounded-lg text-gray-500">
							<h1 className="text-2xl text-center">{'Lukket'}</h1>
							<p className="text-center">
								{nextOpen
									? <>{'Kiosken åbner igen '}{formatRelativeDateLabel(nextOpen)}</>
									: 'Kiosken er lukket for bestilling'
								}
							</p>
						</div>
					</div>
				</div>
				<div className="flex-shrink-0 z-10 text-gray-400/75">
					<KioskSessionInfo />
				</div>
			</div>
		)
	}

	return (
		<div className="relative flex flex-col h-screen overflow-hidden">
			{currentView !== 'feedback' && (
				<ProgressBar
					viewState={currentView}
					canClickActivity={canClickActivity}
					canClickRoom={canClickRoom}
					canClickOrder={canClickOrder}
					onProgressClick={handleProgressClick}
					selectedActivity={selectedActivity}
					selectedRoom={selectedRoom}
				/>
			)}

			<div
				key={currentView}
				className={`flex-1 overflow-y-auto ${
					isTransitioning
						? (slideDirection === 'right' ? 'animate-slideOutToLeft' : 'animate-slideOutToRight')
						: (slideDirection === 'right' ? 'animate-slideInFromRight' : 'animate-slideInFromLeft')
				}`}
			>
				{renderCurrentView()}
			</div>

			{showTimeoutWarning && (
				<TimeoutWarningWindow
					onTimeout={handleTimeout}
					onClose={dismissTimeoutWarning}
					onRestart={resetSession}
				/>
			)}

			{currentView !== 'feedback' && showFeedbackBanner && (
				<div
					className="fixed bottom-10 right-6 bg-blue-500 text-white px-5 py-3 rounded-lg shadow-xl z-40"
					onClick={handleFeedbackBannerClick}
					role="button"
					tabIndex={0}
					aria-label="Giv ris eller ros"
				>
					<p className="font-bold text-sm">{'Har du ris eller ros?'}</p>
					<p className="text-xs">{'Tryk her!'}</p>
				</div>
			)}

			<div className="flex-shrink-0">
				<KioskSessionInfo />
			</div>
		</div>
	)
}
