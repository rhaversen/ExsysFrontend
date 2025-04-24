'use client'

import axios from 'axios'
import dayjs from 'dayjs'
import { type ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import SvgBarChart from '@/components/admin/statistics/SvgBarChart'
import SvgLineGraph from '@/components/admin/statistics/SvgLineGraph'
import SvgPieChart from '@/components/admin/statistics/SvgPieChart'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import type { OrderType, ProductType, OptionType, ActivityType, RoomType } from '@/types/backendDataTypes'

const getLast30Days = () => {
	const days: string[] = []
	const today = new Date()
	for (let i = 29; i >= 0; i--) {
		const d = new Date(today)
		d.setDate(today.getDate() - i)
		days.push(d.toISOString().slice(0, 10))
	}
	return days
}

// Helper to get all days in current month as ISO strings
function getAllDaysInCurrentMonth (): string[] {
	const today = new Date()
	const year = today.getFullYear()
	const month = today.getMonth()
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const arr: string[] = []
	for (let d = 1; d <= daysInMonth; d++) {
		const date = new Date(year, month, d)
		arr.push(date.toISOString().slice(0, 10))
	}
	return arr
}

// Helper to calculate order total
function getOrderTotal (order: OrderType, products: ProductType[], options: OptionType[]): number {
	let total = 0
	for (const p of order.products) {
		const prod = products.find(prod => prod._id === p._id)
		if (prod) { total += prod.price * p.quantity }
	}
	for (const o of order.options) {
		const opt = options.find(opt => opt._id === o._id)
		if (opt) { total += opt.price * o.quantity }
	}
	return total
}

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL
	const { addError } = useError()
	const [orders, setOrders] = useState<OrderType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [loading, setLoading] = useState(true)
	const [socket, setSocket] = useState<Socket | null>(null)
	const [timeRange, setTimeRange] = useState<'30days' | '7days' | 'today' | 'month'>('30days')

	// Setup websocket connection
	useEffect(() => {
		if (WS_URL == null) { return }
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)
		return () => { socketInstance.disconnect() }
	}, [WS_URL])

	// Listen for order CUD events
	useEntitySocketListeners<OrderType>(
		socket,
		'order',
		order => setOrders(prev => prev.some(o => o._id === order._id) ? prev : [...prev, order]),
		order => setOrders(prev => prev.map(o => o._id === order._id ? order : o)),
		id => setOrders(prev => prev.filter(o => o._id !== id))
	)
	// Listen for product CUD events
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		item => setProducts(prev => prev.some(p => p._id === item._id) ? prev : [...prev, item]),
		item => setProducts(prev => prev.map(p => p._id === item._id ? item : p)),
		id => setProducts(prev => prev.filter(p => p._id !== id))
	)
	// Listen for option CUD events
	useEntitySocketListeners<OptionType>(
		socket,
		'option',
		item => setOptions(prev => prev.some(o => o._id === item._id) ? prev : [...prev, item]),
		item => setOptions(prev => prev.map(o => o._id === item._id ? item : o)),
		id => setOptions(prev => prev.filter(o => o._id !== id))
	)

	// Additional socket listeners for activities and rooms
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		item => setActivities(prev => prev.some(a => a._id === item._id) ? prev : [...prev, item]),
		item => setActivities(prev => prev.map(a => a._id === item._id ? item : a)),
		id => setActivities(prev => prev.filter(a => a._id !== id))
	)

	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		item => setRooms(prev => prev.some(r => r._id === item._id) ? prev : [...prev, item]),
		item => setRooms(prev => prev.map(r => r._id === item._id ? item : r)),
		id => setRooms(prev => prev.filter(r => r._id !== id))
	)

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				let fromDate = new Date()
				const toDate = new Date()
				if (timeRange === '30days') {
					fromDate.setDate(fromDate.getDate() - 29)
				} else if (timeRange === '7days') {
					fromDate.setDate(fromDate.getDate() - 6)
				} else if (timeRange === 'month') {
					fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1)
				}
				fromDate.setHours(0, 0, 0, 0)
				toDate.setHours(23, 59, 59, 999)

				const [ordersRes, productsRes, optionsRes, activitiesRes, roomsRes] = await Promise.all([
					axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
						params: {
							fromDate: fromDate.toISOString(),
							toDate: toDate.toISOString()
						},
						withCredentials: true
					}),
					axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
					axios.get<OptionType[]>(`${API_URL}/v1/options`, { withCredentials: true }),
					axios.get<ActivityType[]>(`${API_URL}/v1/activities`, { withCredentials: true }),
					axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true })
				])
				setOrders(ordersRes.data)
				setProducts(productsRes.data)
				setOptions(optionsRes.data)
				setActivities(activitiesRes.data)
				setRooms(roomsRes.data)
			} catch (error) {
				addError(error)
			} finally {
				setLoading(false)
			}
		}
		if (API_URL != null) { fetchData() }
	}, [API_URL, addError, timeRange])

	// Prepare data for the selected range
	const days = (() => {
		if (timeRange === 'month') {
			return getAllDaysInCurrentMonth()
		}
		if (timeRange === 'today') {
			const today = new Date()
			return [today.toISOString().slice(0, 10)]
		}
		if (timeRange === '7days') {
			const arr: string[] = []
			const today = new Date()
			for (let i = 6; i >= 0; i--) {
				const d = new Date(today)
				d.setDate(today.getDate() - i)
				arr.push(d.toISOString().slice(0, 10))
			}
			return arr
		}
		return getLast30Days()
	})()

	const ordersByDay = days.map(day => orders.filter(o => o.createdAt.slice(0, 10) === day))
	const salesByDay = ordersByDay.map(dayOrders => dayOrders.reduce((sum, o) => sum + getOrderTotal(o, products, options), 0))
	const orderCountByDay = ordersByDay.map(dayOrders => dayOrders.length)
	const avgOrderValueByDay = ordersByDay.map(dayOrders => dayOrders.length ? dayOrders.reduce((sum, o) => sum + getOrderTotal(o, products, options), 0) / dayOrders.length : 0)

	// Key values
	const totalSales = salesByDay.reduce((a, b) => a + b, 0)
	const totalOrders = orders.length
	const avgOrderValue = totalOrders ? totalSales / totalOrders : 0

	// Most sold product (show amount)
	const productSales: Record<string, number> = {}
	orders.forEach(order => {
		order.products.forEach(p => {
			productSales[p.name] = (productSales[p.name] || 0) + p.quantity
		})
	})
	const mostSoldProductEntry = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]
	const mostSoldProduct = mostSoldProductEntry !== undefined ? `${mostSoldProductEntry[0]} (${mostSoldProductEntry[1]})` : '-'

	// Missed orders (pending or confirmed, not delivered)
	const missedOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed')

	// Payment status breakdown
	const paymentStatusCount = orders.reduce((acc, o) => {
		acc[o.paymentStatus] = (acc[o.paymentStatus] || 0) + 1
		return acc
	}, {} as Record<OrderType['paymentStatus'], number>)

	// Checkout method breakdown
	const checkoutMethodCount = orders.reduce((acc, o) => {
		acc[o.checkoutMethod] = (acc[o.checkoutMethod] || 0) + 1
		return acc
	}, {} as Record<OrderType['checkoutMethod'], number>)

	// Time-based analysis - Orders by hour of day
	const ordersByHour = Array(24).fill(0)
	orders.forEach(order => {
		const hour = new Date(order.createdAt).getHours()
		ordersByHour[hour]++
	})
	const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)

	// Weekdays should start with Monday
	const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
	const ordersByDayOfWeek = Array(7).fill(0)
	const salesByDayOfWeek = Array(7).fill(0)

	orders.forEach(order => {
		const jsDay = new Date(order.createdAt).getDay() // 0=Sunday, 1=Monday, ...
		const mondayFirst = (jsDay + 6) % 7 // 0=Monday, ..., 6=Sunday
		ordersByDayOfWeek[mondayFirst]++
		salesByDayOfWeek[mondayFirst] += getOrderTotal(order, products, options)
	})

	// Product popularity
	const productQuantities: Record<string, number> = {}
	const productRevenue: Record<string, number> = {}

	orders.forEach(order => {
		order.products.forEach(p => {
			const product = products.find(prod => prod._id === p._id)
			if (product) {
				productQuantities[product.name] = (productQuantities[product.name] || 0) + p.quantity
				productRevenue[product.name] = (productRevenue[product.name] || 0) + (product.price * p.quantity)
			}
		})
	})

	// Get top 5 products by quantity and revenue
	const topProductsByQuantity = Object.entries(productQuantities)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)

	const topProductsByRevenue = Object.entries(productRevenue)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)

	// Room usage analysis
	const roomOrderCounts: Record<string, number> = {}
	orders.forEach(order => {
		const roomName = rooms.find(r => r._id === order.roomId)?.name ?? 'Unknown'
		roomOrderCounts[roomName] = (roomOrderCounts[roomName] || 0) + 1
	})

	// Travleste lokale (show amount)
	const topRooms = Object.entries(roomOrderCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
	const busiestRoom = topRooms.length > 0 ? `${topRooms[0][0]} (${topRooms[0][1]})` : '-'

	// Activity analysis
	const activityOrderCounts: Record<string, number> = {}
	orders.forEach(order => {
		const activityName = activities.find(a => a._id === order.activityId)?.name ?? 'Unknown'
		activityOrderCounts[activityName] = (activityOrderCounts[activityName] || 0) + 1
	})

	const topActivities = Object.entries(activityOrderCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)

	// Option popularity
	const optionQuantities: Record<string, number> = {}
	const optionRevenue: Record<string, number> = {}

	orders.forEach(order => {
		order.options.forEach(o => {
			const option = options.find(opt => opt._id === o._id)
			if (option) {
				optionQuantities[option.name] = (optionQuantities[option.name] || 0) + o.quantity
				optionRevenue[option.name] = (optionRevenue[option.name] || 0) + (option.price * o.quantity)
			}
		})
	})

	const topOptionsByQuantity = Object.entries(optionQuantities)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)

	const topOptionsByRevenue = Object.entries(optionRevenue)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)

	// Calculate additional key metrics
	const averageProductsPerOrder = orders.length
		? orders.reduce((sum, order) => sum + order.products.reduce((s, p) => s + p.quantity, 0), 0) / orders.length
		: 0

	const busiest = {
		hour: ordersByHour.indexOf(Math.max(...ordersByHour)),
		day: ordersByDayOfWeek.indexOf(Math.max(...ordersByDayOfWeek))
	}

	const percentDelivered = orders.length
		? (orders.filter(o => o.status === 'delivered').length / orders.length) * 100
		: 0

	return (
		<main className="bg-white rounded shadow p-6 max-w-6xl mx-auto text-black">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">{'Statistik'}</h1>
				<div className="inline-flex rounded-md shadow-sm">
					<button
						onClick={() => setTimeRange('today')}
						className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${timeRange === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'I dag'}
					</button>
					<button
						onClick={() => setTimeRange('7days')}
						className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${timeRange === '7days' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'7 dage'}
					</button>
					<button
						onClick={() => setTimeRange('30days')}
						className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${timeRange === '30days' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'30 dage'}
					</button>
					<button
						onClick={() => setTimeRange('month')}
						className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'Nuværende måned'}
					</button>
				</div>
			</div>

			{loading && <div>{'Henter data...'}</div>}
			{!loading && (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
						<div className="bg-blue-50 rounded p-3">
							<div className="text-xs text-blue-700">{'Omsætning'}</div>
							<div className="text-xl font-bold">{totalSales.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}</div>
						</div>
						<div className="bg-green-50 rounded p-3">
							<div className="text-xs text-green-700">{'Antal ordrer'}</div>
							<div className="text-xl font-bold">{totalOrders}</div>
						</div>
						<div className="bg-purple-50 rounded p-3">
							<div className="text-xs text-purple-700">{'Gns. pris/ordre'}</div>
							<div className="text-xl font-bold">{avgOrderValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}</div>
						</div>
						<div className="bg-amber-50 rounded p-3">
							<div className="text-xs text-amber-700">{'Mest solgte produkt'}</div>
							<div className="text-xl font-bold">{mostSoldProduct}</div>
						</div>
						<div className="bg-indigo-50 rounded p-3">
							<div className="text-xs text-indigo-700">{'Gns. produkter pr. ordre'}</div>
							<div className="text-xl font-bold">{averageProductsPerOrder.toFixed(1)}</div>
						</div>
						<div className="bg-rose-50 rounded p-3">
							<div className="text-xs text-rose-700">{'Travleste tidspunkt'}</div>
							<div className="text-xl font-bold">{`${busiest.hour}:00 ${dayNames[busiest.day]}`}</div>
						</div>
						<div className="bg-teal-50 rounded p-3">
							<div className="text-xs text-teal-700">{'Leveringsprocent'}</div>
							<div className="text-xl font-bold">{`${percentDelivered.toFixed(1)}%`}</div>
						</div>
						<div className="bg-cyan-50 rounded p-3">
							<div className="text-xs text-cyan-700">{'Travleste lokale'}</div>
							<div className="text-xl font-bold">{busiestRoom}</div>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mb-8">
						<SvgLineGraph
							data={salesByDay}
							labels={days.map(d => dayjs(d).format('DD/MM'))}
							label="Omsætning pr. dag"
							yLabel="DKK"
							color="#2563eb"
							showTodayIndicator={timeRange === 'month'}
						/>
						<SvgLineGraph
							data={orderCountByDay}
							labels={days.map(d => dayjs(d).format('DD/MM'))}
							label="Ordrer pr. dag"
							yLabel="Antal"
							color="#16a34a"
							showTodayIndicator={timeRange === 'month'}
						/>
						<SvgLineGraph
							data={avgOrderValueByDay}
							labels={days.map(d => dayjs(d).format('DD/MM'))}
							label="Gns. pris pr. ordre"
							yLabel="DKK"
							color="#a21caf"
							showTodayIndicator={timeRange === 'month'}
						/>
						<SvgBarChart
							data={ordersByHour}
							labels={hourLabels}
							label="Ordrer fordelt på tid"
							yLabel="Antal"
							color="#6366f1"
						/>
						<SvgBarChart
							data={ordersByDayOfWeek}
							labels={dayNames}
							label="Ordrer fordelt på ugedag"
							yLabel="Antal"
							color="#f97316"
						/>
						<SvgBarChart
							data={topProductsByQuantity.map(p => p[1])}
							labels={topProductsByQuantity.map(p => p[0])}
							label="Top 5 mest solgte produkter"
							yLabel="Antal"
							color="#14b8a6"
						/>
						<SvgBarChart
							data={topProductsByRevenue.map(p => p[1])}
							labels={topProductsByRevenue.map(p => p[0])}
							label="Top 5 produkter efter omsætning"
							yLabel="DKK"
							color="#ec4899"
						/>
						{/* --- Option stats --- */}
						<SvgBarChart
							data={topOptionsByQuantity.map(o => o[1])}
							labels={topOptionsByQuantity.map(o => o[0])}
							label="Top 5 mest solgte tilvalg"
							yLabel="Antal"
							color="#0ea5e9"
						/>
						<SvgBarChart
							data={topOptionsByRevenue.map(o => o[1])}
							labels={topOptionsByRevenue.map(o => o[0])}
							label="Top 5 tilvalg efter omsætning"
							yLabel="DKK"
							color="#f59e42"
						/>
						<SvgPieChart
							data={topRooms.map(r => r[1])}
							labels={topRooms.map(r => r[0])}
							label="Ordrevolumen per lokale"
						/>
						<SvgPieChart
							data={topActivities.map(a => a[1])}
							labels={topActivities.map(a => a[0])}
							label="Ordrevolumen per aktivitet"
						/>
					</div>
					<div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-gray-50 rounded p-3">
							<div className="font-semibold mb-2">{'Betalingsstatus'}</div>
							<ul className="text-sm">
								<li>{'Gennemført: '}<b>{paymentStatusCount.successful || 0}</b></li>
								<li>{'Afventer: '}<b>{paymentStatusCount.pending || 0}</b></li>
								<li>{'Fejlet: '}<b>{paymentStatusCount.failed || 0}</b></li>
							</ul>
						</div>
						<div className="bg-gray-50 rounded p-3">
							<div className="font-semibold mb-2">{'Betalingsmetode'}</div>
							<ul className="text-sm">
								<li>{'SumUp: '}<b>{checkoutMethodCount.sumUp || 0}</b></li>
								<li>{'Senere: '}<b>{checkoutMethodCount.later || 0}</b></li>
							</ul>
						</div>
					</div>
					<div className="mb-8">
						<h2 className="text-lg font-semibold mb-2">{'Missede ordrer (ikke leveret)'}</h2>
						{missedOrders.length === 0 ? (
							<div className="text-gray-500">{'Ingen missede ordrer'}</div>
						) : (
							<table className="w-full text-sm border">
								<thead>
									<tr className="bg-gray-100">
										<th className="border px-2 py-1">{'Dato'}</th>
										<th className="border px-2 py-1">{'Status'}</th>
										<th className="border px-2 py-1">{'Betaling'}</th>
										<th className="border px-2 py-1">{'Produkter'}</th>
										<th className="border px-2 py-1">{'Total'}</th>
									</tr>
								</thead>
								<tbody>
									{missedOrders.map(order => (
										<tr key={order._id}>
											<td className="border px-2 py-1">{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</td>
											<td className="border px-2 py-1">{order.status}</td>
											<td className="border px-2 py-1">{order.paymentStatus}</td>
											<td className="border px-2 py-1">{order.products.map(p => `${p.name} (${p.quantity})`).join(', ')}</td>
											<td className="border px-2 py-1">{getOrderTotal(order, products, options).toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</>
			)}
		</main>
	)
}
