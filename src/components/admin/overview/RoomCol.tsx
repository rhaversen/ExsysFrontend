import Block from '@/components/admin/overview/Block'
import { type ActivityType, type OrderType, type RoomType } from '@/types/backendDataTypes'
import { type OrderTypeWithNames } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const RoomCol = ({
	room,
	orders,
	activities,
	onUpdatedOrders
}: {
	room: RoomType
	orders: OrderTypeWithNames[]
	activities: ActivityType[]
	onUpdatedOrders: (orders: OrderType[]) => void
}): ReactElement => {
	const [ordersByActivity, setOrdersByActivity] = useState<Record<string, OrderTypeWithNames[]>>({})

	const groupOrdersByActivity = useCallback(() => {
		const groupedOrders: Record<string, OrderTypeWithNames[]> = {}
		orders.forEach((order) => {
			if (groupedOrders[order.activityId] === undefined) {
				groupedOrders[order.activityId] = []
			}
			groupedOrders[order.activityId].push(order)
		})
		setOrdersByActivity(groupedOrders)
	}, [orders, setOrdersByActivity])

	useEffect(() => {
		groupOrdersByActivity()
	}, [groupOrdersByActivity])

	return (
		<div className="m-2 h-full border-2 border-gray-400 rounded-3xl">
			<h2 className="text-gray-800 font-bold text-2xl text-center m-2">{room.name}</h2>
			{Object.keys(ordersByActivity).map((activityId) => (
				<Block
					key={activityId}
					activityId={activityId}
					orders={ordersByActivity[activityId]}
					onUpdatedOrders={onUpdatedOrders}
				/>
			))}
		</div>
	)
}

export default RoomCol
