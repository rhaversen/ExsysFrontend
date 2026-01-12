'use client'

import dayjs from 'dayjs'
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import DeliveryInfoSelection from '@/components/kiosk/DeliveryInfoSelection'
import KioskFeedbackInfo from '@/components/kiosk/KioskFeedbackInfo'
import KioskSessionInfo from '@/components/kiosk/KioskSessionInfo'
import OrderView from '@/components/kiosk/OrderView'
import ProgressBar from '@/components/kiosk/ProgressBar'
import TimeoutWarningWindow from '@/components/kiosk/TimeoutWarningWindow'
import { useConfig } from '@/contexts/ConfigProvider'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { useKioskData } from '@/hooks/useKioskData'
import { formatRelativeDateLabel, getNextOpen } from '@/lib/timeUtils'
import { type CartType, type ViewState } from '@/types/frontendDataTypes'

import 'dayjs/locale/da'

dayjs.locale('da')

const EMPTY_CART: CartType = { products: {}, options: {} }

export default function Page (): ReactElement {
	const { config } = useConfig()

	const {
		kiosk,
		products,
		options,
		activities,
		rooms,
		checkoutMethods,
		isKioskClosed,
		selectedActivity,
		setSelectedActivity,
		selectedRoom,
		setSelectedRoom
	} = useKioskData()

	const [viewState, setViewState] = useState<ViewState>('welcome')
	const [cart, setCart] = useState<CartType>(EMPTY_CART)
	const [isOrderInProgress, setIsOrderInProgress] = useState(false)

	const kioskInactivityTimeoutMs = config?.configs.kioskInactivityTimeoutMs ?? 60000
	const kioskFeedbackBannerDelayMs = config?.configs.kioskFeedbackBannerDelayMs ?? 5000
	const kioskWelcomeMessage = config?.configs.kioskWelcomeMessage ?? 'Bestilling af brød, kaffe og the'

	const resetSession = useCallback(() => {
		setSelectedActivity(null)
		setSelectedRoom(null)
		setCart(EMPTY_CART)
		setViewState('welcome')
		setIsOrderInProgress(false)
	}, [setSelectedActivity, setSelectedRoom])

	const isTimerEnabled = viewState !== 'welcome' && viewState !== 'feedback' && !isOrderInProgress

	const { showWarning: showTimeoutWarning, dismissWarning: dismissTimeoutWarning, handleTimeout } = useInactivityTimeout({
		timeoutMs: kioskInactivityTimeoutMs,
		enabled: isTimerEnabled,
		onTimeout: resetSession
	})

	const [showFeedbackBanner, setShowFeedbackBanner] = useState(false)
	const feedbackBannerTimerRef = useRef<NodeJS.Timeout>(undefined)

	useEffect(() => {
		if (viewState === 'welcome') {
			feedbackBannerTimerRef.current = setTimeout(() => {
				setShowFeedbackBanner(true)
			}, kioskFeedbackBannerDelayMs)
		} else {
			clearTimeout(feedbackBannerTimerRef.current)
			setShowFeedbackBanner(false)
		}
		return () => clearTimeout(feedbackBannerTimerRef.current)
	}, [viewState, kioskFeedbackBannerDelayMs])

	useEffect(() => {
		if (isKioskClosed) {
			resetSession()
		}
	}, [isKioskClosed, resetSession])

	const handleActivitySelect = useCallback((activity: typeof selectedActivity) => {
		if (!activity) { return }
		setSelectedActivity(activity)
		setViewState(selectedRoom ? 'order' : 'room')
	}, [selectedRoom, setSelectedActivity])

	const handleRoomSelect = useCallback((room: typeof selectedRoom) => {
		if (!room) { return }
		setSelectedRoom(room)
		setViewState('order')
	}, [setSelectedRoom])

	const canClickActivity = viewState !== 'activity'
	const canClickRoom = viewState !== 'room' && selectedActivity !== null
	const canClickOrder = viewState !== 'order' && selectedRoom !== null && selectedActivity !== null

	const handleProgressClick = useCallback((clickedView: ViewState) => {
		if (clickedView === viewState) { return }

		switch (clickedView) {
			case 'activity':
				if (canClickActivity) { setViewState('activity') }
				break
			case 'room':
				if (canClickRoom) { setViewState('room') }
				break
			case 'order':
				if (canClickOrder) { setViewState('order') }
				break
			case 'welcome':
				resetSession()
				break
		}
	}, [viewState, canClickActivity, canClickRoom, canClickOrder, resetSession])

	const handleOrderClose = useCallback(() => {
		resetSession()
	}, [resetSession])

	const handleFeedbackBannerClick = useCallback(() => {
		clearTimeout(feedbackBannerTimerRef.current)
		setShowFeedbackBanner(false)
		setViewState('feedback')
	}, [])

	const filteredActivities = useMemo(() => {
		if (!kiosk) { return [] }
		return activities
			.filter(activity => !kiosk.disabledActivities?.includes(activity._id))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [activities, kiosk])

	const priorityActivities = useMemo(() => {
		if (!kiosk) { return [] }
		return activities
			.filter(activity => kiosk.priorityActivities.includes(activity._id))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [activities, kiosk])

	const filteredRooms = useMemo(() => {
		if (!selectedActivity) { return [] }
		return rooms
			.filter(room => !selectedActivity.disabledRooms.includes(room._id))
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [rooms, selectedActivity])

	const priorityRooms = useMemo(() => {
		if (!selectedActivity) { return [] }
		return selectedActivity.priorityRooms
			.map(roomId => rooms.find(r => r._id === roomId))
			.filter((room): room is NonNullable<typeof room> => room !== undefined)
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [rooms, selectedActivity])

	const filteredProducts = useMemo(() => {
		if (!selectedActivity) { return [] }
		return products
			.filter(product => !selectedActivity.disabledProducts.includes(product._id))
			.filter(product => product.isActive)
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [products, selectedActivity])

	const sortedOptions = useMemo(() => {
		return options.sort((a, b) => a.name.localeCompare(b.name))
	}, [options])

	const renderCurrentView = (): ReactElement | null => {
		switch (viewState) {
			case 'welcome':
				return (
					<div className="flex flex-col items-center justify-center h-full">
						<h1 className="text-gray-800 mb-8 text-7xl font-bold text-center">
							{kioskWelcomeMessage}
						</h1>
						<button
							onClick={() => setViewState('activity')}
							className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-3xl shadow-lg transition-colors"
						>
							{'Tryk her for at starte'}
						</button>
					</div>
				)

			case 'activity':
				if (!kiosk) {
					setViewState('welcome')
					return null
				}
				return (
					<DeliveryInfoSelection
						title="Vælg din aktivitet"
						subtitle="Vælg den aktivitet du deltager i"
						items={filteredActivities}
						priorityItems={priorityActivities}
						currentSelectionId={selectedActivity?._id}
						onSelect={handleActivitySelect}
					/>
				)

			case 'room':
				if (!selectedActivity) {
					setViewState('activity')
					return null
				}
				return (
					<DeliveryInfoSelection
						title="Vælg dit spisested"
						subtitle="Vælg lokalet hvor bestillingen skal leveres til"
						items={filteredRooms}
						priorityItems={priorityRooms}
						currentSelectionId={selectedRoom?._id}
						onSelect={handleRoomSelect}
					/>
				)

			case 'order':
				if (!kiosk || !selectedActivity || !selectedRoom) {
					if (!selectedActivity) {
						setSelectedRoom(null)
						setViewState('activity')
					} else if (!selectedRoom) {
						setViewState('room')
					} else {
						setViewState('activity')
					}
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
						onOrderStart={() => setIsOrderInProgress(true)}
						onOrderEnd={() => setIsOrderInProgress(false)}
					/>
				)

			case 'feedback':
				return (
					<div className="fixed bg-white inset-0 flex items-center justify-center">
						<div className="relative">
							<KioskFeedbackInfo />
							<button
								type="button"
								onClick={() => setViewState('welcome')}
								className="mt-6 w-full px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
							>
								{'Tilbage'}
							</button>
						</div>
					</div>
				)

			default:
				setViewState('welcome')
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
									: 'Kiosken er lukket for bestillinger'
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
			<ProgressBar
				viewState={viewState}
				canClickActivity={canClickActivity}
				canClickRoom={canClickRoom}
				canClickOrder={canClickOrder}
				onProgressClick={handleProgressClick}
				onReset={() => {
					setSelectedActivity(null)
					setSelectedRoom(null)
					setCart(EMPTY_CART)
					setViewState('activity')
				}}
				selectedActivity={selectedActivity}
				selectedRoom={selectedRoom}
			/>

			<div className="flex-1 overflow-y-auto">
				{renderCurrentView()}
			</div>

			{showTimeoutWarning && (
				<TimeoutWarningWindow
					onTimeout={handleTimeout}
					onClose={dismissTimeoutWarning}
				/>
			)}

			{viewState !== 'feedback' && showFeedbackBanner && (
				<div
					className="fixed bottom-10 right-6 bg-blue-500 text-white px-5 py-3 rounded-lg shadow-xl z-40"
					onClick={handleFeedbackBannerClick}
					role="button"
					tabIndex={0}
					aria-label="Giv ris eller ros"
				>
					<p className="font-bold text-sm">{'Har du ris eller ros?'}</p>
					<p className="text-xs">{'Tryk her for at give feedback!'}</p>
				</div>
			)}

			<div className="flex-shrink-0">
				<KioskSessionInfo />
			</div>
		</div>
	)
}
