'use client'

import axios from 'axios'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { FaEdit, FaChartBar } from 'react-icons/fa'
import { GiCookingPot } from 'react-icons/gi'
import { io, type Socket } from 'socket.io-client'

import AllKiosksStatusManager from '@/components/admin/AllKiosksStatusManager'
import ConfigWeekdaysEditor from '@/components/admin/ConfigWeekdaysEditor'
import EntitiesTimelineOverview from '@/components/admin/EntitiesTimelineOverview'
import KioskRefresh from '@/components/admin/KioskRefresh'
import KioskStatusManager from '@/components/admin/KioskStatusManager'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import type { OrderType, KioskType, ProductType, ConfigsType } from '@/types/backendDataTypes'

const AdminLinkButton = ({ href, icon: Icon, text, bgColor, hoverBgColor }: {
	href: string
	icon: React.ElementType
	text: string
	bgColor: string
	hoverBgColor: string
}): ReactElement => (
	<Link href={href} className="flex justify-center">
		<div className={`w-3/4 md:w-full flex flex-row gap-2 md:flex-col items-center justify-center py-3 md:py-6 ${bgColor} ${hoverBgColor} text-white rounded-lg transition transform hover:scale-105 shadow-md h-full`}>
			<Icon className="w-7 h-7 md:w-12 md:h-12" />
			<span className="text-lg font-medium text-center">{text}</span>
		</div>
	</Link>
)

export default function Page (): ReactElement | null {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const { currentUser } = useUser()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [configs, setConfigs] = useState<ConfigsType | null>(null)
	const [socket, setSocket] = useState<Socket | null>(null)

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
			const processedProducts = response.data
			setProducts(processedProducts)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchConfigs = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<ConfigsType>(`${API_URL}/v1/configs`, { withCredentials: true })
			setConfigs(response.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	useEffect(() => {
		setHasMounted(true)
		fetchPendingOrders().catch(() => { setPendingOrders(0) })
		fetchTotalOrdersToday().catch(() => { setTotalOrdersToday(0) })
		fetchKiosks().catch(() => { setKiosks([]) })
		fetchProducts().catch(() => { setProducts([]) })
		fetchConfigs().catch(() => { setConfigs(null) })
	}, [API_URL, fetchPendingOrders, fetchTotalOrdersToday, fetchKiosks, fetchProducts, fetchConfigs])

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
				return prev.some(p => p._id === item._id)
					? prev.map(p => (p._id === item._id ? item : p))
					: [...prev, item]
			})
		},
		item => {
			setProducts(prev => {
				return prev.map(p => (p._id === item._id ? item : p))
			})
		},
		id => {
			setProducts(prev => prev.filter(p => p._id !== id))
		}
	)

	// Listen for config CUD events
	useEntitySocketListeners<ConfigsType>(
		socket,
		'configsUpdated',
		config => setConfigs(config),
		config => setConfigs(config),
		() => {}
	)

	if (!hasMounted) { return null }

	return (
		<main className="p-0 pt-2 md:p-8 flex flex-col items-center">
			<div className="bg-white shadow-lg rounded-lg flex flex-col gap-8 p-3 sm:p-6 w-full max-w-3xl xl:max-w-[90rem]">
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
							<AdminLinkButton
								href="/admin/kitchen"
								icon={GiCookingPot}
								text="Se bestillinger"
								bgColor="bg-blue-500"
								hoverBgColor="hover:bg-blue-600"
							/>
							<AdminLinkButton
								href="/admin/modify"
								icon={FaEdit}
								text="Rediger opsætning"
								bgColor="bg-green-500"
								hoverBgColor="hover:bg-green-600"
							/>
							<AdminLinkButton
								href="/admin/statistics"
								icon={FaChartBar}
								text="Se statistik"
								bgColor="bg-purple-500"
								hoverBgColor="hover:bg-purple-600"
							/>
						</div>
						{/* Kiosk Refresh Component */}
						<KioskRefresh />
						{/* All Kiosks Status Manager */}
						<AllKiosksStatusManager kiosks={kiosks} products={products} />
						{/* Config Weekdays Editor */}
						<ConfigWeekdaysEditor configs={configs} />
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
