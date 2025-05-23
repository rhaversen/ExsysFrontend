'use client'

import axios from 'axios'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { type ReactElement, useCallback, useEffect, useState, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

import DeliveryInfoSelection from '@/components/kiosk/DeliveryInfoSelection'
import KioskFeedbackInfo from '@/components/kiosk/KioskFeedbackInfo'
import KioskSessionInfo from '@/components/kiosk/KioskSessionInfo'
import OrderView from '@/components/kiosk/OrderView'
import ProgressBar from '@/components/kiosk/ProgressBar'
import TimeoutWarningWindow from '@/components/kiosk/TimeoutWarningWindow'
import { useConfig } from '@/contexts/ConfigProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { formatRelativeDateLabel, getNextOpen, isCurrentTimeInOrderWindow, isKioskDeactivated } from '@/lib/timeUtils'
import { type ActivityType, type KioskType, type OptionType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import { type CartType, type ViewState } from '@/types/frontendDataTypes'

import 'dayjs/locale/da'

export default function Page (): ReactElement {
	dayjs.locale('da')

	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { config } = useConfig()
	const { addError } = useError()
	const router = useRouter()

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [kiosk, setKiosk] = useState<KioskType | null>(null)
	const [checkoutMethods, setCheckoutMethods] = useState({
		sumUp: false,
		later: true,
		mobilePay: false
	})
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
	const [viewState, setViewState] = useState<ViewState>('welcome')
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})

	const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
	const kioskInactivityTimeoutMs = config?.configs.kioskInactivityTimeoutMs ?? 1000 * 60
	const kioskFeedbackBannerDelayMs = config?.configs.kioskFeedbackBannerDelayMs ?? 1000 * 5
	const kioskWelcomeMessage = config?.configs.kioskWelcomeMessage ?? 'Bestilling af brød, kaffe og the'
	const resetTimerRef = useRef<NodeJS.Timeout>(undefined)
	const [isOrderInProgress, setIsOrderInProgress] = useState(false)
	const [isKioskClosedState, setIsKioskClosedState] = useState<boolean>(true)

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

	const [showFeedbackBanner, setShowFeedbackBanner] = useState(false)
	const feedbackBannerTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

	// Helper function to fetch data with error handling
	const fetchData = useCallback(async <T,>(url: string, config = {}): Promise<T> => {
		const response = await axios.get(url, { withCredentials: true, ...config })
		return response.data
	}, [])

	const updateCheckoutMethods = useCallback((kioskData: KioskType) => {
		setCheckoutMethods(prev => ({
			...prev,
			sumUp: kioskData.readerId !== null && kioskData.readerId !== undefined
		}))
	}, [])

	const updateKioskClosedState = useCallback(() => {
		if (!kiosk || !config) { return }
		const kioskIsDeactivated = kiosk != null && isKioskDeactivated(kiosk)
		const dayEnabled = !config.configs.disabledWeekdays.includes(new Date().getDay())
		const hasAvailableProducts = products.length !== 0 && products.some(
			p => p.isActive && isCurrentTimeInOrderWindow(p.orderWindow)
		)
		const kioskOpen = !kioskIsDeactivated && hasAvailableProducts && dayEnabled

		setIsKioskClosedState(!kioskOpen)
		if (!kioskOpen) {
			setSelectedActivity(null)
			setSelectedRoom(null)
			setViewState('welcome')
			setCart({ products: {}, options: {} })
		}
	}, [config, kiosk, products])

	// Load initial data
	const initialSetup = useCallback(async (): Promise<void> => {
		if (API_URL === undefined || API_URL === null || API_URL === '') { return }

		try {
			const [
				kioskData,
				productsData,
				optionsData,
				activitiesData,
				roomsData
			] = await Promise.all([
				fetchData<KioskType>(`${API_URL}/v1/kiosks/me`),
				fetchData<ProductType[]>(`${API_URL}/v1/products`),
				fetchData<OptionType[]>(`${API_URL}/v1/options`),
				fetchData<ActivityType[]>(`${API_URL}/v1/activities`),
				fetchData<RoomType[]>(`${API_URL}/v1/rooms`)
			])

			// Set data
			setKiosk(kioskData)
			setProducts(productsData)
			setOptions(optionsData)
			setActivities(activitiesData)
			setRooms(roomsData)

			// Update checkout methods based on kiosk data
			updateCheckoutMethods(kioskData)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, fetchData, updateCheckoutMethods, addError])

	// Check kiosk closed state periodically and when dependencies change
	useEffect(() => {
		updateKioskClosedState()
		const interval = setInterval(() => {
			updateKioskClosedState()
		}, 1000 * 60) // Check every minute

		return () => { clearInterval(interval) }
	}, [products, kiosk, config, updateKioskClosedState])

	// Initialize on mount
	useEffect(() => {
		initialSetup().catch(addError)
	}, [initialSetup, addError])

	// Initialize WebSocket connection
	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') { return }
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			socketInstance.disconnect()
		}
	}, [API_URL, WS_URL])

	// Products
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		item => {
			setProducts(prev => {
				const newProducts = prev.map(p => (p._id === item._id ? item : p))
				return newProducts
			})
		},
		item => {
			setProducts(prev => {
				const newProducts = prev.map(p => (p._id === item._id ? item : p))
				return newProducts
			})
		},
		id => {
			setProducts(prev => {
				const products = prev.filter(p => p._id !== id)
				return products
			})
		}
	)

	// Options
	useEntitySocketListeners<OptionType>(
		socket,
		'option',
		item => { setOptions(prev => [...prev, item]) },
		item => { setOptions(prev => prev.map(o => (o._id === item._id ? item : o))) },
		id => { setOptions(prev => prev.filter(o => o._id !== id)) }
	)

	// Activities
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		activity => { setActivities(prev => [...prev, activity]) },
		activity => {
			if (kiosk === null) { return }
			// If the selected activity is no longer associated with the kiosk, deselect it
			if (!kiosk.priorityActivities.some(a => a === activity._id)) {
				setSelectedActivity(null)
			}

			// Update selectedActivity if it's the same activity that was updated
			if (selectedActivity?._id === activity._id) {
				setSelectedActivity(activity)
			}

			// Update the activity in the activities list
			setActivities(prev => prev.map(a => (a._id === activity._id ? activity : a)))
		},
		id => {
			setActivities(prev => prev.filter(a => a._id !== id))
			if (selectedActivity?._id === id) {
				setSelectedActivity(null)
			}
		}
	)

	// Kiosk WebSocket Listeners
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		() => { }, // No add handler for kiosks
		kioskUpdate => {
			if ((kiosk !== null) && kioskUpdate._id === kiosk._id) {
				setKiosk(kioskUpdate)
				updateCheckoutMethods(kioskUpdate)

				// If the selected activity is no longer associated with the kiosk, deselect it
				if (!kioskUpdate.priorityActivities.some(a => a === selectedActivity?._id)) {
					setSelectedActivity(null)
				}

				// If only one activity is available, select it
				if (kioskUpdate.priorityActivities.length === 1) {
					const activityId = kioskUpdate.priorityActivities[0]
					const activityObj = activities.find(a => a._id === activityId) || null
					setSelectedActivity(activityObj)
				}
			}
		},
		() => {
			// If the kiosk is deleted, redirect to login
			router.push('/login-kiosk')
		}
	)

	// Rooms
	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		room => { setRooms(prev => [...prev, room]) },
		room => {
			setRooms(prev => prev.map(r => r._id === room._id ? room : r))
			if (selectedRoom?._id === room._id) {
				setSelectedRoom(room)
			}
		},
		id => {
			setRooms(prev => prev.filter(r => r._id !== id))
			if (selectedRoom?._id === id) {
				setSelectedRoom(null)
			}
		}
	)

	const updateCart = useCallback((newCart: CartType) => {
		setCart(newCart)
	}, [])

	const handleActivitySelect = (activity: ActivityType): void => {
		setSelectedActivity(activity)
		if (selectedRoom !== null) {
			setViewState('order')
		} else {
			setViewState('room')
		}
	}

	const handleRoomSelect = (room: RoomType): void => {
		setSelectedRoom(room)
		setViewState('order')
	}

	const canClickActivity = viewState !== 'activity'
	const canClickRoom = viewState !== 'room' && selectedActivity !== null
	const canClickOrder = viewState !== 'order' && selectedRoom !== null && selectedActivity !== null

	const handleProgressClick = (clickedView: ViewState): void => {
		if (clickedView === viewState) { return }

		if (clickedView === 'activity' && canClickActivity) {
			setViewState('activity')
		} else if (clickedView === 'room' && canClickRoom) {
			setViewState('room')
		} else if (clickedView === 'order' && canClickOrder) {
			setViewState('order')
		} else if (clickedView === 'welcome') {
			setViewState('welcome')
			setSelectedActivity(null)
			setSelectedRoom(null)
			updateCart({ products: {}, options: {} })
		}
	}

	const resetTimer = useCallback(() => {
		clearTimeout(resetTimerRef.current)
		// Only start timer if not on welcome screen and no order in progress
		if (viewState !== 'welcome' && !isOrderInProgress) {
			resetTimerRef.current = setTimeout(() => {
				setShowTimeoutWarning(true)
			}, kioskInactivityTimeoutMs)
		}
	}, [kioskInactivityTimeoutMs, viewState, isOrderInProgress])

	useEffect(() => {
		resetTimer()
		return () => {
			clearTimeout(resetTimerRef.current)
		}
	}, [resetTimer])

	useEffect(() => {
		const events = ['touchstart', 'touchmove', 'click', 'mousemove', 'keydown', 'scroll']
		const handleResetTimer = (): void => {
			if (!showTimeoutWarning && viewState !== 'welcome') {
				resetTimer()
			}
		}

		events.forEach(event => {
			document.addEventListener(event, handleResetTimer)
		})

		return () => {
			events.forEach(event => {
				document.removeEventListener(event, handleResetTimer)
			})
		}
	}, [resetTimer, showTimeoutWarning, viewState])

	// Effect to manage feedback banner visibility
	useEffect(() => {
		if (viewState === 'welcome') {
			feedbackBannerTimerRef.current = setTimeout(() => {
				setShowFeedbackBanner(true)
			}, kioskFeedbackBannerDelayMs)
		} else {
			clearTimeout(feedbackBannerTimerRef.current)
			setShowFeedbackBanner(false)
		}

		return () => {
			clearTimeout(feedbackBannerTimerRef.current)
		}
	}, [viewState, kioskFeedbackBannerDelayMs])

	const handleFeedbackBannerClick = () => {
		setShowFeedbackBanner(false) // Hide banner
		clearTimeout(feedbackBannerTimerRef.current) // Stop banner timer explicitly
		setViewState('feedback' as ViewState)
	}

	const handleCloseFeedbackOverlay = () => {
		setViewState('welcome')
	}

	// Render current view based on viewState
	const renderCurrentView = (): ReactElement | null => {
		switch (viewState) {
			case 'welcome':
				return (
					<div className="flex flex-col items-center justify-center h-full">
						<h1 className="text-gray-800 mb-8 text-7xl font-bold text-center">{kioskWelcomeMessage}</h1>

						<button
							onClick={() => { setViewState('activity') }}
							className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-3xl shadow-lg transition-colors"
						>
							{'Tryk her for at starte\r'}
						</button>
					</div>
				)
			case 'activity':
				if (kiosk == null) {
					setViewState('welcome')
					return null
				}
				return (
					<DeliveryInfoSelection
						title="Vælg din aktivitet"
						subtitle="Vælg den aktivitet du deltager i"
						items={
							activities
								.filter(activity => !(kiosk.disabledActivities?.includes(activity._id) ?? false))
								.sort((a, b) => a.name.localeCompare(b.name))
						}
						priorityItems={activities
							.filter(activity => kiosk.priorityActivities.some(a => a === activity._id))
							.sort((a, b) => a.name.localeCompare(b.name))}
						onSelect={handleActivitySelect}
					/>
				)
			case 'room':
				if (selectedActivity == null) {
					setViewState('activity')
					return null
				}
				return (
					<DeliveryInfoSelection
						title="Vælg dit spisested"
						subtitle="Vælg lokalet hvor bestillingen skal leveres til"
						items={
							rooms
								.filter(room => !selectedActivity.disabledRooms.includes(room._id))
								.sort((a, b) => a.name.localeCompare(b.name))
						}
						priorityItems={selectedActivity?.priorityRooms
							.map(roomId => rooms.find(r => r._id === roomId))
							.filter(room => room !== undefined)
							.sort((a, b) => a.name.localeCompare(b.name)) ?? []}
						onSelect={handleRoomSelect}
					/>
				)
			case 'order':
				if (kiosk == null || selectedActivity == null || selectedRoom == null) {
					setViewState('welcome')
					return null
				}
				return (
					<OrderView
						kiosk={kiosk}
						products={
							products
								.filter(product => !selectedActivity.disabledProducts.includes(product._id))
								.filter(product => product.isActive)
								.sort((a, b) => a.name.localeCompare(b.name))
						}
						options={options.sort((a, b) => a.name.localeCompare(b.name))}
						activity={selectedActivity}
						room={selectedRoom}
						checkoutMethods={checkoutMethods}
						cart={cart}
						updateCart={updateCart}
						onClose={(): void => {
							setSelectedActivity(null)
							setSelectedRoom(null)
							updateCart({ products: {}, options: {} })
							setViewState('welcome')
							setIsOrderInProgress(false)
						}}
						clearInactivityTimeout={(): void => {
							clearTimeout(resetTimerRef.current)
							setIsOrderInProgress(true)
						}}
					/>
				)
			case 'feedback':
				return (
					<div className="fixed bg-white inset-0 flex items-center justify-center">
						<div className="relative">
							<KioskFeedbackInfo />
							<button
								type="button"
								onClick={handleCloseFeedbackOverlay}
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

	if (isKioskClosedState) {
		const nextOpen = getNextOpen(config, kiosk, products)

		return (
			<div className="flex flex-col h-screen">
				<div className="flex-1">
					<div className="fixed inset-0 flex items-center justify-center bg-black">
						<div className="bg-gray-900/50 p-10 rounded-lg text-gray-500">
							<h1 className="text-2xl text-center">{'Lukket'}</h1>
							{!nextOpen && (
								<p className="text-center">
									{'Kiosken er lukket for bestillinger'}
								</p>
							)}
							{nextOpen && (
								<p className="text-center">
									{'Kiosken åbner igen '}{formatRelativeDateLabel(nextOpen)}
								</p>
							)}
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
		<div className="relative flex flex-col h-screen overflow-hidden"> {/* Ensure root is relative and handles overflow */}
			<ProgressBar
				viewState={viewState}
				canClickActivity={canClickActivity}
				canClickRoom={canClickRoom}
				canClickOrder={canClickOrder}
				onProgressClick={handleProgressClick}
				onReset={() => {
					setSelectedActivity(null)
					setSelectedRoom(null)
					updateCart({ products: {}, options: {} })
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
					onTimeout={() => {
						updateCart({ products: {}, options: {} })
						setSelectedActivity(null)
						setSelectedRoom(null)
						setViewState('welcome')
						setShowTimeoutWarning(false)
					}}
					onClose={() => {
						setShowTimeoutWarning(false)
						resetTimer()
					}}
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
