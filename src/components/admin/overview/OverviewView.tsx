'use client'

import RoomCol from '@/components/admin/overview/RoomCol'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
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
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from 'react-use'

const OverviewView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [roomOrders, setRoomOrders] = useState<Record<string, OrderTypeWithNames[]>>({})

	const productsRef = useRef<ProductType[]>([])
	const optionsRef = useRef<OptionType[]>([])
	const roomsRef = useRef<RoomType[]>([])
	const activitiesRef = useRef<ActivityType[]>([])
	const dataReadyPromise = useRef<Promise<void> | null>(null) // Track data readiness

	// Fetch initial data (products, options, rooms, activities)
	const fetchData = useCallback(async (): Promise<void> => {
		try {
			const [
				productsResponse,
				optionsResponse,
				roomsResponse,
				activitiesResponse
			] = await Promise.all([
				axios.get(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/options`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/rooms`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/activities`, { withCredentials: true })
			])

			const productsData = productsResponse.data as ProductType[]
			productsData.forEach((product) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})

			// Update refs
			productsRef.current = productsData
			optionsRef.current = optionsResponse.data as OptionType[]
			roomsRef.current = roomsResponse.data as RoomType[]
			activitiesRef.current = activitiesResponse.data as ActivityType[]
		} catch (error: any) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchAndProcessOrders = useCallback(async (): Promise<void> => {
		// Wait until data is loaded
		if (dataReadyPromise.current !== null) {
			await dataReadyPromise.current
		}

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
					name: productsRef.current.find(p => p._id === product.id)?.name ?? 'Ukendt vare'
				})),
				options: order.options.map(option => ({
					...option,
					name: optionsRef.current.find(o => o._id === option.id)?.name ?? 'Ukendt tilvalg'
				}))
			}))

			const groupedOrders: Record<string, OrderTypeWithNames[]> = enrichedOrders.reduce<Record<string, OrderTypeWithNames[]>>((acc, order) => {
				const activity = activitiesRef.current.find(a => a._id === order.activityId)
				const room = (activity !== null && activity !== undefined) ? roomsRef.current.find(r => r._id === activity.roomId?._id) : undefined
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
	}, [API_URL, addError])

	const handleFetchAndProcessOrders = useCallback(() => {
		fetchAndProcessOrders().catch(addError)
	}, [fetchAndProcessOrders, addError])

	// Fetch data and orders on component mount
	useEffect(() => {
		// Start fetching data and store the promise
		dataReadyPromise.current = fetchData()
		// Start fetching orders
		handleFetchAndProcessOrders()
		const interval = setInterval(handleFetchAndProcessOrders, 1000 * 10) // Every 10 seconds
		return () => { clearInterval(interval) }
	}, [fetchData, addError, handleFetchAndProcessOrders])

	// Refresh data every hour
	useInterval(() => {
		dataReadyPromise.current = fetchData()
	}, 1000 * 60 * 60) // Every hour

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
						{roomsRef.current.filter(room => roomOrders[room.name]?.length).map(room => (
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
