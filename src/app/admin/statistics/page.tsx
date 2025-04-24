'use client'

import axios from 'axios'
import dayjs from 'dayjs'
import { type ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { FiCheck, FiClock, FiDollarSign, FiAlertTriangle, FiCoffee, FiPackage } from 'react-icons/fi'
import { io, type Socket } from 'socket.io-client'

import SvgBarChart from '@/components/admin/statistics/SvgBarChart'
import SvgLineGraph from '@/components/admin/statistics/SvgLineGraph'
import SvgPieChart from '@/components/admin/statistics/SvgPieChart'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import type { OrderType, ProductType, OptionType, ActivityType, RoomType, KioskType } from '@/types/backendDataTypes'

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
		const mm = String(month + 1).padStart(2, '0')
		const dd = String(d).padStart(2, '0')
		arr.push(`${year}-${mm}-${dd}`)
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
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [loading, setLoading] = useState(true)
	const [socket, setSocket] = useState<Socket | null>(null)
	const [timeRange, setTimeRange] = useState<'30days' | '7days' | 'today' | 'month'>('30days')
	const [currentTime, setCurrentTime] = useState<Date>(new Date())
	const [orderSort, setOrderSort] = useState<{
		field: 'createdAt' | 'status' | 'paymentStatus' | 'room' | 'kiosk' | 'products' | 'total',
		direction: 'asc' | 'desc'
	}>({ field: 'createdAt', direction: 'desc' })

	// Update current time every minute to refresh relative times
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date())
		}, 60000) // Update every minute

		return () => clearInterval(timer)
	}, [])

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
	// Listen for activity CUD events
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		item => setActivities(prev => prev.some(a => a._id === item._id) ? prev : [...prev, item]),
		item => setActivities(prev => prev.map(a => a._id === item._id ? item : a)),
		id => setActivities(prev => prev.filter(a => a._id !== id))
	)
	// Listen for room CUD events
	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		item => setRooms(prev => prev.some(r => r._id === item._id) ? prev : [...prev, item]),
		item => setRooms(prev => prev.map(r => r._id === item._id ? item : r)),
		id => setRooms(prev => prev.filter(r => r._id !== id))
	)
	// Listen for kiosk CUD events
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		item => setKiosks(prev => prev.some(k => k._id === item._id) ? prev : [...prev, item]),
		item => setKiosks(prev => prev.map(k => k._id === item._id ? item : k)),
		id => setKiosks(prev => prev.filter(k => k._id !== id))
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

				const [ordersRes, productsRes, optionsRes, activitiesRes, roomsRes, kiosksRes] = await Promise.all([
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
					axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true }),
					axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true })
				])
				setOrders(ordersRes.data)
				setProducts(productsRes.data)
				setOptions(optionsRes.data)
				setActivities(activitiesRes.data)
				setRooms(roomsRes.data)
				setKiosks(kiosksRes.data)
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

	// Generate hourly data for today mode
	const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
	const today = new Date().toISOString().slice(0, 10)

	// Group orders by hour for today
	const ordersByHourToday = Array(24).fill(0).map((_, hour) => {
		if (timeRange !== 'today') { return [] }

		return orders.filter(o => {
			const orderDate = new Date(o.createdAt)
			return orderDate.toISOString().slice(0, 10) === today &&
				   orderDate.getHours() === hour
		})
	})

	// Generate data for charts based on time range
	const [chartData, chartLabels] = (() => {
		if (timeRange === 'today') {
			// For today: use hourly data
			const salesByHour = ordersByHourToday.map(hourOrders =>
				hourOrders.reduce((sum, o) => sum + getOrderTotal(o, products, options), 0)
			)
			const orderCountByHour = ordersByHourToday.map(hourOrders => hourOrders.length)
			const avgOrderValueByHour = ordersByHourToday.map(hourOrders =>
				hourOrders.length ? hourOrders.reduce((sum, o) => sum + getOrderTotal(o, products, options), 0) / hourOrders.length : 0
			)

			return [
				{ sales: salesByHour, orders: orderCountByHour, avgValue: avgOrderValueByHour },
				hours
			]
		} else {
			// For other views: use daily data
			const ordersByDay = days.map(day => orders.filter(o => o.createdAt.slice(0, 10) === day))
			const salesByDay = ordersByDay.map(dayOrders => dayOrders.reduce((sum, o) => sum + getOrderTotal(o, products, options), 0))
			const orderCountByDay = ordersByDay.map(dayOrders => dayOrders.length)
			const avgOrderValueByDay = ordersByDay.map(dayOrders =>
				dayOrders.length ? dayOrders.reduce((sum, o) => sum + getOrderTotal(o, products, options), 0) / dayOrders.length : 0
			)

			return [
				{ sales: salesByDay, orders: orderCountByDay, avgValue: avgOrderValueByDay },
				days.map(d => dayjs(d).format('DD/MM'))
			]
		}
	})()

	// Key values
	const totalSales = timeRange === 'today'
		? chartData.sales.reduce((a, b) => a + b, 0)
		: chartData.sales.reduce((a, b) => a + b, 0)
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

	// Kiosk usage analysis
	const kioskOrderCounts: Record<string, number> = {}
	orders.forEach(order => {
		const kioskName = kiosks.find(k => k._id === order.kioskId)?.name ?? 'Unknown'
		kioskOrderCounts[kioskName] = (kioskOrderCounts[kioskName] || 0) + 1
	})

	// Travleste kiosk (show amount)
	const topKiosks = Object.entries(kioskOrderCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
	const busiestKiosk = topKiosks.length > 0 ? `${topKiosks[0][0]} (${topKiosks[0][1]})` : '-'

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

	// Display strings for key metrics when no orders exist
	const totalSalesDisplay = totalSales.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })
	const avgOrderValueDisplay = totalOrders
		? avgOrderValue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })
		: '-'
	const avgProductsDisplay = totalOrders
		? averageProductsPerOrder.toFixed(1)
		: '-'
	const busiestTimeDisplay = totalOrders
		? `${busiest.hour}:00 ${dayNames[busiest.day]}`
		: '-'
	const deliveryPercentDisplay = totalOrders
		? `${percentDelivered.toFixed(1)}%`
		: '-'

	return (
		<main className="bg-white rounded shadow p-6 max-w-6xl mx-auto text-black">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">{'Statistik'}</h1>
				<div className="inline-flex rounded-md shadow-sm">
					<button
						onClick={() => setTimeRange('today')}
						className={`px-4 py-2 text-sm font-medium rounded-l-lg border border-black ${timeRange === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'I dag'}
					</button>
					<button
						onClick={() => setTimeRange('7days')}
						className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-black ${timeRange === '7days' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'7 dage'}
					</button>
					<button
						onClick={() => setTimeRange('30days')}
						className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-black ${timeRange === '30days' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'30 dage'}
					</button>
					<button
						onClick={() => setTimeRange('month')}
						className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r border-black ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
					>
						{'Nuværende måned'}
					</button>
				</div>
			</div>

			{loading && <div>{'Henter data...'}</div>}
			{!loading && (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
						<div className="bg-blue-50 rounded p-3" title="Total omsætning for den valgte periode">
							<div className="text-xs text-blue-700">{'Omsætning'}</div>
							<div className="text-xl font-bold">{totalSalesDisplay}</div>
						</div>
						<div className="bg-green-50 rounded p-3" title="Antal bestillinger i den valgte periode">
							<div className="text-xs text-green-700">{'Antal ordrer'}</div>
							<div className="text-xl font-bold">{totalOrders}</div>
						</div>
						<div className="bg-purple-50 rounded p-3" title="Gennemsnitlig beløb pr. bestilling">
							<div className="text-xs text-purple-700">{'Gns. pris/ordre'}</div>
							<div className="text-xl font-bold">{avgOrderValueDisplay}</div>
						</div>
						<div className="bg-amber-50 rounded p-3" title="Det produkt der er solgt flest af (med antal)">
							<div className="text-xs text-amber-700">{'Mest solgte produkt'}</div>
							<div className="text-xl font-bold">{mostSoldProduct}</div>
						</div>
						<div className="bg-indigo-50 rounded p-3" title="Gennemsnitligt antal produkter i hver bestilling">
							<div className="text-xs text-indigo-700">{'Gns. produkter pr. ordre'}</div>
							<div className="text-xl font-bold">{avgProductsDisplay}</div>
						</div>
						<div className="bg-rose-50 rounded p-3" title="Tidspunktet med flest bestillinger (time og ugedag)">
							<div className="text-xs text-rose-700">{'Travleste tidspunkt'}</div>
							<div className="text-xl font-bold">{busiestTimeDisplay}</div>
						</div>
						<div className="bg-teal-50 rounded p-3" title="Procentdel af ordrer der er markeret som leveret">
							<div className="text-xs text-teal-700">{'Leveringsprocent'}</div>
							<div className="text-xl font-bold">{deliveryPercentDisplay}</div>
						</div>
						<div className="bg-cyan-50 rounded p-3" title="Lokalet med flest bestillinger (med antal)">
							<div className="text-xs text-cyan-700">{'Travleste lokale'}</div>
							<div className="text-xl font-bold">{busiestRoom}</div>
						</div>
						<div className="bg-orange-50 rounded p-3" title="Kiosken med flest bestillinger (med antal)">
							<div className="text-xs text-orange-700">{'Travleste kiosk'}</div>
							<div className="text-xl font-bold">{busiestKiosk}</div>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mb-8">
						<SvgLineGraph
							data={chartData.sales}
							labels={chartLabels}
							label={`Omsætning pr. ${timeRange === 'today' ? 'time' : 'dag'}`}
							yLabel="DKK"
							color="#2563eb"
							showTodayIndicator={timeRange === 'month'}
						/>
						<SvgLineGraph
							data={chartData.orders}
							labels={chartLabels}
							label={`Ordrer pr. ${timeRange === 'today' ? 'time' : 'dag'}`}
							yLabel="Antal"
							color="#16a34a"
							showTodayIndicator={timeRange === 'month'}
						/>
						<SvgLineGraph
							data={chartData.avgValue}
							labels={chartLabels}
							label={`Gns. pris pr. ordre ${timeRange === 'today' ? '(time)' : '(dag)'}`}
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

						{/* Conditionally render weekday chart */}
						{timeRange !== 'today' && (
							<SvgBarChart
								data={ordersByDayOfWeek}
								labels={dayNames}
								label="Ordrer fordelt på ugedag"
								yLabel="Antal"
								color="#f97316"
							/>
						)}

						{/* Remaining charts */}
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
						<SvgPieChart
							data={topKiosks.map(k => k[1])}
							labels={topKiosks.map(k => k[0])}
							label="Ordrevolumen per kiosk"
						/>
					</div>
					<div className="mb-8">
						<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
							<FiPackage className="text-blue-600" />
							{'Alle ordrer'}
							{orders.length > 0 && <span className="text-sm text-gray-500 font-normal">{'('}{orders.length}{')'}</span>}
						</h2>
						{orders.length === 0 ? (
							<div className="text-gray-500 p-8 text-center bg-gray-50 rounded border border-gray-200">
								{'Ingen ordrer i den valgte periode'}
							</div>
						) : (
							<div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
								<table className="w-full text-sm bg-white">
									<thead>
										<tr className="bg-gray-100 text-left">
											<th
												className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors"
												onClick={() => setOrderSort({
													field: 'createdAt',
													direction: orderSort.field === 'createdAt' && orderSort.direction === 'desc' ? 'asc' : 'desc'
												})}
											>
												<div className="flex items-center gap-1">
													{'Tidspunkt'}
													{orderSort.field === 'createdAt' && (
														<span className="text-blue-600">
															{orderSort.direction === 'desc' ? '↓' : '↑'}
														</span>
													)}
												</div>
											</th>
											<th
												className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors"
												onClick={() => setOrderSort({
													field: 'paymentStatus',
													direction: orderSort.field === 'paymentStatus' && orderSort.direction === 'desc' ? 'asc' : 'desc'
												})}
											>
												<div className="flex items-center gap-1">
													{'Betaling'}
													{orderSort.field === 'paymentStatus' && (
														<span className="text-blue-600">
															{orderSort.direction === 'desc' ? '↓' : '↑'}
														</span>
													)}
												</div>
											</th>

											<th
												className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors"
												onClick={() => setOrderSort({
													field: 'status',
													direction: orderSort.field === 'status' && orderSort.direction === 'desc' ? 'asc' : 'desc'
												})}
											>
												<div className="flex items-center gap-1">
													{'Status'}
													{orderSort.field === 'status' && (
														<span className="text-blue-600">
															{orderSort.direction === 'desc' ? '↓' : '↑'}
														</span>
													)}
												</div>
											</th>
											<th
												className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors"
												onClick={() => setOrderSort({
													field: 'kiosk',
													direction: orderSort.field === 'kiosk' && orderSort.direction === 'desc' ? 'asc' : 'desc'
												})}
											>
												<div className="flex items-center gap-1">
													{'Kiosk'}
													{orderSort.field === 'kiosk' && (
														<span className="text-blue-600">
															{orderSort.direction === 'desc' ? '↓' : '↑'}
														</span>
													)}
												</div>
											</th>
											<th
												className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors"
												onClick={() => setOrderSort({
													field: 'room',
													direction: orderSort.field === 'room' && orderSort.direction === 'desc' ? 'asc' : 'desc'
												})}
											>
												<div className="flex items-center gap-1">
													{'Lokale'}
													{orderSort.field === 'room' && (
														<span className="text-blue-600">
															{orderSort.direction === 'desc' ? '↓' : '↑'}
														</span>
													)}
												</div>
											</th>
											<th className="p-3 border-b">{'Indhold'}</th>
											<th
												className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors text-right"
												onClick={() => setOrderSort({
													field: 'total',
													direction: orderSort.field === 'total' && orderSort.direction === 'desc' ? 'asc' : 'desc'
												})}
											>
												<div className="flex items-center justify-end gap-1">
													{'Beløb'}
													{orderSort.field === 'total' && (
														<span className="text-blue-600">
															{orderSort.direction === 'desc' ? '↓' : '↑'}
														</span>
													)}
												</div>
											</th>
										</tr>
									</thead>
									<tbody>
										{[...orders]
											.sort((a, b) => {
												if (orderSort.field === 'createdAt') {
													return orderSort.direction === 'desc'
														? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
														: new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
												} else if (orderSort.field === 'status') {
													return orderSort.direction === 'desc'
														? b.status.localeCompare(a.status)
														: a.status.localeCompare(b.status)
												} else if (orderSort.field === 'paymentStatus') {
													return orderSort.direction === 'desc'
														? b.paymentStatus.localeCompare(a.paymentStatus)
														: a.paymentStatus.localeCompare(b.paymentStatus)
												} else if (orderSort.field === 'room') {
													const roomNameA = rooms.find(r => r._id === a.roomId)?.name ?? 'Unknown'
													const roomNameB = rooms.find(r => r._id === b.roomId)?.name ?? 'Unknown'
													return orderSort.direction === 'desc'
														? roomNameB.localeCompare(roomNameA)
														: roomNameA.localeCompare(roomNameB)
												} else if (orderSort.field === 'kiosk') {
													const kioskNameA = kiosks.find(k => k._id === a.kioskId)?.name ?? 'Unknown'
													const kioskNameB = kiosks.find(k => k._id === b.kioskId)?.name ?? 'Unknown'
													return orderSort.direction === 'desc'
														? kioskNameB.localeCompare(kioskNameA)
														: kioskNameA.localeCompare(kioskNameB)
												} else if (orderSort.field === 'total') {
													const totalA = getOrderTotal(a, products, options)
													const totalB = getOrderTotal(b, products, options)
													return orderSort.direction === 'desc'
														? totalB - totalA
														: totalA - totalB
												}
												return 0
											})
											.map((order, index) => {
												const total = getOrderTotal(order, products, options)
												const roomName = rooms.find(r => r._id === order.roomId)?.name ?? 'Unknown'
												const kioskName = kiosks.find(k => k._id === order.kioskId)?.name ?? 'Unknown'

												// Calculate relative time for better understanding
												const orderTime = new Date(order.createdAt)
												const minutesAgo = Math.floor((currentTime.getTime() - orderTime.getTime()) / 60000)

												// Determine if order is recent (less than 30 minutes)
												const isRecent = minutesAgo < 30

												// Get formatted time
												const formattedTime = dayjs(order.createdAt).format('HH:mm')
												const formattedDate = dayjs(order.createdAt).format('DD/MM/YYYY')

												return (
													<tr
														key={order._id}
														className={`
															border-b border-gray-100 
															${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
															${isRecent ? 'animate-pulse-light' : ''}
															hover:bg-blue-50 transition-colors
														`}
													>
														<td className="p-3">
															{/* Determine if order is from today */}
															{order.createdAt.slice(0, 10) === today ? (
																// Today's orders: prioritize time
																<>
																	<div className="font-medium">{formattedTime}</div>
																	<div className="text-gray-500 text-xs">{formattedDate}</div>
																	{isRecent && (
																		<div className="text-xs text-blue-600 font-semibold">
																			{minutesAgo === 0 ? 'Lige nu' : `${minutesAgo} min. siden`}
																		</div>
																	)}
																</>
															) : (
																// Older orders: prioritize date
																<>
																	<div className="font-medium">{formattedDate}</div>
																	<div className="text-gray-500 text-xs">{formattedTime}</div>
																</>
															)}
														</td>
														<td className="p-3">
															{order.paymentStatus === 'successful' && (
																<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Betaling gennemført">
																	<FiDollarSign className="w-3 h-3" />
																	{'Betalt'}
																</span>
															)}
															{order.paymentStatus === 'pending' && (
																<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Afventer betaling">
																	<FiClock className="w-3 h-3" />
																	{'Afventer'}
																</span>
															)}
															{order.paymentStatus === 'failed' && (
																<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title="Betaling fejlede">
																	<FiAlertTriangle className="w-3 h-3" />
																	{'Fejlet'}
																</span>
															)}
														</td>
														<td className="p-3">
															{order.status === 'pending' && (
																<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Afventer behandling">
																	<FiClock className="w-3 h-3" />
																	{'Afventer'}
																</span>
															)}
															{order.status === 'confirmed' && (
																<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title="Ordre er bekræftet">
																	<FiCoffee className="w-3 h-3" />
																	{'I produktion'}
																</span>
															)}
															{order.status === 'delivered' && (
																<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Ordre er leveret">
																	<FiCheck className="w-3 h-3" />
																	{'Leveret'}
																</span>
															)}
														</td>
														<td className="p-3">
															<div className="truncate max-w-[100px]" title={kioskName}>
																{kioskName}
															</div>
														</td>
														<td className="p-3">
															<div className="truncate max-w-[100px]" title={roomName}>
																{roomName}
															</div>
														</td>
														<td className="p-3">
															<div className="max-w-[200px] truncate" title={order.products.map(p => `${p.name} (${p.quantity})`).join(', ')}>
																{order.products.length > 0 ? (
																	<span>
																		{order.products[0].name}
																		{order.products.length > 1 && ` +${order.products.length - 1} mere`}
																	</span>
																) : (
																	<span className="text-gray-400">{'Ingen produkter'}</span>
																)}
															</div>
														</td>
														<td className="p-3 text-right font-medium">
															{total.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
														</td>
													</tr>
												)
											})}
									</tbody>
								</table>
							</div>
						)}
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
				</>
			)}
		</main>
	)
}
