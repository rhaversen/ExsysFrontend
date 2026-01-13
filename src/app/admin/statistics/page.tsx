'use client'

import axios from 'axios'
import { type ReactElement, useState, useEffect, useMemo, useRef } from 'react'
import { FiClock, FiDollarSign, FiPackage, FiBarChart2, FiCalendar, FiShoppingCart, FiUsers } from 'react-icons/fi'

import OrdersTable from '@/components/admin/statistics/OrdersTable'
import SvgBarChart from '@/components/admin/statistics/SvgBarChart'
import SvgLineGraph from '@/components/admin/statistics/SvgLineGraph'
import SvgPieChart from '@/components/admin/statistics/SvgPieChart'
import SvgStackedBarChart from '@/components/admin/statistics/SvgStackedBarChart'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import useStatisticsData from '@/hooks/useStatisticsData'
import { getColorsForNames } from '@/lib/colorUtils'
import type { OrderType, ProductType, OptionType, ActivityType, RoomType, KioskType } from '@/types/backendDataTypes'

type StatSection = 'overview' | 'sales' | 'products' | 'customers' | 'time' | 'orders';
type TimeRange = '30days' | '7days' | 'today' | 'month' | 'allTime' | 'custom';

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [activeSection, setActiveSection] = useState<StatSection>('overview')
	const [clickedSection, setClickedSection] = useState<StatSection | null>(null)
	const [timeRange, setTimeRange] = useState<TimeRange>('30days')
	const [customFromDate, setCustomFromDate] = useState<string>('')
	const [customToDate, setCustomToDate] = useState<string>('')
	const [currentTime, setCurrentTime] = useState<Date>(new Date())

	const [orders, setOrders] = useState<OrderType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [loading, setLoading] = useState(true)

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

	useEntitySocket<OrderType>('order', { setState: setOrders })
	useEntitySocket<ProductType>('product', { setState: setProducts })
	useEntitySocket<OptionType>('option', { setState: setOptions })
	useEntitySocket<ActivityType>('activity', { setState: setActivities })
	useEntitySocket<RoomType>('room', { setState: setRooms })
	useEntitySocket<KioskType>('kiosk', { setState: setKiosks })

	// Fetch all data on load (refetch when timeRange changes to allTime or custom)
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				let orderParams: { fromDate?: string; toDate?: string } = {}

				if (timeRange === 'allTime') {
					// No date params - fetch all orders
				} else if (timeRange === 'custom' && customFromDate && customToDate) {
					const fromDate = new Date(customFromDate)
					fromDate.setHours(0, 0, 0, 0)
					const toDate = new Date(customToDate)
					toDate.setHours(23, 59, 59, 999)
					orderParams = {
						fromDate: fromDate.toISOString(),
						toDate: toDate.toISOString()
					}
				} else {
					const fromDate = new Date()
					const toDate = new Date()
					// Fetch full 30 days of data for non-custom ranges
					fromDate.setDate(fromDate.getDate() - 29)
					fromDate.setHours(0, 0, 0, 0)
					toDate.setHours(23, 59, 59, 999)
					orderParams = {
						fromDate: fromDate.toISOString(),
						toDate: toDate.toISOString()
					}
				}

				const [ordersRes, productsRes, optionsRes, activitiesRes, roomsRes, kiosksRes] = await Promise.all([
					axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
						params: orderParams,
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
		if (API_URL != null && (timeRange !== 'custom' || (customFromDate && customToDate))) {
			fetchData()
		}
	}, [API_URL, addError, timeRange, customFromDate, customToDate])

	// Update current time every minute
	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 60000)
		return () => clearInterval(timer)
	}, [])

	// Filter orders based on selected time range
	const filteredOrders = useMemo(() => {
		if (orders.length === 0) { return [] }
		const now = new Date()

		if (timeRange === 'allTime') {
			return orders
		}

		if (timeRange === 'custom') {
			if (!customFromDate || !customToDate) { return orders }
			const fromDate = new Date(customFromDate)
			fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(customToDate)
			toDate.setHours(23, 59, 59, 999)
			return orders.filter(order => {
				const orderDate = new Date(order.createdAt)
				return orderDate >= fromDate && orderDate <= toDate
			})
		}

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
	}, [orders, timeRange, customFromDate, customToDate])

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
							<button
								onClick={() => setTimeRange('allTime')}
								className={`px-4 py-2 text-sm font-medium rounded text-left ${timeRange === 'allTime' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
							>
								<div className="flex items-center">
									<FiCalendar className="mr-2" />
									{'Al tid\r'}
								</div>
							</button>
							<button
								onClick={() => setTimeRange('custom')}
								className={`px-4 py-2 text-sm font-medium rounded text-left ${timeRange === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
							>
								<div className="flex items-center">
									<FiCalendar className="mr-2" />
									{'Brugerdefineret\r'}
								</div>
							</button>
							{timeRange === 'custom' && (
								<div className="mt-2 space-y-2 p-2 bg-white rounded border">
									<div>
										<label className="block text-xs text-gray-600 mb-1" htmlFor="custom-from-date">{'Fra'}</label>
										<input
											id="custom-from-date"
											type="date"
											value={customFromDate}
											onChange={(e) => setCustomFromDate(e.target.value)}
											className="w-full px-2 py-1 text-sm border rounded"
											title="Vælg startdato"
										/>
									</div>
									<div>
										<label className="block text-xs text-gray-600 mb-1" htmlFor="custom-to-date">{'Til'}</label>
										<input
											id="custom-to-date"
											type="date"
											value={customToDate}
											onChange={(e) => setCustomToDate(e.target.value)}
											className="w-full px-2 py-1 text-sm border rounded"
											title="Vælg slutdato"
										/>
									</div>
								</div>
							)}
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
								{'Spisesteder, Kiosker og Aktiviteter\r'}
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
							<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
								<div className="bg-green-50 rounded p-3" title="Antal bestillinger i den valgte periode">
									<div className="text-xs text-green-700">{'Antal ordrer'}</div>
									<div className="text-xl font-bold">{stats.totalOrders}</div>
								</div>
								<div className="bg-blue-50 rounded p-3" title="Samlet antal produkter solgt i den valgte periode">
									<div className="text-xs text-blue-700">{'Antal produkter'}</div>
									<div className="text-xl font-bold">{stats.totalProductsSold}</div>
								</div>
								<div className="bg-purple-50 rounded p-3" title="Samlet antal tilvalg solgt i den valgte periode">
									<div className="text-xs text-purple-700">{'Antal tilvalg'}</div>
									<div className="text-xl font-bold">{stats.totalOptionsSold}</div>
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
								<div className="bg-cyan-50 rounded p-3" title="Spisestedet med flest bestillinger (med antal)">
									<div className="text-xs text-cyan-700">{'Travleste spisested'}</div>
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
									yLabel="kr."
									color="#2563eb"
									showTodayIndicator={timeRange === 'month' || timeRange === 'today'}
									currentHour={timeRange === 'today' ? currentTime.getHours() : undefined}
								/>
								<SvgLineGraph
									data={stats.chartData.orders}
									labels={stats.chartLabels}
									label={`Ordrer pr. ${timeRange === 'today' ? 'time' : 'dag'}`}
									yLabel="stk."
									color="#16a34a"
									showTodayIndicator={timeRange === 'month' || timeRange === 'today'}
									currentHour={timeRange === 'today' ? currentTime.getHours() : undefined}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<SvgLineGraph
									data={stats.chartData.avgValue}
									labels={stats.chartLabels}
									label={`Gns. pris pr. ordre ${timeRange === 'today' ? '(time)' : '(dag)'}`}
									yLabel="kr."
									color="#a21caf"
									showTodayIndicator={timeRange === 'month' || timeRange === 'today'}
									currentHour={timeRange === 'today' ? currentTime.getHours() : undefined}
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
									itemColors={getColorsForNames(stats.topProductsByQuantity.map(p => p[0]), 'product')}
									label="Top 5 mest solgte produkter"
									yLabel="stk."
								/>
								<SvgBarChart
									data={stats.topProductsByRevenue.map(p => p[1])}
									labels={stats.topProductsByRevenue.map(p => p[0])}
									itemColors={getColorsForNames(stats.topProductsByRevenue.map(p => p[0]), 'product')}
									label="Top 5 produkter efter omsætning"
									yLabel="kr."
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<SvgBarChart
									data={stats.topOptionsByQuantity.map(o => o[1])}
									labels={stats.topOptionsByQuantity.map(o => o[0])}
									itemColors={getColorsForNames(stats.topOptionsByQuantity.map(o => o[0]), 'option')}
									label="Top 5 mest solgte tilvalg"
									yLabel="stk."
								/>
								<SvgBarChart
									data={stats.topOptionsByRevenue.map(o => o[1])}
									labels={stats.topOptionsByRevenue.map(o => o[0])}
									itemColors={getColorsForNames(stats.topOptionsByRevenue.map(o => o[0]), 'option')}
									label="Top 5 tilvalg efter omsætning"
									yLabel="kr."
								/>
							</div>
						</div>

						{/* TIME PATTERNS SECTION */}
						<div ref={timeRef} className="mb-12 flex flex-col gap-2">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiClock className="mr-2 text-blue-600" />
								{'Tidsmønstre\r'}
							</h2>

							{/* Conditionally render weekday chart */}
							{timeRange !== 'today' && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<>
										<SvgBarChart
											data={stats.ordersByDayOfWeek}
											labels={stats.dayNames}
											label="Ordrer fordelt på ugedag"
											yLabel="stk."
											color="#f97316"
										/>
										<SvgBarChart
											data={stats.salesByDayOfWeek}
											labels={stats.dayNames}
											label="Omsætning fordelt på ugedag"
											yLabel="kr."
											color="#f59e0b"
										/>
									</>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Use orders by product name for the stacked bar chart */}
								<SvgStackedBarChart
									data={stats.ordersByProductByHour}
									labels={stats.hourLabels}
									categories={stats.productNames ?? []}
									colors={(() => {
										const names = stats.productNames ?? []
										const cols = getColorsForNames(names, 'product')
										return Object.fromEntries(names.map((n, i) => [n, cols[i]]))
									})()}
									label="Totale bestillinger fordelt på produkt pr. time"
									yLabel="stk."
								/>

								{/* Use sales by product name for the stacked bar chart */}
								<SvgStackedBarChart
									data={stats.salesByProductByHour} // Use data grouped by product name
									labels={stats.hourLabels}
									categories={stats.productNames ?? []} // Use product names as categories
									colors={(() => {
										const names = stats.productNames ?? []
										const cols = getColorsForNames(names, 'product')
										return Object.fromEntries(names.map((n, i) => [n, cols[i]]))
									})()} // Map product names to their colors
									label="Omsætning fordelt på produkt pr. time" // Update label
									yLabel="kr."
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
								<SvgBarChart
									data={stats.ordersByHour}
									labels={stats.hourLabels}
									label="Ordrer fordelt på tid"
									yLabel="stk."
									color="#6366f1"
								/>

								<SvgBarChart
									data={stats.salesByHour}
									labels={stats.hourLabels}
									label="Omsætning fordelt på tid"
									yLabel="kr."
									color="#0ea5e9"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
								<SvgStackedBarChart
									data={stats.ordersByRoomByHour}
									labels={stats.hourLabels}
									categories={stats.roomNames ?? []}
									colors={(() => {
										const names = stats.roomNames ?? []
										const cols = getColorsForNames(names, 'room')
										return Object.fromEntries(names.map((n, i) => [n, cols[i]]))
									})()}
									label="Ordrer fordelt på spisested pr. time"
									yLabel="stk."
								/>

								<SvgStackedBarChart
									data={stats.ordersByActivityByHour}
									labels={stats.hourLabels}
									categories={stats.activityNames ?? []}
									colors={(() => {
										const names = stats.activityNames ?? []
										const cols = getColorsForNames(names, 'activity')
										return Object.fromEntries(names.map((n, i) => [n, cols[i]]))
									})()}
									label="Ordrer fordelt på aktivitet pr. time"
									yLabel="stk."
								/>
							</div>
						</div>

						{/* CUSTOMERS SECTION (LOCATIONS) */}
						<div ref={customersRef} className="mb-12">
							<h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 border-b pb-2">
								<FiUsers className="mr-2 text-blue-600" />
								{'Spisesteder, Kiosker og Aktiviteter\r'}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
								<SvgPieChart
									data={stats.topRooms.map(r => r[1])}
									labels={stats.topRooms.map(r => r[0])}
									itemColors={getColorsForNames(stats.topRooms.map(r => r[0]), 'room')}
									label="Ordrevolumen per spisested"
									yLabel='stk.'
								/>
								<SvgPieChart
									data={stats.topKiosks.map(k => k[1])}
									labels={stats.topKiosks.map(k => k[0])}
									itemColors={getColorsForNames(stats.topKiosks.map(k => k[0]), 'kiosk')}
									label="Ordrevolumen per kiosk"
									yLabel='stk.'
								/>
								<SvgPieChart
									data={stats.topActivities.map(a => a[1])}
									labels={stats.topActivities.map(a => a[0])}
									itemColors={getColorsForNames(stats.topActivities.map(a => a[0]), 'activity')}
									label="Ordrevolumen per aktivitet"
									yLabel='stk.'
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<SvgPieChart
									data={stats.revenueByRoom}
									labels={stats.topRooms.map(r => r[0])}
									itemColors={getColorsForNames(stats.topRooms.map(r => r[0]), 'room')}
									label="Omsætning per spisested"
									yLabel='kr.'
								/>
								<SvgPieChart
									data={stats.revenueByKiosk}
									labels={stats.topKiosks.map(k => k[0])}
									itemColors={getColorsForNames(stats.topKiosks.map(k => k[0]), 'kiosk')}
									label="Omsætning per kiosk"
									yLabel='kr.'
								/>
								<SvgPieChart
									data={stats.revenueByActivity}
									labels={stats.topActivities.map(a => a[0])}
									itemColors={getColorsForNames(stats.topActivities.map(a => a[0]), 'activity')}
									label="Omsætning per aktivitet"
									yLabel='kr.'
								/>
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
										activities={activities}
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
