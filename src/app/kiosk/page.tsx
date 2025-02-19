'use client'

import ActivitySelection from '@/components/kiosk/ActivitySelection'
import KioskSessionInfo from '@/components/kiosk/KioskSessionInfo'
import OrderView from '@/components/kiosk/OrderView'
import RoomSelection from '@/components/kiosk/RoomSelection'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { convertOrderWindowFromUTC, isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import { type ActivityType, type KioskType, type OptionType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import { type ViewState } from '@/types/frontendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import ProgressBar from '@/components/kiosk/ProgressBar'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

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
	const [viewState, setViewState] = useState<ViewState>('activity')
	const [isChangingRoom, setIsChangingRoom] = useState(false)
	// State to backup the current room when changing rooms
	const [prevRoom, setPrevRoom] = useState<RoomType | null>(null)

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

			// If only one activity is available, select it
			if (kioskData.activities.length === 1) {
				const activity = kioskData.activities[0]
				setSelectedActivity(activity)
				// If the activity has only one room, select it
				if (activity.rooms.length === 1) {
					const room = roomsData.find(r => r._id === activity.rooms[0]._id)
					if (room != null) {
						setSelectedRoom(room)
						setViewState('order')
					}
				} else {
					setViewState('room')
				}
			} else {
				setSelectedActivity(null)
			}
		} catch (error) {
			addError(error)
		}
	}, [API_URL, fetchData, processProductsData, updateCheckoutMethods, updateKioskActiveStatus, addError])

	// Check if the current time has any active order windows every minute
	useEffect(() => {
		const interval = setInterval(() => {
			updateKioskActiveStatus(products)
		}, 60000)

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

	const handleActivitySelect = (activity: ActivityType): void => {
		setSelectedActivity(activity)
		if (activity.rooms.length === 1) {
			const room = rooms.find(r => r._id === activity.rooms[0]._id)
			if (room != null) {
				setSelectedRoom(room)
				setViewState('order')
			}
		} else {
			setViewState('room')
		}
	}

	const handleBack = (): void => {
		if (isChangingRoom) {
			setSelectedRoom(prevRoom)
			setIsChangingRoom(false)
			setViewState('order')
		} else {
			switch (viewState) {
				case 'room':
					setSelectedActivity(null)
					setViewState('activity')
					break
				case 'order':
					if (kiosk?.activities.length === 1) {
						setSelectedRoom(null)
						setViewState('room')
					} else {
						setSelectedActivity(null)
						setSelectedRoom(null)
						setViewState('activity')
					}
					break
			}
		}
	}

	const handleRoomSelect = (room: RoomType): void => {
		setSelectedRoom(room)
		setIsChangingRoom(false)
		setViewState('order')
	}

	const canClickActivity = (): boolean => {
		return viewState === 'room' || viewState === 'order'
	}

	const canClickRoom = (): boolean => {
		return (viewState === 'order' || viewState === 'activity') && selectedActivity !== null
	}

	const handleProgressClick = (clickedView: ViewState): void => {
		if (clickedView === viewState) return

		if (clickedView === 'activity' && canClickActivity()) {
			reset()
		} else if (clickedView === 'room' && canClickRoom()) {
			if (viewState === 'order') {
				setPrevRoom(selectedRoom)
				setIsChangingRoom(true)
			}
			setSelectedRoom(null)
			setViewState('room')
		}
	}

	const reset = (): void => {
		setSelectedActivity(null)
		setSelectedRoom(null)
		setPrevRoom(null)
		setIsChangingRoom(false)
		setViewState('activity')
	}

	// Render current view based on viewState
	const renderCurrentView = (): ReactElement | null => {
		if (!isActive) {
			return (
				<div className="fixed inset-0 flex items-center justify-center bg-black z-10">
					<div className="bg-gray-900/50 p-10 rounded-lg text-gray-500">
						<h1 className="text-2xl text-center">{'Kiosken er lukket'}</h1>
						<p className="text-center">{'Kiosken er lukket for bestillinger'}</p>
					</div>
				</div>
			)
		}

		switch (viewState) {
			case 'activity':
				return (
					<ActivitySelection
						activities={activities
							.filter(activity => kiosk?.activities.some(a => a._id === activity._id))
							.sort((a, b) => a.name.localeCompare(b.name))}
						onActivitySelect={handleActivitySelect}
					/>
				)
			case 'room':
				return (
					<RoomSelection
						rooms={isChangingRoom
							? rooms.sort((a, b) => a.name.localeCompare(b.name))
							: rooms.filter(room => selectedActivity?.rooms.some(r => r._id === room._id))
								.sort((a, b) => a.name.localeCompare(b.name))}
						onRoomSelect={handleRoomSelect}
						onBack={handleBack}
						onReset={reset}
						selectedActivity={selectedActivity?.name ?? ''}
					/>
				)
			case 'order':
				return (kiosk != null) && (selectedActivity != null) && (selectedRoom != null)
					? (
						<OrderView
							kiosk={kiosk}
							products={products.toSorted((a, b) => a.name.localeCompare(b.name))}
							options={options.toSorted((a, b) => a.name.localeCompare(b.name))}
							activity={selectedActivity}
							room={selectedRoom}
							checkoutMethods={checkoutMethods}
							onClose={reset}
						/>
					)
					: null
		}
	}

	return (
		<div className="flex flex-col h-screen">
			<ProgressBar
				viewState={viewState}
				canClickActivity={canClickActivity}
				canClickRoom={canClickRoom}
				onProgressClick={handleProgressClick}
				selectedActivity={selectedActivity}
				selectedRoom={selectedRoom}
			/>

			<div className="flex-1 overflow-y-auto">
				{renderCurrentView()}
			</div>

			<div className="flex-shrink-0">
				{isActive && <KioskSessionInfo />}
			</div>
		</div>
	)
}
