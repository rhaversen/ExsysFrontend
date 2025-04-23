'use client'

import axios from 'axios'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { FaEdit, FaChartBar } from 'react-icons/fa'
import { GiCookingPot } from 'react-icons/gi'
import { io, type Socket } from 'socket.io-client'

import AllKiosksStatusManager from '@/components/admin/AllKiosksStatusManager'
import EntitiesTimelineOverview from '@/components/admin/EntitiesTimelineOverview'
import KioskRefresh from '@/components/admin/KioskRefresh'
import KioskStatusManager from '@/components/admin/KioskStatusManager'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { convertUTCOrderWindowToLocal } from '@/lib/timeUtils'
import type { OrderType, KioskType, ProductType } from '@/types/backendDataTypes'

export default function Page (): ReactElement | null {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const { currentUser } = useUser()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [socket, setSocket] = useState<Socket | null>(null)

	// Process product data
	const processProductData = (product: ProductType): ProductType => ({
		...product,
		orderWindow: convertUTCOrderWindowToLocal(product.orderWindow)
	})

	// Process all products data
	const processProductsData = useCallback((productsData: ProductType[]): ProductType[] => {
		return productsData.map(processProductData)
	}, [])

	const fetchPendingOrders = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const response = await axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
				params: {
					fromDate: fromDate.toISOString(),
					toDate: toDate.toISOString(),
					status: 'pending,confirmed',
					paymentStatus: 'successful'
				},
				withCredentials: true
			})
			const uniqueActivities = new Set(response.data.map(order => order.activityId))
			setPendingOrders(uniqueActivities.size)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchTotalOrdersToday = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const response = await axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
				params: {
					fromDate: fromDate.toISOString(),
					toDate: toDate.toISOString(),
					status: 'pending,confirmed,delivered',
					paymentStatus: 'successful'
				},
				withCredentials: true
			})
			const uniqueActivities = new Set(response.data.map(order => order.activityId))
			setTotalOrdersToday(uniqueActivities.size)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchKiosks = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true })
			setKiosks(response.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchProducts = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true })
			const processedProducts = processProductsData(response.data)
			setProducts(processedProducts)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError, processProductsData])

	useEffect(() => {
		setHasMounted(true)
		fetchPendingOrders().catch(() => { setPendingOrders(0) })
		fetchTotalOrdersToday().catch(() => { setTotalOrdersToday(0) })
		fetchKiosks().catch(() => { setKiosks([]) })
		fetchProducts().catch(() => { setProducts([]) })
	}, [API_URL, fetchPendingOrders, fetchTotalOrdersToday, fetchKiosks, fetchProducts])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '' || (process.env.NEXT_PUBLIC_WS_URL == null)) { return }
		const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL)
		setSocket(socketInstance)
		return () => { socketInstance.disconnect() }
	}, [API_URL])

	// Listen for kiosk CUD events
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		kiosk => { setKiosks(prev => [...prev, kiosk]) },
		kiosk => { setKiosks(prev => prev.map(k => k._id === kiosk._id ? kiosk : k)) },
		id => { setKiosks(prev => prev.filter(k => k._id !== id)) }
	)

	// Products
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		item => {
			setProducts(prev => {
				const updated = processProductData(item)
				return prev.some(p => p._id === updated._id)
					? prev.map(p => (p._id === updated._id ? updated : p))
					: [...prev, updated]
			})
		},
		item => {
			setProducts(prev => {
				const updated = processProductData(item)
				return prev.map(p => (p._id === updated._id ? updated : p))
			})
		},
		id => {
			setProducts(prev => prev.filter(p => p._id !== id))
		}
	)

	if (!hasMounted) { return null }

	return (
		<main className="p-8 flex flex-col items-center">
			<div className="bg-white shadow-lg rounded-lg flex flex-col gap-8 p-6 w-full max-w-2xl xl:max-w-6xl">
				<p className="text-3xl font-bold text-gray-800">
					{'Velkommen '}{((currentUser?.name) != null) ? currentUser.name : 'Gæst'}{'!'}
				</p>
				<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
					<div className="flex flex-col gap-6">
						{/* Statistics section */}
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-blue-50 p-4 rounded-lg">
								<p className="text-sm text-blue-600 mb-1">{'Antal bestillinger i dag'}</p>
								<p className="text-2xl font-bold text-blue-700">{totalOrdersToday}</p>
							</div>
							<div className="bg-amber-50 p-4 rounded-lg">
								<p className="text-sm text-amber-600 mb-1">{'Afventende bestillinger'}</p>
								<p className="text-2xl font-bold text-amber-700">{pendingOrders}</p>
							</div>
						</div>
						{/* Task selection buttons */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
							<Link href="/admin/kitchen" className="w-full">
								<div className="flex flex-col items-center justify-center py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
									<GiCookingPot className="w-12 h-12 mb-3"/>
									<span className="text-lg font-medium text-center">{'Se bestillinger'}</span>
								</div>
							</Link>
							<Link href="/admin/modify" className="w-full">
								<div className="flex flex-col items-center justify-center py-6 bg-green-500 hover:bg-green-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
									<FaEdit className="w-12 h-12 mb-3"/>
									<span className="text-lg font-medium text-center">{'Rediger opsætning'}</span>
								</div>
							</Link>
							<Link href="/admin/statistics" className="w-full">
								<div className="flex flex-col items-center justify-center py-6 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
									<FaChartBar className="w-12 h-12 mb-3"/>
									<span className="text-lg font-medium text-center">{'Se statistik'}</span>
								</div>
							</Link>
						</div>
						{/* Kiosk Refresh Component */}
						<KioskRefresh />
						{/* All Kiosks Status Manager */}
						<AllKiosksStatusManager kiosks={kiosks} products={products} />
					</div>
					<div className="flex flex-col gap-6">
						{/* Kiosk Status */}
						<KioskStatusManager kiosks={kiosks} products={products} />
						{/* Entities Timeline Overview */}
						<EntitiesTimelineOverview products={products} />
					</div>
				</div>
			</div>
		</main>
	)
}
