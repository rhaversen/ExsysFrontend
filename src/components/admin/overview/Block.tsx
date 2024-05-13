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
	const [groupedOrders, setGroupedOrders] = useState<Record<string, number>>({})
	const [orderStatus, setOrderStatus] = useState<OrderType['status']>(orders[0].status)

	const countOrders = useCallback(() => {
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
	}, [orders])

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
		setGroupedOrders(countOrders())
	}, [setGroupedOrders, countOrders])

	useEffect(() => {
		setOrderStatus(determineOrderStatus())
	}, [setOrderStatus, determineOrderStatus])

	const handleOrderUpdate = (status: OrderType['status']): void => {
		onOrderUpdate(orders.map((order) => order._id), status)
	}

	return (
		<div className="text-slate-800 border-2 border-slate-800 rounded-md mb-2 p-2">
			<h3 className="text-center text-xl ">{timeBlock}</h3>
			{Object.keys(groupedOrders).toSorted().map((name) => (
				<p key={name}>
					{groupedOrders[name]} {name}
				</p>
			))}
			<p>{orderStatus}</p>
			<div className="flex justify-evenly mt-2">
				<button onClick={() => {
					handleOrderUpdate('confirmed')
				}}>Læst
				</button>
				<button onClick={() => {
					handleOrderUpdate('delivered')
				}}>Leveret
				</button>
			</div>
		</div>
	)
}

export default Block
