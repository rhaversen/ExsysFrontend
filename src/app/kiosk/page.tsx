'use client'

import ActivitySelection from '@/components/kiosk/activities/ActivitySelection'
import KioskSessionInfo from '@/components/kiosk/KioskSessionInfo'
import OrderView from '@/components/kiosk/OrderView'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { convertOrderWindowFromUTC, isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import { type ActivityType, type KioskType, type OptionType, type ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

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
				activitiesData
			]: [KioskType, ProductType[], OptionType[], ActivityType[]] = await Promise.all([
				fetchData(`${API_URL}/v1/kiosks/me`),
				fetchData(`${API_URL}/v1/products`),
				fetchData(`${API_URL}/v1/options`),
				fetchData(`${API_URL}/v1/activities`)
			])

			const processedProducts = processProductsData(productsData)

			// Process and set data
			setKiosk(kioskData)
			setProducts(processedProducts)
			setOptions(optionsData)
			setActivities(activitiesData)

			// Update checkout methods based on kiosk data
			updateCheckoutMethods(kioskData)

			// Check if the current time has any active order windows
			updateKioskActiveStatus(processedProducts)

			// If only one activity is available, select it
			if (kioskData.activities.length === 1) {
				setSelectedActivity(kioskData.activities[0])
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

	return (
		<div className="flex flex-col h-screen">
			{!isActive && (
				<div className="fixed inset-0 flex items-center justify-center bg-black z-10">
					<div className="bg-gray-900/50 p-10 rounded-lg text-gray-500">
						<h1 className="text-2xl text-center">{'Kiosken er lukket'}</h1>
						<p className="text-center">{'Kiosken er lukket for bestillinger'}</p>
					</div>
				</div>
			)}
			<div className="flex-1 overflow-y-auto">
				{selectedActivity === null && isActive && (
					<ActivitySelection
						activities={activities.filter(activity => kiosk?.activities.some(a => a._id === activity._id)).sort((a, b) => a.name.localeCompare(b.name))}
						onActivitySelect={setSelectedActivity}
					/>
				)}
				{selectedActivity !== null && kiosk !== null && isActive && (
					<OrderView
						kiosk={kiosk}
						products={products.toSorted((a, b) => a.name.localeCompare(b.name))}
						options={options.toSorted((a, b) => a.name.localeCompare(b.name))}
						activity={selectedActivity}
						checkoutMethods={checkoutMethods}
						onClose={() => { setSelectedActivity(null) }}
					/>
				)}
			</div>
			<div className="flex-shrink-0">
				{isActive && (
					<KioskSessionInfo />
				)}
			</div>
		</div>
	)
}
