'use client'

import axios from 'axios'
import { type ReactElement, useState, useEffect, useCallback, useMemo } from 'react'
import { FiCheck, FiX, FiAlertTriangle, FiFilter, FiZap } from 'react-icons/fi'

import PaymentSimulatorTable from '@/components/admin/debug/PaymentSimulatorTable'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import useCUDOperations from '@/hooks/useCUDOperations'
import type { OrderType, ActivityType, RoomType, KioskType, ProductType, OptionType } from '@/types/backendDataTypes'

type PaymentStatusFilter = 'all' | 'pending' | 'successful' | 'failed'
type OrderStatusFilter = 'all' | 'pending' | 'confirmed' | 'delivered'

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

	const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('pending')
	const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all')

	const fetchOrders = useCallback(async () => {
		try {
			const params: Record<string, string> = {}

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
	}, [API_URL, addError, paymentStatusFilter, orderStatusFilter])

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

	useEffect(() => {
		fetchAllData().catch(addError)
	}, [fetchAllData, addError])

	useEffect(() => {
		fetchOrders().catch(addError)
	}, [fetchOrders, paymentStatusFilter, orderStatusFilter, addError])

	useEntitySocket<OrderType>('order', { setState: setOrders })
	useEntitySocket<ActivityType>('activity', { setState: setActivities })
	useEntitySocket<RoomType>('room', { setState: setRooms })
	useEntitySocket<KioskType>('kiosk', { setState: setKiosks })
	useEntitySocket<ProductType>('product', { setState: setProducts })
	useEntitySocket<OptionType>('option', { setState: setOptions })

	const { createEntity: simulateDebugCallback } = useCUDOperations<{ orderId: string, status: 'successful' | 'failed' }, never>('/service/debug-payment-callback')

	const simulatePaymentCallback = useCallback((
		orderId: string,
		newStatus: 'successful' | 'failed'
	): void => {
		simulateDebugCallback({ orderId, status: newStatus })
	}, [simulateDebugCallback])

	const simulatableOrders = useMemo(() => {
		return orders.filter(order => {
			return order.checkoutMethod === 'sumUp' &&
				order.paymentStatus === 'pending'
		})
	}, [orders])

	const handleSimulateAll = useCallback((status: 'successful' | 'failed') => {
		for (const order of simulatableOrders) {
			simulatePaymentCallback(order._id, status)
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
						{'Debug-værktøj til at simulere SumUp betalingsstatusopdateringer. Dette værktøj kalder en debug version af reader-callback endpointet for at simulere betalingssvar.'}
					</p>
				</div>

				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
					<div className="flex items-start gap-3">
						<FiAlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
						<div className="text-sm text-amber-800">
							<p className="font-medium mb-1">{'Vigtig information'}</p>
							<ul className="list-disc list-inside space-y-1">
								<li>{'Kun ordrer med checkoutMethod "sumUp" kan simuleres'}</li>
								<li>{'Kun ordrer med betalingsstatus "pending" kan simuleres'}</li>
								<li>{'Denne funktion vil ikke påvirke SumUp enheden, kun systemets opfattelse af betalingens status'}</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
					<div className="flex items-center gap-2 mb-4">
						<FiFilter className="w-5 h-5 text-gray-500" />
						<h2 className="text-lg font-semibold text-gray-700">{'Filtre'}</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
					<div className="text-sm text-gray-600">
						{`${orders.length} ordre${orders.length !== 1 ? 'r' : ''} fundet`}
						{simulatableOrders.length > 0 && (
							<span className="ml-2 text-amber-600 font-medium">
								{`(${simulatableOrders.length} kan simuleres)`}
							</span>
						)}
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
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
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
