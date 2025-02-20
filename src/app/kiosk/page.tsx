'use client'

import KioskSessionInfo from '@/components/kiosk/KioskSessionInfo'
import OrderView from '@/components/kiosk/OrderView'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { convertOrderWindowFromUTC, getTimeStringFromOrderwindowTime, isCurrentTimeInOrderWindow, sortProductsByOrderwindow } from '@/lib/timeUtils'
import { type ActivityType, type KioskType, type OptionType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import { type CartType, type ViewState } from '@/types/frontendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import ProgressBar from '@/components/kiosk/ProgressBar'
import DeliveryInfoSelection from '@/components/kiosk/DeliveryInfoSelection'
import TimeoutWarningWindow from '@/components/kiosk/TimeoutWarningWindow'
import { useConfig } from '@/contexts/ConfigProvider'

export default function Page (): ReactElement {
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
	const [isActive, setIsActive] = useState(true)
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
	const [viewState, setViewState] = useState<ViewState>('welcome')
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})

	const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
	const timeoutMs = config?.configs.kioskInactivityTimeoutMs ?? 1000 * 60
	const resetTimerRef = useRef<NodeJS.Timeout>(undefined)
	const [isOrderInProgress, setIsOrderInProgress] = useState(false)

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

	// Helper function to fetch data with error handling
	const fetchData = useCallback(async (url: string, config = {}): Promise<any> => {
		const response = await axios.get(url, { withCredentials: true, ...config })
		return response.data
	}, [])

	const updateCheckoutMethods = useCallback((kioskData: KioskType) => {
		setCheckoutMethods(prev => ({
			...prev,
			sumUp: kioskData.readerId !== null && kioskData.readerId !== undefined
		}))
	}, [])

	// Process product data
	const processProductData = (product: ProductType): ProductType => ({
		...product,
		orderWindow: convertOrderWindowFromUTC(product.orderWindow)
	})

	// Process all products data
	const processProductsData = useCallback((productsData: ProductType[]): ProductType[] => {
		return productsData.map(processProductData)
	}, [])

	// Function to check if the current time has any active order windows
	const updateKioskActiveStatus = useCallback((products: ProductType[] | ProductType) => {
		let shouldBeActive = false
		if (!Array.isArray(products)) {
			shouldBeActive = isCurrentTimeInOrderWindow(products.orderWindow)
		} else if (products.length > 0) {
			shouldBeActive = products.some(product => isCurrentTimeInOrderWindow(product.orderWindow))
		}
		setIsActive(shouldBeActive)
	}, [])

	// Load all data
	const initialSetup = useCallback(async (): Promise<void> => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return

		try {
			const [
				kioskData,
				productsData,
				optionsData,
				activitiesData,
				roomsData
			]: [KioskType, ProductType[], OptionType[], ActivityType[], RoomType[]] = await Promise.all([
				fetchData(`${API_URL}/v1/kiosks/me`),
				fetchData(`${API_URL}/v1/products`),
				fetchData(`${API_URL}/v1/options`),
				fetchData(`${API_URL}/v1/activities`),
				fetchData(`${API_URL}/v1/rooms`)
			])

			const processedProducts = processProductsData(productsData)

			// Process and set data
			setKiosk(kioskData)
			setProducts(processedProducts)
			setOptions(optionsData)
			setActivities(activitiesData)
			setRooms(roomsData)

			// Update checkout methods based on kiosk data
			updateCheckoutMethods(kioskData)

			// Check if the current time has any active order windows
			updateKioskActiveStatus(processedProducts)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, fetchData, processProductsData, updateCheckoutMethods, updateKioskActiveStatus, addError])

	// Check if the current time has any active order windows every second
	useEffect(() => {
		const interval = setInterval(() => {
			updateKioskActiveStatus(products)
		}, 1000)

		return () => { clearInterval(interval) }
	}, [products, updateKioskActiveStatus])

	// Initialize on mount and when active status changes
	useEffect(() => {
		initialSetup().catch(addError)
	}, [isActive, initialSetup, addError])

	// Initialize WebSocket connection
	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return
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
			setProducts(prev => [...prev, processProductData(item)])
			if (!isActive) {
				updateKioskActiveStatus(item)
			}
		},
		item => {
			setProducts(prev => {
				const updated = processProductData(item)
				const newProducts = prev.map(p => (p._id === updated._id ? updated : p))
				updateKioskActiveStatus(newProducts)
				return newProducts
			})
		},
		id => {
			setProducts(prev => {
				const products = prev.filter(p => p._id !== id)
				updateKioskActiveStatus(products)
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
			if (kiosk === null) return
			// If the selected activity is no longer associated with the kiosk, deselect it
			if (!kiosk.activities.some(a => a._id === activity._id)) {
				setSelectedActivity(null)
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
				if (!kioskUpdate.activities.some(a => a._id === selectedActivity?._id)) {
					setSelectedActivity(null)
				}

				// If only one activity is available, select it
				if (kioskUpdate.activities.length === 1) {
					setSelectedActivity(kioskUpdate.activities[0])
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
		if (clickedView === viewState) return

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
		// Only start timer if not in activity view and no order in progress
		if (viewState !== 'welcome' && !isOrderInProgress) {
			resetTimerRef.current = setTimeout(() => {
				setShowTimeoutWarning(true)
			}, timeoutMs)
		}
	}, [timeoutMs, viewState, isOrderInProgress])

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

	// Render current view based on viewState
	const renderCurrentView = (): ReactElement | null => {
		if (!isActive) {
			return (
				<div className="fixed inset-0 flex items-center justify-center bg-black z-10">
					<div className="bg-gray-900/50 p-10 rounded-lg text-gray-500">
						<h1 className="text-2xl text-center">{'Kiosken er lukket'}</h1>
						<p className="text-center">{'Kiosken er lukket for bestillinger'}</p>
						<p className="text-center">{`Vi åbner igen kl. ${getTimeStringFromOrderwindowTime(sortProductsByOrderwindow(products)[0].orderWindow.from)}`}</p>
					</div>
				</div>
			)
		}

		switch (viewState) {
			case 'welcome':
				return (
					<div className="flex flex-col items-center justify-center h-full">
						<header className="mb-8 flex flex-col gap-5 items-center">
							<h1 className="text-gray-800 text-7xl font-bold">{'Bestilling af brød, kaffe og the'}</h1>
							<p className="text-gray-600 text-3xl">{'Tryk på knappen for at starte din bestilling'}</p>
						</header>

						<button
							onClick={() => { setViewState('activity') }}
							className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-3xl shadow-lg transition-colors"
						>
							{'Start bestilling\r'}
						</button>
					</div>
				)
			case 'activity':
				return (
					<DeliveryInfoSelection
						title="Vælg din aktivitet"
						subtitle="Vælg den aktivitet du deltager i"
						items={activities.sort((a, b) => a.name.localeCompare(b.name))}
						priorityItems={activities
							.filter(activity => kiosk?.activities.some(a => a._id === activity._id))
							.sort((a, b) => a.name.localeCompare(b.name))}
						onSelect={handleActivitySelect}
					/>
				)
			case 'room':
				return (
					<DeliveryInfoSelection
						title="Vælg dit spisested"
						subtitle="Vælg lokalet hvor bestillingen skal leveres til"
						items={rooms.sort((a, b) => a.name.localeCompare(b.name))}
						priorityItems={selectedActivity?.rooms
							.map(room => rooms.find(r => r._id === room._id) ?? room)
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
						products={products.toSorted((a, b) => a.name.localeCompare(b.name))}
						options={options.toSorted((a, b) => a.name.localeCompare(b.name))}
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
			default:
				setViewState('welcome')
				return null
		}
	}

	return (
		<div className="flex flex-col h-screen">
			<ProgressBar
				viewState={viewState}
				canClickActivity={canClickActivity}
				canClickRoom={canClickRoom}
				canClickOrder={canClickOrder}
				onProgressClick={handleProgressClick}
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

			<div className="flex-shrink-0">
				{isActive && <KioskSessionInfo />}
			</div>
		</div>
	)
}
