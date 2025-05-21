import dayjs from 'dayjs'
import { useMemo } from 'react'

import type { OrderType, ProductType, OptionType, ActivityType, RoomType, KioskType } from '@/types/backendDataTypes'

export type StatSection = 'overview' | 'sales' | 'products' | 'customers' | 'time' | 'orders';

function getLast30Days () {
	const days: string[] = []
	const today = new Date()
	for (let i = 29; i >= 0; i--) {
		const d = new Date(today)
		d.setDate(today.getDate() - i)
		days.push(d.toISOString().slice(0, 10))
	}
	return days
}

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

export default function useStatisticsData ({
	orders,
	products,
	options,
	activities,
	rooms,
	kiosks,
	timeRange
}: {
  orders: OrderType[];
  products: ProductType[];
  options: OptionType[];
  activities: ActivityType[];
  rooms: RoomType[];
  kiosks: KioskType[];
  timeRange: '30days' | '7days' | 'today' | 'month';
}) {
	// Days for the selected range
	const days = useMemo(() => {
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
	}, [timeRange])

	// Generate hourly data for today mode
	const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
	const todayStr = new Date().toISOString().slice(0, 10)
	const ordersByHourToday = Array(24).fill(0).map((_, hour) => {
		if (timeRange !== 'today') { return [] }
		return orders.filter(o => {
			const orderDate = new Date(o.createdAt)
			return orderDate.toISOString().slice(0, 10) === todayStr && orderDate.getHours() === hour
		})
	})

	// Chart data
	const [chartData, chartLabels] = useMemo(() => {
		if (timeRange === 'today') {
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
	}, [orders, products, options, timeRange, days, ordersByHourToday, hours])

	// Key values
	const totalSales = chartData.sales.reduce((a, b) => a + b, 0)
	const totalOrders = orders.length
	const avgOrderValue = totalOrders ? totalSales / totalOrders : 0

	// Most sold product
	const productSales: Record<string, number> = {}
	orders.forEach(order => {
		order.products.forEach(p => {
			productSales[products.find(prod => prod._id === p._id)?.name ?? 'Ukendt'] = (productSales[products.find(prod => prod._id === p._id)?.name ?? 'Ukendt'] || 0) + p.quantity
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
	const ordersByHour: number[] = Array(24).fill(0)
	// Sales by hour of day
	const salesByHour: number[] = Array(24).fill(0)
	orders.forEach(order => {
		const hour = new Date(order.createdAt).getHours()
		ordersByHour[hour]++
		salesByHour[hour] += getOrderTotal(order, products, options)
	})
	const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)

	// Time-based analysis - Sales by Product Name per Hour
	const { salesByProductByHour, productNames } = useMemo(() => {
		const uniqueProductNamesSet = new Set<string>()
		products.forEach(p => uniqueProductNamesSet.add(p.name))
		const productNameList = Array.from(uniqueProductNamesSet)

		const hourlySales: Array<Record<string, number>> = Array(24).fill(0).map(() =>
			productNameList.reduce((acc, name) => {
				acc[name] = 0
				return acc
			}, {} as Record<string, number>)
		)

		orders.forEach(order => {
			const hour = new Date(order.createdAt).getHours()
			order.products.forEach(p => {
				const product = products.find(prod => prod._id === p._id)
				if (product) {
					const productName = product.name
					const value = product.price * p.quantity
					// Ensure product name exists in the map for that hour
					if (hourlySales[hour]?.[productName] !== undefined) {
						hourlySales[hour][productName] += value
					} else {
						// This case should ideally not happen if all products are pre-scanned
						console.warn(`Product "${productName}" not found in initial scan for hour ${hour}.`)
					}
				}
			})
			// Note: Options are not included in this breakdown.
		})

		return { salesByProductByHour: hourlySales, productNames: productNameList }
	}, [orders, products])

	// Time-based analysis - Orders by Product Name per Hour (total product count per hour)
	const ordersByProductByHour = useMemo(() => {
		const uniqueProductNamesSet = new Set<string>()
		products.forEach(p => uniqueProductNamesSet.add(p.name))
		const productNameList = Array.from(uniqueProductNamesSet)

		const hourlyCounts: Array<Record<string, number>> = Array(24).fill(0).map(() =>
			productNameList.reduce((acc, name) => {
				acc[name] = 0
				return acc
			}, {} as Record<string, number>)
		)

		orders.forEach(order => {
			const hour = new Date(order.createdAt).getHours()
			order.products.forEach(p => {
				const product = products.find(prod => prod._id === p._id)
				if (product) {
					const productName = product.name
					if (hourlyCounts[hour]?.[productName] !== undefined) {
						hourlyCounts[hour][productName] += p.quantity
					}
				}
			})
		})

		return hourlyCounts
	}, [orders, products])

	// Weekdays should start with Monday
	const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
	const ordersByDayOfWeek: number[] = Array(7).fill(0)
	const salesByDayOfWeek: number[] = Array(7).fill(0)
	orders.forEach(order => {
		const jsDay = new Date(order.createdAt).getDay()
		const mondayFirst = (jsDay + 6) % 7
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
	const topProductsByQuantity = Object.entries(productQuantities).sort((a, b) => b[1] - a[1]).slice(0, 5)
	const topProductsByRevenue = Object.entries(productRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5)

	// Room usage analysis
	const roomOrderCounts: Record<string, number> = {}
	orders.forEach(order => {
		const roomName = rooms.find(r => r._id === order.roomId)?.name ?? 'Unknown'
		roomOrderCounts[roomName] = (roomOrderCounts[roomName] || 0) + 1
	})
	const topRooms = Object.entries(roomOrderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
	const busiestRoom = topRooms.length > 0 ? `${topRooms[0][0]} (${topRooms[0][1]})` : '-'

	// Kiosk usage analysis
	const kioskOrderCounts: Record<string, number> = {}
	orders.forEach(order => {
		const kioskName = kiosks.find(k => k._id === order.kioskId)?.name ?? 'Unknown'
		kioskOrderCounts[kioskName] = (kioskOrderCounts[kioskName] || 0) + 1
	})
	const topKiosks = Object.entries(kioskOrderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
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

	// Revenue by room, kiosk, and activity
	const roomRevenueRecord: Record<string, number> = {}
	const kioskRevenueRecord: Record<string, number> = {}
	const activityRevenueRecord: Record<string, number> = {}

	orders.forEach(order => {
		const total = getOrderTotal(order, products, options)
		const roomName = rooms.find(r => r._id === order.roomId)?.name ?? 'Unknown'
		roomRevenueRecord[roomName] = (roomRevenueRecord[roomName] || 0) + total

		const kioskName = kiosks.find(k => k._id === order.kioskId)?.name ?? 'Unknown'
		kioskRevenueRecord[kioskName] = (kioskRevenueRecord[kioskName] || 0) + total

		const actName = activities.find(a => a._id === order.activityId)?.name ?? 'Unknown'
		activityRevenueRecord[actName] = (activityRevenueRecord[actName] || 0) + total
	})

	const revenueByRoom = topRooms.map(([name]) => roomRevenueRecord[name] || 0)
	const revenueByKiosk = topKiosks.map(([name]) => kioskRevenueRecord[name] || 0)
	const revenueByActivity = topActivities.map(([name]) => activityRevenueRecord[name] || 0)

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
	const topOptionsByQuantity = Object.entries(optionQuantities).sort((a, b) => b[1] - a[1]).slice(0, 5)
	const topOptionsByRevenue = Object.entries(optionRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5)

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

	return {
		chartData,
		chartLabels,
		totalSalesDisplay,
		totalOrders,
		avgOrderValueDisplay,
		mostSoldProduct,
		avgProductsDisplay,
		busiestTimeDisplay,
		deliveryPercentDisplay,
		busiestRoom,
		busiestKiosk,
		paymentStatusCount,
		checkoutMethodCount,
		topProductsByQuantity,
		topProductsByRevenue,
		topOptionsByQuantity,
		topOptionsByRevenue,
		topRooms,
		topKiosks,
		topActivities,
		revenueByRoom,
		revenueByKiosk,
		revenueByActivity,
		ordersByHour,
		salesByHour,
		hourLabels,
		salesByProductByHour,
		ordersByProductByHour,
		productNames,
		ordersByDayOfWeek,
		salesByDayOfWeek,
		dayNames
	}
}
