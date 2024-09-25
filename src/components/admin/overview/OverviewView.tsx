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
import { type UpdatedOrderType } from '@/types/frontendDataTypes'
import axios from 'axios'
import Image from 'next/image'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from 'react-use'
import { io, type Socket } from 'socket.io-client'

const OverviewView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { addError } = useError()

	const [roomOrders, setRoomOrders] = useState<Record<string, OrderType[]>>({})

	const productsRef = useRef<ProductType[]>([])
	const optionsRef = useRef<OptionType[]>([])
	const roomsRef = useRef<RoomType[]>([])
	const activitiesRef = useRef<ActivityType[]>([])

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

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

	const getRoomNameFromOrder = useCallback((order: OrderType): string => {
		const activity = activitiesRef.current.find(a => a._id === order.activityId)
		const room = (activity !== undefined) ? roomsRef.current.find(r => r._id === activity.roomId?._id) : undefined
		return room?.name ?? 'no-room'
	}, [])

	const groupOrdersByRoomName = useCallback((orders: OrderType[]): Record<string, OrderType[]> => {
		return orders.reduce<Record<string, OrderType[]>>((acc, order) => {
			const roomName = getRoomNameFromOrder(order)
			if (acc[roomName] === undefined) {
				acc[roomName] = []
			}
			acc[roomName].push(order)
			return acc
		}, {})
	}, [getRoomNameFromOrder])

	const addOrderToRoomOrders = useCallback(
		(prevRoomOrders: Record<string, OrderType[]>, order: OrderType): Record<string, OrderType[]> => {
			const roomName = getRoomNameFromOrder(order)
			return {
				...prevRoomOrders,
				[roomName]: [...(prevRoomOrders[roomName] ?? []), order]
			}
		},
		[getRoomNameFromOrder]
	)

	const fetchAndProcessOrders = useCallback(async (): Promise<void> => {
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

			const groupedOrders = groupOrdersByRoomName(orders)
			setRoomOrders(groupedOrders)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError, groupOrdersByRoomName])

	const handleNewOrder = useCallback(
		(order: OrderType) => {
			try {
				setRoomOrders(prevRoomOrders => addOrderToRoomOrders(prevRoomOrders, order))
			} catch (error: any) {
				addError(error)
			}
		},
		[addError, addOrderToRoomOrders]
	)

	const handleUpdatedOrders = useCallback((updatedOrders: UpdatedOrderType[]) => {
		try {
			setRoomOrders((prevRoomOrders) => {
				const newRoomOrders = { ...prevRoomOrders }

				updatedOrders.forEach((updatedOrder) => {
					for (const roomName in newRoomOrders) {
						const orders = newRoomOrders[roomName]
						const index = orders.findIndex((order) => order._id === updatedOrder._id)
						if (index !== -1) {
							// Update the status of the order
							orders[index].status = updatedOrder.status
							break // Exit the loop once the order is found
						}
					}
				})

				return newRoomOrders
			})
		} catch (error: any) {
			addError(error)
		}
	}, [addError])

	// Fetch data and orders on component mount
	useEffect(() => {
		// Must use Promise chaining to ensure data is loaded before orders
		fetchData().then(fetchAndProcessOrders).catch(addError)
	}, [addError, fetchAndProcessOrders, fetchData])

	// Listen for new orders
	useEffect(() => {
		if (socket !== null) {
			socket.on('orderCreated', (order: OrderType) => {
				handleNewOrder(order)
			})

			// Cleanup the listener when order or socket changes
			return () => {
				socket.off('orderCreated', handleNewOrder)
			}
		}
	}, [socket, addError, handleNewOrder])

	// Initialize WebSocket connection
	useEffect(() => {
		if (WS_URL === undefined || WS_URL === null || WS_URL === '') return
		// Initialize WebSocket connection
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			// Cleanup WebSocket connection on component unmount
			socketInstance.disconnect()
		}
	}, [WS_URL])

	// Refresh data every hour
	useInterval(() => {
		fetchData().catch(addError)
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
						{roomsRef.current
							.filter(
								room =>
									roomOrders[room.name]?.filter(order => order.status !== 'delivered').length > 0
							)
							.map(room => (
								<RoomCol
									key={room._id}
									room={room}
									orders={roomOrders[room.name]?.filter(order => order.status !== 'delivered') ?? []}
									onUpdatedOrders={handleUpdatedOrders}
								/>
							))}
						{roomOrders['no-room']?.filter(order => order.status !== 'delivered')?.length > 0 && (
							<RoomCol
								key="no-room"
								room={{
									_id: 'no-room',
									name: 'Ukendt Rum',
									description: 'Aktivitet har intet rum tildelt',
									createdAt: '',
									updatedAt: ''
								}}
								orders={roomOrders['no-room']?.filter(order => order.status !== 'delivered') ?? []}
								onUpdatedOrders={handleUpdatedOrders}
							/>
						)}
					</div>
				)}
		</div>
	)
}

export default OverviewView
