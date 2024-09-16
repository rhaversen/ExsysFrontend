'use client'

import RoomCol from '@/components/admin/overview/RoomCol'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
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
	activities
}: {
	products: ProductType[]
	options: OptionType[]
	rooms: RoomType[]
	activities: ActivityType[]
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [roomOrders, setRoomOrders] = useState<Record<string, OrderTypeWithNames[]>>({})

	const fetchAndProcessOrders = useCallback(async () => {
		const fromDate = new Date()
		fromDate.setHours(0, 0, 0, 0)
		const toDate = new Date()
		toDate.setHours(24, 0, 0, 0)

		try {
			const { data: orders } = await axios.get<OrderType[]>(
				`${API_URL}/v1/orders`,
				{
					params: {
						fromDate: fromDate.toISOString(),
						toDate: toDate.toISOString(),
						status: 'pending,confirmed',
						paymentStatus: 'successful'
					},
					withCredentials: true
				}
			)

			const enrichedOrders: OrderTypeWithNames[] = orders.map(order => ({
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

			const groupedOrders: Record<string, OrderTypeWithNames[]> = enrichedOrders.reduce<Record<string, OrderTypeWithNames[]>>((acc, order) => {
				const activity = activities.find(a => a._id === order.activityId)
				const room = (activity != null) ? rooms.find(r => r._id === activity.roomId?._id) : undefined
				const roomName = room?.name ?? 'no-room'

				if (acc[roomName] === undefined) {
					acc[roomName] = []
				}
				acc[roomName].push(order)

				return acc
			}, {})
			setRoomOrders(groupedOrders)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, products, options, activities, rooms, addError])

	const handleFetchAndProcessOrders = useCallback(() => {
		fetchAndProcessOrders().catch(addError)
	}, [addError, fetchAndProcessOrders])

	// Initial fetch
	useEffect(() => {
		fetchAndProcessOrders().catch(addError)
	}, [addError, fetchAndProcessOrders])

	// Fetch orders every 10 seconds
	useInterval(fetchAndProcessOrders, 10000)

	return (
		<div>
			{Object.keys(roomOrders).length === 0
				? (
					<>
						<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">
							{'Ingen Ordrer '}&#128522;{'\r'}
						</p>
						<div
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
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
				)
				: (
					<div className="flex flex-row flex-wrap justify-evenly">
						{rooms.filter(room => roomOrders[room.name]?.length).map(room => (
							<RoomCol
								key={room._id}
								room={room}
								orders={roomOrders[room.name] ?? []}
								onUpdatedOrders={handleFetchAndProcessOrders}
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
								onUpdatedOrders={handleFetchAndProcessOrders}
							/>
						)}
					</div>
				)}
		</div>
	)
}

export default OverviewView
