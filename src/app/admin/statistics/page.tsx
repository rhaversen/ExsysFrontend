'use client'

import axios from 'axios'
import { type ReactElement, useState, useEffect, useMemo, useRef } from 'react'
import { FiClock, FiDollarSign, FiPackage, FiBarChart2, FiCalendar, FiShoppingCart, FiUsers } from 'react-icons/fi'
import { io, type Socket } from 'socket.io-client'

import OrdersTable from '@/components/admin/statistics/OrdersTable'
import SvgBarChart from '@/components/admin/statistics/SvgBarChart'
import SvgLineGraph from '@/components/admin/statistics/SvgLineGraph'
import SvgPieChart from '@/components/admin/statistics/SvgPieChart'
import SvgStackedBarChart from '@/components/admin/statistics/SvgStackedBarChart'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import useStatisticsData from '@/hooks/useStatisticsData'
import { getColorsForNames } from '@/lib/colorUtils'
import type { OrderType, ProductType, OptionType, ActivityType, RoomType, KioskType } from '@/types/backendDataTypes'

type StatSection = 'overview' | 'sales' | 'products' | 'customers' | 'time' | 'orders';

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL
	const { addError } = useError()

	const [activeSection, setActiveSection] = useState<StatSection>('overview')
	const [clickedSection, setClickedSection] = useState<StatSection | null>(null)
	const [timeRange, setTimeRange] = useState<'30days' | '7days' | 'today' | 'month'>('30days')
	const [currentTime, setCurrentTime] = useState<Date>(new Date())

	const [orders, setOrders] = useState<OrderType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [loading, setLoading] = useState(true)
	const [socket, setSocket] = useState<Socket | null>(null)

	// Section refs for scroll/active section logic
	const overviewRef = useRef<HTMLDivElement>(null)
	const salesRef = useRef<HTMLDivElement>(null)
	const productsRef = useRef<HTMLDivElement>(null)
	const customersRef = useRef<HTMLDivElement>(null)
	const timeRef = useRef<HTMLDivElement>(null)
	const ordersRef = useRef<HTMLDivElement>(null)
	const sectionRefs = useMemo(() => ({
		overview: overviewRef,
		sales: salesRef,
		products: productsRef,
		customers: customersRef,
		time: timeRef,
		orders: ordersRef
	}), [overviewRef, salesRef, productsRef, customersRef, timeRef, ordersRef])

	// Setup websocket connection
	useEffect(() => {
		if (WS_URL == null) { return }
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)
		return () => { socketInstance.disconnect() }
	}, [WS_URL])

	// Listen for CUD events
	useEntitySocketListeners<OrderType>(
		socket,
		'order',
		order => setOrders(prev => prev.some(o => o._id === order._id) ? prev : [...prev, order]),
		order => setOrders(prev => prev.map(o => o._id === order._id ? order : o)),
		id => setOrders(prev => prev.filter(o => o._id !== id))
	)
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		item => setProducts(prev => prev.some(p => p._id === item._id) ? prev : [...prev, item]),
		item => setProducts(prev => prev.map(p => p._id === item._id ? item : p)),
		id => setProducts(prev => prev.filter(p => p._id !== id))
	)
	useEntitySocketListeners<OptionType>(
		socket,
		'option',
		item => setOptions(prev => prev.some(o => o._id === item._id) ? prev : [...prev, item]),
		item => setOptions(prev => prev.map(o => o._id === item._id ? item : o)),
		id => setOptions(prev => prev.filter(o => o._id !== id))
	)
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
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		item => setKiosks(prev => prev.some(k => k._id === item._id) ? prev : [...prev, item]),
		item => setKiosks(prev => prev.map(k => k._id === item._id ? item : k)),
		id => setKiosks(prev => prev.filter(k => k._id !== id))
	)

	// Fetch all data once on load (last 30 days)
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				const fromDate = new Date()
				const toDate = new Date()

				// Always fetch full 30 days of data
				fromDate.setDate(fromDate.getDate() - 29)
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
	}, [API_URL, addError])

	// Update current time every minute
	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 60000)
		return () => clearInterval(timer)
	}, [])

	// Filter orders based on selected time range
	const filteredOrders = useMemo(() => {
		if (orders.length === 0) { return [] }
		const now = new Date()
		let fromDate = new Date()
		if (timeRange === '30days') {
			fromDate.setDate(fromDate.getDate() - 29)
		} else if (timeRange === '7days') {
			fromDate.setDate(fromDate.getDate() - 6)
		} else if (timeRange === 'month') {
			fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
		} else if (timeRange === 'today') {
			fromDate.setHours(0, 0, 0, 0)
		}
		fromDate.setHours(0, 0, 0, 0)
		return orders.filter(order => {
			const orderDate = new Date(order.createdAt)
			return orderDate >= fromDate && orderDate <= now
		})
	}, [orders, timeRange])

	const stats = useStatisticsData({
		orders: filteredOrders,
		products,
		options,
		activities,
		rooms,
		kiosks,
		timeRange
	})

	// Scroll offset to account for sticky header height
	const SCROLL_OFFSET = 100 // set this to your header’s height

	// Scroll to section when navigation item is clicked (grey until scroll lands)
	const scrollToSection = (section: StatSection) => {
		setClickedSection(section)
		const element = sectionRefs[section]?.current
		if (element != null) {
			const top = element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
			window.scrollTo({ top, behavior: 'smooth' })
			setTimeout(() => setClickedSection(null), 500) // clear grey shortly after
		}
	}

	// Update active section based on which section has the largest visible area
	useEffect(() => {
		if (loading) { return }
		const handleScroll = () => {
			let best: StatSection = 'overview'
			let maxVis = 0
			const vh = window.innerHeight
			Object.entries(sectionRefs).forEach(([sec, ref]) => {
				const el = ref.current
				if (!el) { return }
				const r = el.getBoundingClientRect()
				const top = Math.max(r.top, 0)
				const bottom = Math.min(r.bottom, vh)
				const vis = bottom - top
				if (vis > maxVis) {
					maxVis = vis
					best = sec as StatSection
				}
			})
			if (best !== activeSection) { setActiveSection(best) }
		}
		window.addEventListener('scroll', handleScroll)
		handleScroll()
		return () => { window.removeEventListener('scroll', handleScroll) }
	}, [loading, sectionRefs, activeSection])

	return (
		<div className="flex flex-col md:flex-row max-w-7xl mx-auto text-black">
			{/* Sidebar navigation */}
			<div className="w-full md:w-64 bg-gray-100 md:rounded-l shadow-md md:sticky md:top-20 h-fit">
				<div className="p-6">
					<h2 className="text-lg font-bold mb-4">{'Statistik'}</h2>

					{/* Time range selector */}
					<div className="mb-6">
						<p className="text-sm font-medium text-gray-700 mb-2">{'Tidsperiode'}</p>
						<div className="flex flex-col space-y-1">
							<button
								onClick={() => setTimeRange('today')}
								className={`px-4 py-2 text-sm font-medium rounded text-left ${timeRange === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
							>
								<div className="flex items-center">
									<FiClock className="mr-2" />
									{'I dag\r'}
								</div>
							</button>
							<button
								onClick={() => setTimeRange('7days')}
								className={`px-4 py-2 text-sm font-medium rounded text-left ${timeRange === '7days' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
							>
								<div className="flex items-center">
									<FiCalendar className="mr-2" />
									{'7 dage\r'}
								</div>
							</button>
							<button
								onClick={() => setTimeRange('30days')}
								className={`px-4 py-2 text-sm font-medium rounded text-left ${timeRange === '30days' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
							>
								<div className="flex items-center">
									<FiCalendar className="mr-2" />
									{'30 dage\r'}
								</div>
							</button>
							<button
								onClick={() => setTimeRange('month')}
								className={`px-4 py-2 text-sm font-medium rounded text-left ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
							>
								<div className="flex items-center">
									<FiCalendar className="mr-2" />
									{'Nuværende måned\r'}
								</div>
							</button>
						</div>
					</div>

					{/* Navigation sections */}
					<div className="hidden md:block space-y-1">
						<p className="text-sm font-medium text-gray-700 mb-2">{'Sektioner'}</p>
						<button
							onClick={() => scrollToSection('overview')}
							className={`px-4 py-2 text-sm font-medium rounded w-full text-left ${
								clickedSection === 'overview'
									? 'bg-gray-300 text-gray-800'
									: activeSection === 'overview'
										? 'bg-blue-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-200'
							}`}
						>
							<div className="flex items-center">
								<FiBarChart2 className="mr-2" />
								{'Overblik\r'}
							</div>
						</button>
						<button
							onClick={() => scrollToSection('sales')}
							className={`px-4 py-2 text-sm font-medium rounded w-full text-left ${
								clickedSection === 'sales'
									? 'bg-gray-300 text-gray-800'
									: activeSection === 'sales'
										? 'bg-blue-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-200'
							}`}
						>
							<div className="flex items-center">
								<FiDollarSign className="mr-2" />
								{'Salg\r'}
							</div>
						</button>
						<button
							onClick={() => scrollToSection('products')}
							className={`px-4 py-2 text-sm font-medium rounded w-full text-left ${
								clickedSection === 'products'
									? 'bg-gray-300 text-gray-800'
									: activeSection === 'products'
										? 'bg-blue-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-200'
							}`}
						>
							<div className="flex items-center">
								<FiPackage className="mr-2" />
								{'Produkter\r'}
							</div>
						</button>
						<button
							onClick={() => scrollToSection('customers')}
							className={`px-4 py-2 text-sm font-medium rounded w-full text-left ${
								clickedSection === 'customers'
									? 'bg-gray-300 text-gray-800'
									: activeSection === 'customers'
										? 'bg-blue-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-200'
							}`}
						>
							<div className="flex items-center">
								<FiUsers className="mr-2" />
								{'Lokaler, Kiosker og Aktiviteter\r'}
							</div>
						</button>
						<button
							onClick={() => scrollToSection('time')}
							className={`px-4 py-2 text-sm font-medium rounded w-full text-left ${
								clickedSection === 'time'
									? 'bg-gray-300 text-gray-800'
									: activeSection === 'time'
										? 'bg-blue-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-200'
							}`}
						>
							<div className="flex items-center">
								<FiClock className="mr-2" />
								{'Tidsmønstre\r'}
							</div>
						</button>
						<button
							onClick={() => scrollToSection('orders')}
							className={`px-4 py-2 text-sm font-medium rounded w-full text-left ${
								clickedSection === 'orders'
									? 'bg-gray-300 text-gray-800'
									: activeSection === 'orders'
										? 'bg-blue-600 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-200'
							}`}
						>
							<div className="flex items-center">
								<FiShoppingCart className="mr-2" />
								{'Ordrer\r'}
							</div>
						</button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 p-6 overflow-auto">
				{loading && <div className="text-center p-8">{'Henter data...'}</div>}
				{!loading && (
					<>
						{/* OVERVIEW SECTION */}
						<div ref={overviewRef} className="mb-8 flex flex-col gap-2">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiBarChart2 className="mr-2 text-blue-600" />
								{'Overblik'}
							</h2>

							{/* Finansielle nøgletal */}
							<h3 className="text-lg font-semibold">{'Finansielle nøgletal'}</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-blue-50 rounded p-3" title="Total omsætning for den valgte periode">
									<div className="text-xs text-blue-700">{'Omsætning'}</div>
									<div className="text-xl font-bold">{stats.totalSalesDisplay}</div>
								</div>
								<div className="bg-purple-50 rounded p-3" title="Gennemsnitlig beløb pr. bestilling">
									<div className="text-xs text-purple-700">{'Gns. pris/ordre'}</div>
									<div className="text-xl font-bold">{stats.avgOrderValueDisplay}</div>
								</div>
								<div className="bg-teal-50 rounded p-3" title="Procentdel af ordrer der er markeret som leveret">
									<div className="text-xs text-teal-700">{'Leveringsprocent'}</div>
									<div className="text-xl font-bold">{stats.deliveryPercentDisplay}</div>
								</div>
							</div>

							{/* Ordre statistikker */}
							<h3 className="text-lg font-semibold">{'Ordre statistikker'}</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-green-50 rounded p-3" title="Antal bestillinger i den valgte periode">
									<div className="text-xs text-green-700">{'Antal ordrer'}</div>
									<div className="text-xl font-bold">{stats.totalOrders}</div>
								</div>
								<div className="bg-indigo-50 rounded p-3" title="Gennemsnitligt antal produkter i hver bestilling">
									<div className="text-xs text-indigo-700">{'Gns. produkter pr. ordre'}</div>
									<div className="text-xl font-bold">{stats.avgProductsDisplay}</div>
								</div>
								<div className="bg-rose-50 rounded p-3" title="Tidspunktet med flest bestillinger (time og ugedag)">
									<div className="text-xs text-rose-700">{'Travleste tidspunkt'}</div>
									<div className="text-xl font-bold">{stats.busiestTimeDisplay}</div>
								</div>
							</div>

							{/* Top elementer */}
							<h3 className="text-lg font-semibold">{'Top elementer'}</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-amber-50 rounded p-3" title="Det produkt der er solgt flest af (med antal)">
									<div className="text-xs text-amber-700">{'Mest solgte produkt'}</div>
									<div className="text-xl font-bold">{stats.mostSoldProduct}</div>
								</div>
								<div className="bg-cyan-50 rounded p-3" title="Lokalet med flest bestillinger (med antal)">
									<div className="text-xs text-cyan-700">{'Travleste lokale'}</div>
									<div className="text-xl font-bold">{stats.busiestRoom}</div>
								</div>
								<div className="bg-orange-50 rounded p-3" title="Kiosken med flest bestillinger (med antal)">
									<div className="text-xs text-orange-700">{'Travleste kiosk'}</div>
									<div className="text-xl font-bold">{stats.busiestKiosk}</div>
								</div>
							</div>
						</div>

						{/* SALES SECTION */}
						<div ref={salesRef} className="mb-12">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiDollarSign className="mr-2 text-blue-600" />
								{'Salgsanalyse\r'}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
								<SvgLineGraph
									data={stats.chartData.sales}
									labels={stats.chartLabels}
									label={`Omsætning pr. ${timeRange === 'today' ? 'time' : 'dag'}`}
									yLabel="DKK"
									color="#2563eb"
									showTodayIndicator={timeRange === 'month'}
								/>
								<SvgLineGraph
									data={stats.chartData.orders}
									labels={stats.chartLabels}
									label={`Ordrer pr. ${timeRange === 'today' ? 'time' : 'dag'}`}
									yLabel="Antal"
									color="#16a34a"
									showTodayIndicator={timeRange === 'month'}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<SvgLineGraph
									data={stats.chartData.avgValue}
									labels={stats.chartLabels}
									label={`Gns. pris pr. ordre ${timeRange === 'today' ? '(time)' : '(dag)'}`}
									yLabel="DKK"
									color="#a21caf"
									showTodayIndicator={timeRange === 'month'}
								/>

								<div className="bg-gray-50 rounded p-5 flex flex-col justify-center">
									<h3 className="font-semibold text-lg mb-3">{'Betalingsstatus'}</h3>
									<div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-8">
										<div className="flex-1">
											<ul className="space-y-2">
												<li className="flex items-center justify-between">
													<span className="flex items-center">
														<span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
														{'Gennemført:\r'}
													</span>
													<span className="font-semibold">{stats.paymentStatusCount.successful ?? 0}</span>
												</li>
												<li className="flex items-center justify-between">
													<span className="flex items-center">
														<span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
														{'Afventer:\r'}
													</span>
													<span className="font-semibold">{stats.paymentStatusCount.pending ?? 0}</span>
												</li>
												<li className="flex items-center justify-between">
													<span className="flex items-center">
														<span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
														{'Fejlet:\r'}
													</span>
													<span className="font-semibold">{stats.paymentStatusCount.failed ?? 0}</span>
												</li>
											</ul>
										</div>

										<div className="flex-1">
											<h3 className="font-semibold mb-3">{'Betalingsmetode'}</h3>
											<ul className="space-y-2">
												<li className="flex items-center justify-between">
													<span className="flex items-center">
														<span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
														{'SumUp:\r'}
													</span>
													<span className="font-semibold">{stats.checkoutMethodCount.sumUp ?? 0}</span>
												</li>
												<li className="flex items-center justify-between">
													<span className="flex items-center">
														<span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
														{'Senere:\r'}
													</span>
													<span className="font-semibold">{stats.checkoutMethodCount.later ?? 0}</span>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* PRODUCTS SECTION */}
						<div ref={productsRef} className="mb-12">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiPackage className="mr-2 text-blue-600" />
								{'Produktanalyse\r'}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
								<SvgBarChart
									data={stats.topProductsByQuantity.map(p => p[1])}
									labels={stats.topProductsByQuantity.map(p => p[0])}
									itemColors={getColorsForNames(stats.topProductsByQuantity.map(p => p[0]))}
									label="Top 5 mest solgte produkter"
									yLabel="Antal"
								/>
								<SvgBarChart
									data={stats.topProductsByRevenue.map(p => p[1])}
									labels={stats.topProductsByRevenue.map(p => p[0])}
									itemColors={getColorsForNames(stats.topProductsByRevenue.map(p => p[0]))}
									label="Top 5 produkter efter omsætning"
									yLabel="DKK"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<SvgBarChart
									data={stats.topOptionsByQuantity.map(o => o[1])}
									labels={stats.topOptionsByQuantity.map(o => o[0])}
									itemColors={getColorsForNames(stats.topOptionsByQuantity.map(o => o[0]))}
									label="Top 5 mest solgte tilvalg"
									yLabel="Antal"
								/>
								<SvgBarChart
									data={stats.topOptionsByRevenue.map(o => o[1])}
									labels={stats.topOptionsByRevenue.map(o => o[0])}
									itemColors={getColorsForNames(stats.topOptionsByRevenue.map(o => o[0]))}
									label="Top 5 tilvalg efter omsætning"
									yLabel="DKK"
								/>
							</div>
						</div>

						{/* CUSTOMERS SECTION (LOCATIONS) */}
						<div ref={customersRef} className="mb-12">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiUsers className="mr-2 text-blue-600" />
								{'Lokaler, Kiosker og Aktiviteter\r'}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
								<SvgPieChart
									data={stats.topRooms.map(r => r[1])}
									labels={stats.topRooms.map(r => r[0])}
									itemColors={getColorsForNames(stats.topRooms.map(r => r[0]))}
									label="Ordrevolumen per lokale"
								/>
								<SvgPieChart
									data={stats.topKiosks.map(k => k[1])}
									labels={stats.topKiosks.map(k => k[0])}
									itemColors={getColorsForNames(stats.topKiosks.map(k => k[0]))}
									label="Ordrevolumen per kiosk"
								/>
								<SvgPieChart
									data={stats.topActivities.map(a => a[1])}
									labels={stats.topActivities.map(a => a[0])}
									itemColors={getColorsForNames(stats.topActivities.map(a => a[0]))}
									label="Ordrevolumen per aktivitet"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<SvgPieChart
									data={stats.revenueByRoom}
									labels={stats.topRooms.map(r => r[0])}
									itemColors={getColorsForNames(stats.topRooms.map(r => r[0]))}
									label="Omsætning per lokale"
								/>
								<SvgPieChart
									data={stats.revenueByKiosk}
									labels={stats.topKiosks.map(k => k[0])}
									itemColors={getColorsForNames(stats.topKiosks.map(k => k[0]))}
									label="Omsætning per kiosk"
								/>
								<SvgPieChart
									data={stats.revenueByActivity}
									labels={stats.topActivities.map(a => a[0])}
									itemColors={getColorsForNames(stats.topActivities.map(a => a[0]))}
									label="Omsætning per aktivitet"
								/>
							</div>
						</div>

						{/* TIME PATTERNS SECTION */}
						<div ref={timeRef} className="mb-12 flex flex-col gap-2">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiClock className="mr-2 text-blue-600" />
								{'Tidsmønstre\r'}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Use sales by product name for the stacked bar chart */}
								<SvgStackedBarChart
									data={stats.salesByProductByHour} // Use data grouped by product name
									labels={stats.hourLabels}
									categories={stats.productNames ?? []} // Use product names as categories
									colors={(() => {
										const names = stats.productNames ?? []
										const cols = getColorsForNames(names)
										return Object.fromEntries(names.map((n, i) => [n, cols[i]]))
									})()} // Map product names to their colors
									label="Omsætning fordelt på produkt pr. time" // Update label
									yLabel="DKK"
								/>

								<SvgBarChart
									data={stats.ordersByHour}
									labels={stats.hourLabels}
									label="Ordrer fordelt på tid"
									yLabel="Antal"
									color="#6366f1"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

								{/* Conditionally render weekday chart */}
								{timeRange !== 'today' && (
									<>
										<SvgBarChart
											data={stats.ordersByDayOfWeek}
											labels={stats.dayNames}
											label="Ordrer fordelt på ugedag"
											yLabel="Antal"
											color="#f97316"
										/>
										<SvgBarChart
											data={stats.salesByDayOfWeek}
											labels={stats.dayNames}
											label="Omsætning fordelt på ugedag"
											yLabel="DKK"
											color="#f59e0b"
										/>
									</>
								)}
							</div>
						</div>

						{/* ORDERS SECTION */}
						<div ref={ordersRef} className="mb-12">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiShoppingCart className="mr-2 text-blue-600" />
								{'Ordrer\r'}
							</h2>

							<div className="mb-8">
								<h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
									<FiPackage className="text-blue-600" />
									{'Alle ordrer'}
									{filteredOrders.length > 0 && <span className="text-sm text-gray-500 font-normal">{'('}{filteredOrders.length}{')'}</span>}
								</h2>
								{filteredOrders.length === 0 ? (
									<div className="text-gray-500 p-8 text-center bg-gray-50 rounded border border-gray-200">
										{'Ingen ordrer i den valgte periode'}
									</div>
								) : (
									<OrdersTable
										orders={filteredOrders}
										products={products}
										options={options}
										rooms={rooms}
										kiosks={kiosks}
										currentTime={currentTime}
									/>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	)
}
