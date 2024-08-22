'use client'

import RoomCol from '@/components/admin/overview/RoomCol'
import { type ActivityType, type OptionType, type OrderType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import { type OrderTypeWithNames } from '@/types/frontendDataTypes'
import Image from 'next/image'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const OverviewView = ({
	orders,
	products,
	options,
	rooms,
	activities,
	isFetching,
	onUpdatedOrders
}: {
	orders: OrderType[]
	products: ProductType[]
	options: OptionType[]
	rooms: RoomType[]
	activities: ActivityType[]
	isFetching: boolean
	onUpdatedOrders: (orders: OrderType[]) => void
}): ReactElement => {
	const [ordersWithNames, setOrdersWithNames] = useState<OrderTypeWithNames[]>([])
	const [roomOrders, setRoomOrders] = useState<Record<RoomType['_id'], OrderTypeWithNames[]>>({})

	const addNamesToOrders = useCallback(() => {
		return orders.map((order) => ({
			...order,
			products: order.products.map((product) => ({
				...product,
				name: products.find((p) => p._id === product.id)?.name ?? 'Ukendt vare'
			})),
			options: order.options.map((option) => ({
				...option,
				name: options.find((o) => o._id === option.id)?.name ?? 'Ukendt tilvalg'
			}))
		}))
	}, [orders, products, options])

	const groupOrdersByRoom = useCallback(() => {
		const roomOrders: Record<string, OrderTypeWithNames[]> = {} // Use string for room name indexing
		ordersWithNames.forEach((order) => {
			// Find the activity corresponding to the order
			const activity = activities.find(activity => activity._id === order.activityId)
			if (activity === undefined) return // Skip if no activity found

			// Find the room using the roomId from the found activity
			const room = rooms.find(room => room._id === activity.roomId._id)
			if (room === undefined) return // Skip if no room found

			const roomName = room.name
			if (roomOrders[roomName] === undefined) {
				roomOrders[roomName] = []
			}
			roomOrders[roomName].push(order)
		})
		return roomOrders
	}, [ordersWithNames, rooms, activities]) // Include activities in the dependency array

	useEffect(() => {
		setRoomOrders(groupOrdersByRoom())
	}, [setRoomOrders, groupOrdersByRoom])

	useEffect(() => {
		setOrdersWithNames(addNamesToOrders())
	}, [setOrdersWithNames, addNamesToOrders])

	return (
		<div>
			{isFetching &&
				<div className="flex justify-center flex-row">
					<p className="p-10 font-bold text-gray-800 text-2xl">Henter Order...</p>
				</div>
			}
			{orders.length === 0 && !isFetching &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">Ingen Ordrer 😊</p>
			}
			{orders.length === 0 &&
				<div
					className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center"
				>
					<Image
						src="/orderStation/loading.svg"
						alt="loading"
						priority // Load image immediately
						draggable="false"
						width={100}
						height={100}
					/>
				</div>
			}
			<div className="flex flex-row flex-wrap justify-evenly">
				{rooms.filter(room => roomOrders[room.name] !== undefined && roomOrders[room.name].length > 0).map((room) => (
					<RoomCol
						key={room._id}
						room={room}
						activities={activities}
						orders={roomOrders[room.name] ?? []}
						onUpdatedOrders={onUpdatedOrders}
					/>
				))}
			</div>
		</div>
	)
}

export default OverviewView
