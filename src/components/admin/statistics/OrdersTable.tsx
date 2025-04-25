import dayjs from 'dayjs'
import { useState } from 'react'
import { FiCheck, FiClock, FiDollarSign, FiAlertTriangle, FiCoffee } from 'react-icons/fi'

import type { OrderType, ProductType, OptionType, RoomType, KioskType } from '@/types/backendDataTypes'

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

type OrdersTableProps = {
  orders: OrderType[];
  products: ProductType[];
  options: OptionType[];
  rooms: RoomType[];
  kiosks: KioskType[];
  currentTime: Date;
};

export default function OrdersTable ({ orders, products, options, rooms, kiosks, currentTime }: OrdersTableProps) {
	const [orderSort, setOrderSort] = useState<{
    field: 'createdAt' | 'status' | 'paymentStatus' | 'room' | 'kiosk' | 'products' | 'total',
    direction: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' })

	const today = new Date().toISOString().slice(0, 10)
	return (
		<div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
			<table className="w-full text-sm bg-white">
				<thead>
					<tr className="bg-gray-100 text-left">
						<th className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors" onClick={() => setOrderSort({ field: 'createdAt', direction: orderSort.field === 'createdAt' && orderSort.direction === 'desc' ? 'asc' : 'desc' })}>
							<div className="flex items-center gap-1">{'Tidspunkt'}{orderSort.field === 'createdAt' && (<span className="text-blue-600">{orderSort.direction === 'desc' ? '↓' : '↑'}</span>)}</div>
						</th>
						<th className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors" onClick={() => setOrderSort({ field: 'paymentStatus', direction: orderSort.field === 'paymentStatus' && orderSort.direction === 'desc' ? 'asc' : 'desc' })}>
							<div className="flex items-center gap-1">{'Betaling'}{orderSort.field === 'paymentStatus' && (<span className="text-blue-600">{orderSort.direction === 'desc' ? '↓' : '↑'}</span>)}</div>
						</th>
						<th className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors" onClick={() => setOrderSort({ field: 'status', direction: orderSort.field === 'status' && orderSort.direction === 'desc' ? 'asc' : 'desc' })}>
							<div className="flex items-center gap-1">{'Status'}{orderSort.field === 'status' && (<span className="text-blue-600">{orderSort.direction === 'desc' ? '↓' : '↑'}</span>)}</div>
						</th>
						<th className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors" onClick={() => setOrderSort({ field: 'kiosk', direction: orderSort.field === 'kiosk' && orderSort.direction === 'desc' ? 'asc' : 'desc' })}>
							<div className="flex items-center gap-1">{'Kiosk'}{orderSort.field === 'kiosk' && (<span className="text-blue-600">{orderSort.direction === 'desc' ? '↓' : '↑'}</span>)}</div>
						</th>
						<th className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors" onClick={() => setOrderSort({ field: 'room', direction: orderSort.field === 'room' && orderSort.direction === 'desc' ? 'asc' : 'desc' })}>
							<div className="flex items-center gap-1">{'Lokale'}{orderSort.field === 'room' && (<span className="text-blue-600">{orderSort.direction === 'desc' ? '↓' : '↑'}</span>)}</div>
						</th>
						<th className="p-3 border-b">{'Indhold'}</th>
						<th className="p-3 cursor-pointer hover:bg-gray-200 border-b transition-colors text-right" onClick={() => setOrderSort({ field: 'total', direction: orderSort.field === 'total' && orderSort.direction === 'desc' ? 'asc' : 'desc' })}>
							<div className="flex items-center justify-end gap-1">{'Beløb'}{orderSort.field === 'total' && (<span className="text-blue-600">{orderSort.direction === 'desc' ? '↓' : '↑'}</span>)}</div>
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
							const orderTime = new Date(order.createdAt)
							const minutesAgo = Math.floor((currentTime.getTime() - orderTime.getTime()) / 60000)
							const isRecent = minutesAgo < 30
							const formattedTime = dayjs(order.createdAt).format('HH:mm')
							const formattedDate = dayjs(order.createdAt).format('DD/MM/YYYY')
							return (
								<tr
									key={order._id}
									className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}${isRecent ? ' animate-pulse-light' : ''} hover:bg-blue-50 transition-colors`}
								>
									<td className="p-3">
										{order.createdAt.slice(0, 10) === today ? (
											<>
												<div className="font-medium">{formattedTime}</div>
												<div className="text-gray-500 text-xs">{formattedDate}</div>
												{isRecent && (
													<div className="text-xs text-blue-600 font-semibold">{minutesAgo === 0 ? 'Lige nu' : `${minutesAgo} min. siden`}</div>
												)}
											</>
										) : (
											<>
												<div className="font-medium">{formattedDate}</div>
												<div className="text-gray-500 text-xs">{formattedTime}</div>
											</>
										)}
									</td>
									<td className="p-3">
										{order.paymentStatus === 'successful' && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Betaling gennemført">
												<FiDollarSign className="w-3 h-3" />{'Betalt\r'}
											</span>
										)}
										{order.paymentStatus === 'pending' && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Afventer betaling">
												<FiClock className="w-3 h-3" />{'Afventer\r'}
											</span>
										)}
										{order.paymentStatus === 'failed' && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title="Betaling fejlede">
												<FiAlertTriangle className="w-3 h-3" />{'Fejlet\r'}
											</span>
										)}
									</td>
									<td className="p-3">
										{order.status === 'pending' && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Afventer behandling">
												<FiClock className="w-3 h-3" />{'Afventer\r'}
											</span>
										)}
										{order.status === 'confirmed' && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title="Ordre er bekræftet">
												<FiCoffee className="w-3 h-3" />{'I produktion\r'}
											</span>
										)}
										{order.status === 'delivered' && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Ordre er leveret">
												<FiCheck className="w-3 h-3" />{'Leveret\r'}
											</span>
										)}
									</td>
									<td className="p-3">
										<div className="truncate max-w-[100px]" title={kioskName}>{kioskName}</div>
									</td>
									<td className="p-3">
										<div className="truncate max-w-[100px]" title={roomName}>{roomName}</div>
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
	)
}
