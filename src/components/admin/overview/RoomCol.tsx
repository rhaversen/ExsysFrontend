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
	const [ordersByActivity, setOrdersByActivity] = useState<Record<string, OrderTypeWithNames[]>>({})
	const [totalProducts, setTotalProducts] = useState<Record<string, number>>({})
	const [totalOptions, setTotalOptions] = useState<Record<string, number>>({})

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

	useEffect(() => {
		const productsCount: Record<string, number> = {}
		const optionsCount: Record<string, number> = {}

		orders.forEach(order => {
			order.products.forEach(({
				name,
				quantity
			}) => {
				productsCount[name] = (productsCount[name] ?? 0) + quantity
			})

			order.options.forEach(({
				name,
				quantity
			}) => {
				optionsCount[name] = (optionsCount[name] ?? 0) + quantity
			})
		})

		setTotalProducts(productsCount)
		setTotalOptions(optionsCount)
	}, [orders])

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
			<h3 className="text-gray-800 font-bold text-xl text-center m-2">Total</h3>
			<div className="m-2 p-2 h-full border-2 border-gray-400 rounded-3xl">
				<div className="flex flex-col items-center">
					<div className="text-gray-800 text-lg">
						{Object.entries(totalProducts).map(([name, quantity]) => (
							<p key={name}>{quantity} x {name}</p>
						))}
						{Object.entries(totalOptions).map(([name, quantity]) => (
							<p key={name}>{quantity} x {name}</p>
						))}

					</div>
				</div>
			</div>
		</div>
	)
}

export default RoomCol
