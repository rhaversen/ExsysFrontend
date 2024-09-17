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
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

const OverviewView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [roomOrders, setRoomOrders] = useState<Record<string, OrderTypeWithNames[]>>({})

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])

	const getProducts = useCallback(async () => {
		try {
			const productsResponse = await axios.get(API_URL + '/v1/products', { withCredentials: true })
			const products = productsResponse.data as ProductType[]
			// Convert orderWindow to local time for all products
			products.forEach((product) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(products)
		} catch (error: any) {
		}
	}, [API_URL])

	const getOptions = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/options', { withCredentials: true })
			const data = response.data as OptionType[]
			setOptions(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const getRooms = useCallback(async () => {
		try {
			const roomsResponse = await axios.get(API_URL + '/v1/rooms', { withCredentials: true })
			const rooms = roomsResponse.data as RoomType[]
			setRooms(rooms)
		} catch (error: any) {
		}
	}, [API_URL])

	const getActivities = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/activities', { withCredentials: true })
			const data = response.data as ActivityType[]
			setActivities(data)
		} catch (error: any) {
		}
	}, [API_URL])

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

	const fetchData = useCallback(() => {
		Promise.all([
			getRooms(),
			getProducts(),
			getOptions(),
			getActivities()
		]).catch((error: any) => {
			addError(error)
		})
	}, [getProducts, getOptions, getRooms, addError, getActivities])

	// Initial fetch of orders
	useEffect(() => {
		console.log('Fetching orders')
		fetchAndProcessOrders().catch(addError)
	}, [addError, fetchAndProcessOrders])

	// Initial fetch of data
	useEffect(() => {
		console.log('Fetching data')
		fetchData()
	}, [addError, fetchData])

	useInterval(fetchData, 1000 * 60 * 60) // Fetch data every hour
	useInterval(fetchAndProcessOrders, 1000 * 10) // Fetch orders every 10 seconds

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
