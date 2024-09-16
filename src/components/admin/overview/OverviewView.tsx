'use client'

import RoomCol from '@/components/admin/overview/RoomCol'
import {
	type ActivityType,
	type OptionType,
	type OrderType,
	type ProductType,
	type RoomType
} from '@/types/backendDataTypes'
import { type OrderTypeWithNames } from '@/types/frontendDataTypes'
import axios from 'axios'
import Image from 'next/image'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

const OverviewView = ({
	products,
	options,
	rooms,
	activities,
}: {
	products: ProductType[]
	options: OptionType[]
	rooms: RoomType[]
	activities: ActivityType[]
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [orders, setOrders] = useState<OrderType[]>([])
	const [ordersWithNames, setOrdersWithNames] = useState<OrderTypeWithNames[]>([])
	const [roomOrders, setRoomOrders] = useState<Record<RoomType['_id'], OrderTypeWithNames[]>>({})

	const getOrders = useCallback(async () => {
		const fromDate = new Date()
		fromDate.setHours(0, 0, 0, 0)
		const toDate = new Date()
		toDate.setHours(24, 0, 0, 0)

		try {
			const response = await axios.get(`${API_URL}/v1/orders?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}&status=pending,confirmed&paymentStatus=successful`, { withCredentials: true })
			const data = response.data as OrderType[]
			setOrders(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const handleOrdersUpdate = useCallback((orders: OrderType[]) => {
		// Only update the orders that were changed
		setOrders((prevOrders) => {
			const newOrders = [...prevOrders]
			orders.forEach((newOrder) => {
				const index = newOrders.findIndex((order) => order._id === newOrder._id)
				if (index === -1) return
				if (newOrder.status === 'delivered') {
					newOrders.splice(index, 1)
					return
				}
				newOrders[index] = newOrder
			})
			return newOrders
		})
	}, [])

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
			const room = rooms.find(room => room._id === activity.roomId?._id)

			const roomName = room?.name ?? 'no-room'
			if (roomOrders[roomName] === undefined) {
				roomOrders[roomName] = []
			}
			roomOrders[roomName].push(order)
		})
		return roomOrders
	}, [ordersWithNames, rooms, activities])

	useEffect(() => {
		setRoomOrders(groupOrdersByRoom())
	}, [setRoomOrders, groupOrdersByRoom])

	useEffect(() => {
		setOrdersWithNames(addNamesToOrders())
	}, [setOrdersWithNames, addNamesToOrders])

	useInterval(getOrders, 1000 * 10) // Fetch orders every 10 seconds

	return (
		<div>
			{orders.length === 0 &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Ingen Ordrer '}&#128522;</p>
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
						orders={roomOrders[room.name] ?? []}
						onUpdatedOrders={handleOrdersUpdate}
					/>
				))}
				{roomOrders['no-room'] !== undefined && roomOrders['no-room'].length > 0 &&
					<RoomCol
						key="no-room"
						room={{
							_id: 'no-room',
							name: 'Ukendt Rum',
							description: 'Aktivitet har intet rum tildelt',
							createdAt: '',
							updatedAt: ''
						}}
						orders={roomOrders['no-room'] ?? []}
						onUpdatedOrders={handleOrdersUpdate}
					/>
				}
			</div>
		</div>
	)
}

export default OverviewView
