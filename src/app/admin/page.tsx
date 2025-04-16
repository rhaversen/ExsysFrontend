'use client'

import { useUser } from '@/contexts/UserProvider'
import type { OrderType, KioskType, ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { useCallback, useEffect, useState, type ReactElement } from 'react'
import { GiCookingPot } from 'react-icons/gi'
import { FaEdit, FaChartBar, FaSyncAlt } from 'react-icons/fa'
import CloseableModal from '@/components/ui/CloseableModal'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { io, type Socket } from 'socket.io-client'
import KioskStatusManager from '@/components/admin/KioskStatusManager'
import AllKiosksStatusManager from '@/components/admin/AllKiosksStatusManager'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'

export default function Page (): ReactElement | null {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { currentUser } = useUser()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [showRefreshModal, setShowRefreshModal] = useState(false)
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [socket, setSocket] = useState<Socket | null>(null)

	// Process product data
	const processProductData = (product: ProductType): ProductType => ({
		...product,
		orderWindow: convertOrderWindowFromUTC(product.orderWindow)
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
			console.error(error)
		}
	}, [API_URL])

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
			console.error(error)
		}
	}, [API_URL])

	const fetchKiosks = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true })
			setKiosks(response.data)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL])

	const fetchProducts = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true })
			const processedProducts = processProductsData(response.data)
			setProducts(processedProducts)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL, processProductsData])

	const handleForceRefresh = async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/service/force-kiosk-refresh`, {
				withCredentials: true
			})
			setShowRefreshModal(false)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		setHasMounted(true)
		fetchPendingOrders().catch(() => { setPendingOrders(0) })
		fetchTotalOrdersToday().catch(() => { setTotalOrdersToday(0) })
		fetchKiosks().catch(() => { setKiosks([]) })
		fetchProducts().catch(() => { setProducts([]) })
	}, [API_URL, fetchPendingOrders, fetchTotalOrdersToday, fetchKiosks, fetchProducts])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '' || (process.env.NEXT_PUBLIC_WS_URL == null)) return
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

	if (!hasMounted) return null

	return (
		<main className="p-8 flex flex-col items-center">
			<div className="bg-white shadow-lg rounded-lg flex flex-col gap-8 p-6 w-full max-w-2xl">

				{/* Welcome */}
				<p className="text-3xl font-bold text-gray-800">
					{'Velkommen '}{((currentUser?.name) != null) ? currentUser.name : 'Gæst'}{'!'}
				</p>

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
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
					<Link href="/admin/kitchen" className="w-full">
						<div className="flex flex-col items-center justify-center py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
							<GiCookingPot className="w-12 h-12 mb-3"/>
							<span className="text-lg font-medium">{'Se bestillinger'}</span>
						</div>
					</Link>
					<Link href="/admin/modify" className="w-full">
						<div className="flex flex-col items-center justify-center py-6 bg-green-500 hover:bg-green-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
							<FaEdit className="w-12 h-12 mb-3"/>
							<span className="text-lg font-medium">{'Rediger opsætning'}</span>
						</div>
					</Link>
					<Link href="/admin/statistics" className="w-full">
						<div className="flex flex-col items-center justify-center py-6 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
							<FaChartBar className="w-12 h-12 mb-3"/>
							<span className="text-lg font-medium">{'Se statistik'}</span>
						</div>
					</Link>
				</div>

				{/* Kiosk Refresh */}
				<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
					<FaSyncAlt className="text-blue-500 text-2xl" />
					<div className="flex flex-col flex-grow px-4">
						<span className="text-lg text-gray-800">
							{'Genindlæs kiosker'}
						</span>
						<div className="text-sm text-gray-600">
							{'Tvinger alle kiosker til at genindlæse deres interface'}
						</div>
					</div>
					<button
						type="button"
						onClick={() => { setShowRefreshModal(true) }}
						className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md"
					>
						{'Genindlæs'}
					</button>
				</div>

				{/* All Kiosks Status Manager */}
				<AllKiosksStatusManager
					kiosks={kiosks}
					products={products}
				/>

				{/* Kiosk Status */}
				<KioskStatusManager
					kiosks={kiosks}
					products={products}
				/>
			</div>

			{showRefreshModal && (
				<CloseableModal
					canClose={true}
					canComplete={true}
					onClose={() => { setShowRefreshModal(false) }}
					onComplete={() => { void handleForceRefresh() }}
				>
					<div className="text-center flex flex-col gap-4">
						<FaSyncAlt className="text-blue-500 text-4xl mx-auto" />
						<h2 className="text-2xl font-bold text-gray-800">
							{'Genindlæs alle kiosker?'}
						</h2>
						<div className="text-left">
							<p className="text-gray-700 text-lg font-medium">
								{'Dette vil tvinge alle kiosker til at genindlæse deres interface.'}
							</p>
							<p className="text-gray-600">
								{'Genindlæsningen sker øjeblikkeligt og kan ikke fortrydes.'}
							</p>
							<p className="text-gray-600">
								{'Igangværende bestillinger vil blive nulstillet, men færdige bestillinger vil ikke blive påvirket.'}
							</p>
							<p className="text-gray-600">
								{'Brug kun denne funktion hvis det er nødvendigt, eller uden for åbningstiderne.'}
							</p>
						</div>
						<div className="flex gap-4 justify-center pt-2">
							<button
								type="button"
								onClick={() => { setShowRefreshModal(false) }}
								className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800"
							>
								{'Annuller'}
							</button>
							<button
								type="button"
								onClick={() => { void handleForceRefresh() }}
								className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
							>
								{'Genindlæs'}
							</button>
						</div>
					</div>
				</CloseableModal>
			)}
		</main>
	)
}
