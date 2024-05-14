import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

import { type OrderType } from '@/lib/backendDataTypes'
import { type OrderTypeWithNames } from '@/lib/frontendDataTypes'

const Block = ({
	orders,
	timeBlock,
	onOrderUpdate
}: {
	orders: OrderTypeWithNames[]
	timeBlock: string
	onOrderUpdate: (orderIds: Array<OrderType['_id']>, status: OrderType['status']) => void
}): ReactElement => {
	const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({})
	const [confirmedOrders, setConfirmedOrders] = useState<Record<string, number>>({})
	const [orderStatus, setOrderStatus] = useState<OrderType['status']>(orders[0].status)

	const countOrders = useCallback((orders: OrderTypeWithNames[]) => {
		const counts: Record<string, number> = {}
		orders.forEach((order) => {
			order.products.forEach((product) => {
				if (counts[product.name] === undefined) {
					counts[product.name] = 0
				}
				counts[product.name] += 1
			})
			order.options.forEach((option) => {
				if (counts[option.name] === undefined) {
					counts[option.name] = 0
				}
				counts[option.name] += 1
			})
		})
		return counts
	}, [])

	const determineOrderStatus = useCallback(() => {
		// Set the status to the most severe status (pending > confirmed > delivered)
		const statuses = orders.map((order) => order.status)
		if (statuses.includes('pending')) {
			return 'pending'
		}
		if (statuses.includes('confirmed')) {
			return 'confirmed'
		}
		return 'delivered'
	}, [orders])

	useEffect(() => {
		const pending = orders.filter((order) => order.status === 'pending')
		const confirmed = orders.filter((order) => order.status === 'confirmed')

		const pendingOrdersCount = countOrders(pending)
		const confirmedOrdersCount = countOrders(confirmed)

		setPendingOrders(pendingOrdersCount)
		setConfirmedOrders(confirmedOrdersCount)
	}, [orders, setPendingOrders, setConfirmedOrders, countOrders])

	useEffect(() => {
		setOrderStatus(determineOrderStatus())
	}, [setOrderStatus, determineOrderStatus])

	const handleOrderUpdate = (status: OrderType['status']): void => {
		onOrderUpdate(orders.map((order) => order._id), status)
	}

	return (
		<div
			className={`text-gray-800 mx-4 mb-4 p-2 shadow-md border-2 ${orderStatus === 'pending' ? 'bg-blue-300' : ''} border-slate-800 rounded-md`}>
			<h3 className="text-center text-xl ">{timeBlock}</h3>
			{Object.keys({ ...pendingOrders, ...confirmedOrders }).sort().map((name) => {
				const confirmedCount = confirmedOrders[name] ?? 0
				const pendingCount = pendingOrders[name] ?? 0
				const totalCount = pendingCount + confirmedCount
				const diff = pendingCount
				const diffText = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (-${Math.abs(diff)})` : ''

				return (
					<p key={name}>
						{totalCount} {name}{diffText}
					</p>
				)
			})}
			<div className="mt-2">
				{orderStatus === 'pending' &&
					<button type="button" className="rounded bg-blue-500 p-2 hover:bg-blue-600 text-white w-full"
						onClick={() => {
							handleOrderUpdate('confirmed')
						}}>Marker som læst
					</button>
				}
				{orderStatus === 'confirmed' &&
					<button type="button" className="rounded bg-orange-500 p-2 hover:bg-orange-600 w-full"
						onClick={() => {
							handleOrderUpdate('delivered')
						}}>Marker som leveret
					</button>
				}
			</div>
		</div>
	)
}

export default Block
