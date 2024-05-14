import { type OrderType, type RoomType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Block from '@/components/admin/overview/Block'
import { type OrderTypeWithNames } from '@/lib/frontendDataTypes'

const RoomCol = ({
	room,
	orders,
	onOrderUpdate
}: {
	room: RoomType
	orders: OrderTypeWithNames[]
	onOrderUpdate: (orderIds: Array<OrderType['_id']>, status: OrderType['status']) => void
}): ReactElement => {
	const [ordersByTimeBlock, setOrdersByTimeBlock] = useState<Record<string, OrderTypeWithNames[]>>({})

	const getTimeBlock = useCallback((date: Date) => {
		const hour = date.getHours()
		const minute = date.getMinutes()
		const toHour = minute < 30 ? hour : hour + 1
		return `${hour}:${minute < 30 ? '00' : '30'}-${toHour}:${minute < 30 ? '30' : '00'}`
	}, [])

	const groupOrdersByTimeBlock = useCallback(() => {
		const ordersByTimeBlock: Record<string, OrderTypeWithNames[]> = {}
		orders.forEach((order) => {
			const timeBlock = getTimeBlock(new Date(order.createdAt))
			if (ordersByTimeBlock[timeBlock] === undefined) {
				ordersByTimeBlock[timeBlock] = []
			}
			ordersByTimeBlock[timeBlock].push(order)
		})
		return ordersByTimeBlock
	}, [orders, getTimeBlock])

	useEffect(() => {
		setOrdersByTimeBlock(groupOrdersByTimeBlock())
	}, [setOrdersByTimeBlock, groupOrdersByTimeBlock])

	return (
		<div className="border-2 border-gray-300 rounded-3xl">
			<h2 className="text-gray-900 font-bold text-2xl text-center m-2">{room.name}</h2>
			{Object.keys(ordersByTimeBlock).map((timeBlock) => (
				<Block
					key={timeBlock}
					timeBlock={timeBlock}
					orders={ordersByTimeBlock[timeBlock]}
					onOrderUpdate={onOrderUpdate}
				/>
			))}
		</div>
	)
}

export default RoomCol
