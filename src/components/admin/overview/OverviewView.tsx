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
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const OverviewView = ({
	products,
	options,
	rooms,
	activities
}: {
	products: ProductType[]
	options: OptionType[]
	rooms: RoomType[]
	activities: ActivityType[]
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [orders, setOrders] = useState<OrderType[]>([])
	const [ordersWithNames, setOrdersWithNames] = useState<OrderTypeWithNames[]>([])
	const [roomOrders, setRoomOrders] = useState<Record<RoomType['_id'], OrderTypeWithNames[]>>({})

	const fetchOrders = useCallback(async () => {
		const fromDate = new Date().setHours(0, 0, 0, 0)
		const toDate = new Date().setHours(24, 0, 0, 0)

		try {
			const { data } = await axios.get(
				`${API_URL}/v1/orders`,
				{
					params: {
						fromDate: new Date(fromDate).toISOString(),
						toDate: new Date(toDate).toISOString(),
						status: 'pending,confirmed',
						paymentStatus: 'successful'
					},
					withCredentials: true
				}
			)
			setOrders(data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL])

	const updateOrders = useCallback((updatedOrders: OrderType[]) => {
		setOrders(prevOrders =>
			prevOrders.map(order =>
				updatedOrders.some(updated => updated._id === order._id && updated.status !== 'delivered')
					? updatedOrders.find(updated => updated._id === order._id) || order
					: order
			).filter(order => order.status !== 'delivered')
		)
	}, [])

	const enrichOrdersWithNames = useCallback(() =>
		orders.map(order => ({
			...order,
			products: order.products.map(product => ({
				...product,
				name: products.find(p => p._id === product.id)?.name ?? 'Ukendt vare'
			})),
			options: order.options.map(option => ({
				...option,
				name: options.find(o => o._id === option.id)?.name ?? 'Ukendt tilvalg'
			}))
		}))
		, [orders, products, options])

	const organizeOrdersByRoom = useCallback(() => {
		return ordersWithNames.reduce((acc, order) => {
			const activity = activities.find(a => a._id === order.activityId)
			const room = rooms.find(r => r._id === activity?.roomId?._id)
			const roomName = room?.name ?? 'no-room'

			if (!acc[roomName]) {
				acc[roomName] = []
			}
			acc[roomName].push(order)

			return acc
		}, {} as Record<string, OrderTypeWithNames[]>)
	}, [ordersWithNames, rooms, activities])

	useEffect(() => {
		setOrdersWithNames(enrichOrdersWithNames())
	}, [orders, enrichOrdersWithNames])

	useEffect(() => {
		setRoomOrders(organizeOrdersByRoom())
	}, [ordersWithNames, organizeOrdersByRoom])

	useInterval(fetchOrders, 10000) // Fetch orders every 10 seconds

	return (
		<div>
			{!orders.length ? (
				<>
					<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">Ingen Ordrer &#128522;</p>
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
						<Image
							src="/orderStation/loading.svg"
							alt="loading"
							priority
							draggable="false"
							width={100}
							height={100}
						/>
					</div>
				</>
			) : (
				<div className="flex flex-row flex-wrap justify-evenly">
					{rooms.filter(room => roomOrders[room.name]?.length).map(room => (
						<RoomCol
							key={room._id}
							room={room}
							orders={roomOrders[room.name] ?? []}
							onUpdatedOrders={updateOrders}
						/>
					))}
					{roomOrders['no-room']?.length > 0 && (
						<RoomCol
							key="no-room"
							room={{
								_id: 'no-room',
								name: 'Ukendt Rum',
								description: 'Aktivitet har intet rum tildelt',
								createdAt: '',
								updatedAt: ''
							}}
							orders={roomOrders['no-room']}
							onUpdatedOrders={updateOrders}
						/>
					)}
				</div>
			)}
		</div>
	)
}

export default OverviewView
