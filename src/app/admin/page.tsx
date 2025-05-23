'use client'

import axios from 'axios'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { FaEdit, FaChartBar } from 'react-icons/fa'
import { FiMessageSquare } from 'react-icons/fi'
import { GiCookingPot } from 'react-icons/gi'

import AllKiosksStatusManager from '@/components/admin/AllKiosksStatusManager'
import ConfigWeekdaysEditor from '@/components/admin/ConfigWeekdaysEditor'
import EntitiesTimelineOverview from '@/components/admin/EntitiesTimelineOverview'
import KioskRefresh from '@/components/admin/KioskRefresh'
import KioskStatusManager from '@/components/admin/KioskStatusManager'
import { useConfig } from '@/contexts/ConfigProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import type { OrderType, KioskType, ProductType, SessionType } from '@/types/backendDataTypes'

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
	const { config } = useConfig()
	const { currentUser } = useUser()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [sessions, setSessions] = useState<SessionType[]>([])
	const [orders, setOrders] = useState<OrderType[]>([])

	const calculateOrderStats = useCallback((ordersList: OrderType[]): void => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		// Filter needed for WebSocket events which can include orders from any date
		const todayOrders = ordersList.filter(order => {
			const orderDate = new Date(order.createdAt)
			return orderDate >= today && orderDate < tomorrow && order.paymentStatus === 'successful'
		})

		const pendingOrders = todayOrders.filter(order =>
			order.status === 'pending' || order.status === 'confirmed'
		)
		setPendingOrders(pendingOrders.length)

		const allValidOrders = todayOrders.filter(order =>
			order.status === 'pending' || order.status === 'confirmed' || order.status === 'delivered'
		)
		setTotalOrdersToday(allValidOrders.length)
	}, [])

	useEffect(() => {
		calculateOrderStats(orders)
	}, [orders, calculateOrderStats])

	const fetchData = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const [kiosksRes, productsRes, sessionsRes, ordersRes] = await Promise.all([
				axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true }),
				axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get<SessionType[]>(`${API_URL}/v1/sessions`, { withCredentials: true }),
				axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
					params: {
						fromDate: fromDate.toISOString(),
						toDate: toDate.toISOString()
					},
					withCredentials: true
				})
			])

			setKiosks(kiosksRes.data)
			setProducts(productsRes.data)
			setSessions(sessionsRes.data)
			setOrders(ordersRes.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	useEffect(() => {
		setHasMounted(true)
		fetchData().catch(() => {
			setPendingOrders(0)
			setTotalOrdersToday(0)
			setKiosks([])
			setProducts([])
			setSessions([])
			setOrders([])
		})
	}, [fetchData])

	useEntitySocket<KioskType>('kiosk', { setState: setKiosks })
	useEntitySocket<ProductType>('product', { setState: setProducts })
	useEntitySocket<SessionType>('session', { setState: setSessions })
	useEntitySocket<OrderType>('order', { setState: setOrders })

	if (!hasMounted) { return null }

	return (
		<main className="flex flex-col items-center">
			<div className="flex flex-col pt-8 gap-8 w-full max-w-3xl xl:max-w-full px-4">
				<p className="text-3xl font-bold text-gray-800 text-center">
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
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
							<AdminLinkButton
								href="/admin/kitchen"
								icon={GiCookingPot}
								text="Bestillinger"
								bgColor="bg-blue-500"
								hoverBgColor="hover:bg-blue-600"
							/>
							<AdminLinkButton
								href="/admin/modify"
								icon={FaEdit}
								text="Opsætning"
								bgColor="bg-green-500"
								hoverBgColor="hover:bg-green-600"
							/>
							<AdminLinkButton
								href="/admin/statistics"
								icon={FaChartBar}
								text="Statistik"
								bgColor="bg-purple-500"
								hoverBgColor="hover:bg-purple-600"
							/>
							<AdminLinkButton
								href="/admin/feedback"
								icon={FiMessageSquare}
								text="Brugerfeedback"
								bgColor="bg-teal-500"
								hoverBgColor="hover:bg-teal-600"
							/>
						</div>
						{/* Config Weekdays Editor */}
						<ConfigWeekdaysEditor configs={config} />
						{/* All Kiosks Status Manager */}
						<AllKiosksStatusManager kiosks={kiosks} products={products} />
						{/* Kiosk Refresh Component */}
						<KioskRefresh />
					</div>
					<div className="flex flex-col gap-6">
						{/* Kiosk Status */}
						<KioskStatusManager kiosks={kiosks} products={products} configs={config} sessions={sessions} />
						{/* Entities Timeline Overview */}
						<EntitiesTimelineOverview products={products} />
					</div>
				</div>
			</div>
		</main>
	)
}
