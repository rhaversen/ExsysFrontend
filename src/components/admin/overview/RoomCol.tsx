import Block from '@/components/admin/overview/Block'
import { type OrderType, type RoomType } from '@/types/backendDataTypes'
import { type OrderTypeWithNames } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const RoomCol = ({
	room,
	orders,
	onUpdatedOrders
}: {
	room: RoomType
	orders: OrderTypeWithNames[]
	onUpdatedOrders: (orders: OrderType[]) => void
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
		<div className="m-2 h-full border-2 border-gray-400 rounded-3xl">
			<h2 className="text-gray-800 font-bold text-2xl text-center m-2">{room.name}</h2>
			{Object.keys(ordersByTimeBlock).map((timeBlock) => (
				<Block
					key={timeBlock}
					timeBlock={timeBlock}
					orders={ordersByTimeBlock[timeBlock]}
					onUpdatedOrders={onUpdatedOrders}
				/>
			))}
		</div>
	)
}

export default RoomCol
