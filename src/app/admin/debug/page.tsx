'use client'

import axios from 'axios'
import { type ReactElement, useState, useEffect, useCallback, useMemo } from 'react'
import { FiRefreshCw, FiCheck, FiX, FiClock, FiDollarSign, FiAlertTriangle, FiFilter, FiZap } from 'react-icons/fi'

import PaymentSimulatorTable from '@/components/admin/debug/PaymentSimulatorTable'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import type { OrderType, ActivityType, RoomType, KioskType, ProductType, OptionType } from '@/types/backendDataTypes'

type PaymentStatusFilter = 'all' | 'pending' | 'successful' | 'failed'
type OrderStatusFilter = 'all' | 'pending' | 'confirmed' | 'delivered'

function generateUUID (): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0
		const v = c === 'x' ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	})
}

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [orders, setOrders] = useState<OrderType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)

	const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('pending')
	const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all')
	const [fromDate, setFromDate] = useState<string>(() => {
		const date = new Date()
		date.setHours(0, 0, 0, 0)
		return date.toISOString().slice(0, 10)
	})
	const [toDate, setToDate] = useState<string>(() => {
		const date = new Date()
		date.setHours(23, 59, 59, 999)
		return date.toISOString().slice(0, 10)
	})

	const fetchOrders = useCallback(async () => {
		try {
			const params: Record<string, string> = {}

			if (fromDate !== '') {
				const from = new Date(fromDate)
				from.setHours(0, 0, 0, 0)
				params.fromDate = from.toISOString()
			}
			if (toDate !== '') {
				const to = new Date(toDate)
				to.setHours(23, 59, 59, 999)
				params.toDate = to.toISOString()
			}
			if (paymentStatusFilter !== 'all') {
				params.paymentStatus = paymentStatusFilter
			}
			if (orderStatusFilter !== 'all') {
				params.status = orderStatusFilter
			}

			const response = await axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
				params,
				withCredentials: true
			})
			setOrders(response.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError, fromDate, toDate, paymentStatusFilter, orderStatusFilter])

	const fetchReferenceData = useCallback(async () => {
		try {
			const [activitiesRes, roomsRes, kiosksRes, productsRes, optionsRes] = await Promise.all([
				axios.get<ActivityType[]>(`${API_URL}/v1/activities`, { withCredentials: true }),
				axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true }),
				axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true }),
				axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get<OptionType[]>(`${API_URL}/v1/options`, { withCredentials: true })
			])
			setActivities(activitiesRes.data)
			setRooms(roomsRes.data)
			setKiosks(kiosksRes.data)
			setProducts(productsRes.data)
			setOptions(optionsRes.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchAllData = useCallback(async () => {
		setLoading(true)
		await Promise.all([fetchOrders(), fetchReferenceData()])
		setLoading(false)
	}, [fetchOrders, fetchReferenceData])

	const handleRefresh = useCallback(async () => {
		setRefreshing(true)
		await fetchOrders()
		setRefreshing(false)
	}, [fetchOrders])

	useEffect(() => {
		fetchAllData().catch(addError)
	}, [fetchAllData, addError])

	useEffect(() => {
		fetchOrders().catch(addError)
	}, [fetchOrders, paymentStatusFilter, orderStatusFilter, fromDate, toDate, addError])

	const simulatePaymentCallback = useCallback(async (
		clientTransactionId: string,
		newStatus: 'successful' | 'failed'
	): Promise<boolean> => {
		try {
			const response = await fetch(`${API_URL}/v1/reader-callback`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: generateUUID(),
					event_type: 'payment.updated',
					payload: {
						client_transaction_id: clientTransactionId,
						merchant_code: 'DEBUG',
						status: newStatus,
						transaction_id: null
					},
					timestamp: new Date().toISOString()
				})
			})

			if (!response.ok) {
				throw new Error('Failed to simulate callback')
			}

			await handleRefresh()
			return true
		} catch (error) {
			addError(error)
			return false
		}
	}, [API_URL, addError, handleRefresh])

	const simulatableOrders = useMemo(() => {
		return orders.filter(order => {
			const transactionId = order.clientTransactionId
			return order.checkoutMethod === 'sumUp' &&
				order.paymentStatus === 'pending' &&
				transactionId !== undefined && transactionId !== null && transactionId !== ''
		})
	}, [orders])

	const handleSimulateAll = useCallback(async (status: 'successful' | 'failed') => {
		for (const order of simulatableOrders) {
			const transactionId = order.clientTransactionId
			if (transactionId !== undefined && transactionId !== null && transactionId !== '') {
				await simulatePaymentCallback(transactionId, status)
			}
		}
	}, [simulatableOrders, simulatePaymentCallback])

	const activityMap = useMemo(() => {
		return activities.reduce<Record<string, string>>((acc, act) => {
			acc[act._id] = act.name
			return acc
		}, {})
	}, [activities])

	const roomMap = useMemo(() => {
		return rooms.reduce<Record<string, string>>((acc, room) => {
			acc[room._id] = room.name
			return acc
		}, {})
	}, [rooms])

	const kioskMap = useMemo(() => {
		return kiosks.reduce<Record<string, string>>((acc, kiosk) => {
			acc[kiosk._id] = kiosk.name
			return acc
		}, {})
	}, [kiosks])

	const productMap = useMemo(() => {
		return products.reduce<Record<string, string>>((acc, prod) => {
			acc[prod._id] = prod.name
			return acc
		}, {})
	}, [products])

	const optionMap = useMemo(() => {
		return options.reduce<Record<string, string>>((acc, opt) => {
			acc[opt._id] = opt.name
			return acc
		}, {})
	}, [options])

	return (
		<main className="flex flex-col items-center p-4">
			<div className="w-full max-w-7xl">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">{'Betalingssimulator'}</h1>
					<p className="text-gray-600">
						{'Debug-værktøj til at simulere SumUp betalingsstatus opdateringer. Dette værktøj kalder reader-callback endpointet for at simulere betalingssvar.'}
					</p>
				</div>

				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
					<div className="flex items-start gap-3">
						<FiAlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
						<div className="text-sm text-amber-800">
							<p className="font-medium mb-1">{'Vigtig information'}</p>
							<ul className="list-disc list-inside space-y-1">
								<li>{'Kun ordrer med checkoutMethod "sumUp" og paymentStatus "pending" kan simuleres'}</li>
								<li>{'Ordrer i slutstatus (successful/failed) kan ikke ændres'}</li>
								<li>{'WebSocket opdateringer inkluderer ikke clientTransactionId - brug Opdater knappen efter ændringer'}</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
					<div className="flex items-center gap-2 mb-4">
						<FiFilter className="w-5 h-5 text-gray-500" />
						<h2 className="text-lg font-semibold text-gray-700">{'Filtre'}</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div>
							<label htmlFor="fromDate" className="block text-sm font-medium text-gray-600 mb-1">{'Fra dato'}</label>
							<input
								id="fromDate"
								type="date"
								value={fromDate}
								onChange={(e) => setFromDate(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label htmlFor="toDate" className="block text-sm font-medium text-gray-600 mb-1">{'Til dato'}</label>
							<input
								id="toDate"
								type="date"
								value={toDate}
								onChange={(e) => setToDate(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-600 mb-1">{'Betalingsstatus'}</label>
							<select
								id="paymentStatus"
								value={paymentStatusFilter}
								onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatusFilter)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="all">{'Alle'}</option>
								<option value="pending">{'Afventer'}</option>
								<option value="successful">{'Gennemført'}</option>
								<option value="failed">{'Fejlet'}</option>
							</select>
						</div>
						<div>
							<label htmlFor="orderStatus" className="block text-sm font-medium text-gray-600 mb-1">{'Ordrestatus'}</label>
							<select
								id="orderStatus"
								value={orderStatusFilter}
								onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="all">{'Alle'}</option>
								<option value="pending">{'Afventer'}</option>
								<option value="confirmed">{'Bekræftet'}</option>
								<option value="delivered">{'Leveret'}</option>
							</select>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
					<div className="flex items-center gap-4">
						<button
							onClick={() => { void handleRefresh() }}
							disabled={refreshing}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
							{'Opdater'}
						</button>
						<div className="text-sm text-gray-600">
							{`${orders.length} ordre${orders.length !== 1 ? 'r' : ''} fundet`}
							{simulatableOrders.length > 0 && (
								<span className="ml-2 text-amber-600 font-medium">
									{`(${simulatableOrders.length} kan simuleres)`}
								</span>
							)}
						</div>
					</div>
					{simulatableOrders.length > 0 && (
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600 mr-2">{'Simuler alle afventende:'}</span>
							<button
								onClick={() => { void handleSimulateAll('successful') }}
								className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
							>
								<FiCheck className="w-4 h-4" />
								{'Gennemfør'}
							</button>
							<button
								onClick={() => { void handleSimulateAll('failed') }}
								className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
							>
								<FiX className="w-4 h-4" />
								{'Fejl'}
							</button>
						</div>
					)}
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
					<div className="p-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
							<FiZap className="w-5 h-5 text-purple-500" />
							{'Ordrer'}
						</h2>
					</div>
					<div className="p-4">
						<div className="flex flex-wrap gap-3 mb-4">
							<div className="flex items-center gap-2 text-sm">
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
									<FiClock className="w-3 h-3" />{'Afventer'}
								</span>
								<span className="text-gray-500">{'Kan simuleres'}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
									<FiDollarSign className="w-3 h-3" />{'Gennemført'}
								</span>
								<span className="text-gray-500">{'Slutstatus'}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
									<FiAlertTriangle className="w-3 h-3" />{'Fejlet'}
								</span>
								<span className="text-gray-500">{'Slutstatus'}</span>
							</div>
						</div>

						{loading ? (
							<div className="flex items-center justify-center py-12">
								<FiRefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
							</div>
						) : orders.length === 0 ? (
							<div className="text-center py-12 text-gray-500">
								{'Ingen ordrer fundet med de valgte filtre'}
							</div>
						) : (
							<PaymentSimulatorTable
								orders={orders}
								activityMap={activityMap}
								roomMap={roomMap}
								kioskMap={kioskMap}
								productMap={productMap}
								optionMap={optionMap}
								onSimulatePayment={simulatePaymentCallback}
							/>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}
