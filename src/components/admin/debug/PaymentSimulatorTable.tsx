'use client'

import dayjs from 'dayjs'
import { type ReactElement, useState } from 'react'
import { FiCheck, FiX, FiClock, FiDollarSign, FiAlertTriangle, FiLoader, FiCreditCard } from 'react-icons/fi'

import type { OrderType } from '@/types/backendDataTypes'

interface PaymentSimulatorTableProps {
	orders: OrderType[]
	activityMap: Record<string, string>
	roomMap: Record<string, string>
	kioskMap: Record<string, string>
	productMap: Record<string, string>
	optionMap: Record<string, string>
	onSimulatePayment: (orderId: string, status: 'successful' | 'failed') => Promise<boolean>
}

type SortField = 'createdAt' | 'paymentStatus' | 'status' | 'checkoutMethod' | 'activity' | 'room' | 'kiosk'
type SortDirection = 'asc' | 'desc'

const PaymentStatusBadge = ({ status }: { status: OrderType['paymentStatus'] }): ReactElement | null => {
	switch (status) {
		case 'successful':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
					<FiDollarSign className="w-3 h-3" />{'Gennemført'}
				</span>
			)
		case 'pending':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
					<FiClock className="w-3 h-3" />{'Afventer'}
				</span>
			)
		case 'failed':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
					<FiAlertTriangle className="w-3 h-3" />{'Fejlet'}
				</span>
			)
		default:
			return null
	}
}

const OrderStatusBadge = ({ status }: { status: OrderType['status'] }): ReactElement | null => {
	switch (status) {
		case 'pending':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
					<FiClock className="w-3 h-3" />{'Afventer'}
				</span>
			)
		case 'confirmed':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
					<FiCheck className="w-3 h-3" />{'Bekræftet'}
				</span>
			)
		case 'delivered':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
					<FiCheck className="w-3 h-3" />{'Leveret'}
				</span>
			)
		default:
			return null
	}
}

const CheckoutMethodBadge = ({ method }: { method: OrderType['checkoutMethod'] }): ReactElement | null => {
	switch (method) {
		case 'sumUp':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
					<FiCreditCard className="w-3 h-3" />{'SumUp'}
				</span>
			)
		case 'later':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
					<FiClock className="w-3 h-3" />{'Senere'}
				</span>
			)
		case 'manual':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
					<FiDollarSign className="w-3 h-3" />{'Manuel'}
				</span>
			)
		case 'mobilePay':
			return (
				<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
					<FiCreditCard className="w-3 h-3" />{'MobilePay'}
				</span>
			)
		default:
			return null
	}
}

const SortableHeader = ({
	field,
	children,
	currentSort,
	onSort
}: {
	field: SortField
	children: React.ReactNode
	currentSort: { field: SortField, direction: SortDirection }
	onSort: (field: SortField) => void
}): ReactElement => (
	<th
		className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors text-left"
		onClick={() => onSort(field)}
	>
		<div className="flex items-center gap-1">
			{children}
			{currentSort.field === field && (
				<span className="text-blue-600">{currentSort.direction === 'desc' ? '↓' : '↑'}</span>
			)}
		</div>
	</th>
)

export default function PaymentSimulatorTable ({
	orders,
	activityMap,
	roomMap,
	kioskMap,
	productMap,
	optionMap,
	onSimulatePayment
}: PaymentSimulatorTableProps): ReactElement {
	const [sort, setSort] = useState<{ field: SortField, direction: SortDirection }>({
		field: 'createdAt',
		direction: 'desc'
	})
	const [simulatingOrders, setSimulatingOrders] = useState<Set<string>>(new Set())

	const handleSort = (field: SortField): void => {
		setSort(prev => ({
			field,
			direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
		}))
	}

	const handleSimulate = async (order: OrderType, status: 'successful' | 'failed'): Promise<void> => {
		setSimulatingOrders(prev => new Set(prev).add(order._id))
		await onSimulatePayment(order._id, status)
		setSimulatingOrders(prev => {
			const next = new Set(prev)
			next.delete(order._id)
			return next
		})
	}

	const canSimulate = (order: OrderType): boolean => {
		return order.checkoutMethod === 'sumUp' &&
			order.paymentStatus === 'pending' &&
			!simulatingOrders.has(order._id)
	}

	const hasTransactionId = (order: OrderType): boolean => {
		const transactionId = order.clientTransactionId
		return transactionId !== undefined && transactionId !== null && transactionId !== ''
	}

	const sortedOrders = [...orders].sort((a, b) => {
		const dir = sort.direction === 'desc' ? -1 : 1

		switch (sort.field) {
			case 'createdAt':
				return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
			case 'paymentStatus':
				return dir * a.paymentStatus.localeCompare(b.paymentStatus)
			case 'status':
				return dir * a.status.localeCompare(b.status)
			case 'checkoutMethod':
				return dir * a.checkoutMethod.localeCompare(b.checkoutMethod)
			case 'activity':
				return dir * (activityMap[a.activityId] ?? '').localeCompare(activityMap[b.activityId] ?? '')
			case 'room':
				return dir * (roomMap[a.roomId] ?? '').localeCompare(roomMap[b.roomId] ?? '')
			case 'kiosk':
				return dir * (kioskMap[a.kioskId ?? ''] ?? '').localeCompare(kioskMap[b.kioskId ?? ''] ?? '')
			default:
				return 0
		}
	})

	return (
		<div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
			<table className="w-full text-sm bg-white">
				<thead>
					<tr className="bg-gray-100">
						<SortableHeader field="createdAt" currentSort={sort} onSort={handleSort}>{'Tidspunkt'}</SortableHeader>
						<th className="p-3 border-b text-left">{'Ordre ID'}</th>
						<SortableHeader field="checkoutMethod" currentSort={sort} onSort={handleSort}>{'Betalingsmetode'}</SortableHeader>
						<SortableHeader field="paymentStatus" currentSort={sort} onSort={handleSort}>{'Betalingsstatus'}</SortableHeader>
						<SortableHeader field="status" currentSort={sort} onSort={handleSort}>{'Ordrestatus'}</SortableHeader>
						<SortableHeader field="activity" currentSort={sort} onSort={handleSort}>{'Aktivitet'}</SortableHeader>
						<SortableHeader field="room" currentSort={sort} onSort={handleSort}>{'Spisested'}</SortableHeader>
						<SortableHeader field="kiosk" currentSort={sort} onSort={handleSort}>{'Kiosk'}</SortableHeader>
						<th className="p-3 border-b text-left">{'Produkter'}</th>
						<th className="p-3 border-b text-left">{'Transaction ID'}</th>
						<th className="p-3 border-b text-center">{'Simuler'}</th>
					</tr>
				</thead>
				<tbody>
					{sortedOrders.map((order, index) => {
						const isSimulating = simulatingOrders.has(order._id)
						const canSimulateOrder = canSimulate(order)
						const formattedTime = dayjs(order.createdAt).format('HH:mm')
						const formattedDate = dayjs(order.createdAt).format('DD/MM/YYYY')

						const productNames = order.products
							.map(p => `${productMap[p._id] ?? p._id} (${p.quantity})`)
							.join(', ')
						const optionNames = order.options
							.map(o => `${optionMap[o._id] ?? o._id} (${o.quantity})`)
							.join(', ')
						const contentSummary = [productNames, optionNames].filter(Boolean).join(' + ')

						return (
							<tr
								key={order._id}
								className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors ${canSimulateOrder ? 'ring-2 ring-inset ring-amber-200' : ''}`}
							>
								<td className="p-3">
									<div className="font-medium">{formattedTime}</div>
									<div className="text-gray-500 text-xs">{formattedDate}</div>
								</td>
								<td className="p-3">
									<div className="font-mono text-xs text-gray-600 truncate max-w-20" title={order._id}>
										{order._id.slice(-8)}
									</div>
								</td>
								<td className="p-3">
									<CheckoutMethodBadge method={order.checkoutMethod} />
								</td>
								<td className="p-3">
									<PaymentStatusBadge status={order.paymentStatus} />
								</td>
								<td className="p-3">
									<OrderStatusBadge status={order.status} />
								</td>
								<td className="p-3">
									<div className="truncate max-w-24" title={activityMap[order.activityId]}>
										{activityMap[order.activityId] ?? 'Ukendt'}
									</div>
								</td>
								<td className="p-3">
									<div className="truncate max-w-24" title={roomMap[order.roomId]}>
										{roomMap[order.roomId] ?? 'Ukendt'}
									</div>
								</td>
								<td className="p-3">
									<div className="truncate max-w-24" title={kioskMap[order.kioskId ?? '']}>
										{order.kioskId !== null && order.kioskId !== '' ? (kioskMap[order.kioskId] ?? 'Ukendt') : '-'}
									</div>
								</td>
								<td className="p-3">
									<div className="truncate max-w-36" title={contentSummary}>
										{contentSummary !== '' ? contentSummary : '-'}
									</div>
								</td>
								<td className="p-3">
									<div className="font-mono text-xs text-gray-500 truncate max-w-24" title={order.clientTransactionId ?? undefined}>
										{hasTransactionId(order) ? order.clientTransactionId?.slice(-12) : '-'}
									</div>
								</td>
								<td className="p-3">
									{canSimulateOrder ? (
										<div className="flex items-center justify-center gap-1">
											<button
												onClick={() => { void handleSimulate(order, 'successful') }}
												disabled={isSimulating}
												className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
												title="Marker som gennemført"
											>
												{isSimulating ? (
													<FiLoader className="w-3 h-3 animate-spin" />
												) : (
													<FiCheck className="w-3 h-3" />
												)}
											</button>
											<button
												onClick={() => { void handleSimulate(order, 'failed') }}
												disabled={isSimulating}
												className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
												title="Marker som fejlet"
											>
												{isSimulating ? (
													<FiLoader className="w-3 h-3 animate-spin" />
												) : (
													<FiX className="w-3 h-3" />
												)}
											</button>
										</div>
									) : (
										<div className="text-center text-gray-400 text-xs">
											{order.checkoutMethod !== 'sumUp' ? (
												'Ikke SumUp'
											) : order.paymentStatus !== 'pending' ? (
												'Slutstatus'
											) : !hasTransactionId(order) ? (
												'Ingen ID'
											) : isSimulating ? (
												<FiLoader className="w-4 h-4 animate-spin mx-auto" />
											) : (
												'-'
											)}
										</div>
									)}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}
