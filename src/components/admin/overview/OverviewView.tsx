'use client'

import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { type OptionType, type OrderType, type ProductType, type RoomType } from '@/lib/backendDataTypes'
import { useInterval } from 'react-use'
import RoomCol from '@/components/admin/overview/RoomCol'
import { type OrderTypeWithNames } from '@/lib/frontendDataTypes'

const OverviewView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [fetching, setFetching] = useState<boolean>(true)
	const [orders, setOrders] = useState<OrderType[]>([])
	const [ordersWithNames, setOrdersWithNames] = useState<OrderTypeWithNames[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [roomOrders, setRoomOrders] = useState<Record<RoomType['_id'], OrderTypeWithNames[]>>({})

	const getOrders = useCallback(async () => {
		const fromDate = new Date()
		fromDate.setHours(0, 0, 0, 0)
		const toDate = new Date()
		toDate.setHours(24, 0, 0, 0)

		const response = await axios.get(`${API_URL}/v1/orders?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}&status=pending,confirmed`)
		const data = response.data as OrderType[]

		setOrders(data)
	}, [API_URL])

	const getProducts = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/products')
		const data = response.data as ProductType[]
		setProducts(data)
	}, [API_URL])

	const getOptions = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/options')
		const data = response.data as OptionType[]
		setOptions(data)
	}, [API_URL])

	const getRooms = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/rooms')
		const data = response.data as RoomType[]
		setRooms(data)
	}, [API_URL])

	const fetchData = useCallback(async () => {
		setFetching(true)
		try {
			await getRooms()
			await getProducts()
			await getOptions()
			await getOrders()
		} catch (error) {
			console.error(error)
		}
		setFetching(false)
	}, [getOrders, getProducts, getOptions, getRooms])

	const addNamesToOrders = useCallback(() => {
		return orders.map((order) => ({
			...order,
			products: order.products.map((product) => ({
				...product,
				name: products.find((p) => p._id === product.id)?.name ?? 'Ukendt vare'
			})),
			options: order.options.map((option) => ({
				...option,
				name: options.find((o) => o._id === option.id)?.name ?? 'Ukendt vare'
			}))
		}))
	}, [orders, products, options])

	const updateOrders = useCallback(async (orderIds: Array<OrderType['_id']>, status: OrderType['status']) => {
		const response = await axios.patch(API_URL + '/v1/orders', {
			orderIds,
			status
		})
		const data = response.data as OrderType[]
		// Only update the orders that were changed
		setOrders((prevOrders) => {
			const newOrders = [...prevOrders]
			data.forEach((newOrder) => {
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
	}, [API_URL, setOrders])

	const groupOrdersByRoom = useCallback(() => {
		const roomOrders: Record<RoomType['_id'], OrderTypeWithNames[]> = {}
		ordersWithNames.forEach((order) => {
			const room = rooms.find((room) => room._id === order.roomId)
			if (room === undefined) return
			const roomName = room.name
			if (roomOrders[roomName] === undefined) {
				roomOrders[roomName] = []
			}
			roomOrders[roomName].push(order)
		})
		return roomOrders
	}, [ordersWithNames, rooms])

	const handleOrderUpdate = useCallback((orderIds: Array<OrderType['_id']>, status: OrderType['status']) => {
		updateOrders(orderIds, status).catch(console.error)
	}, [updateOrders])

	useEffect(() => {
		fetchData().catch(console.error)
	}, [fetchData])

	useEffect(() => {
		setRoomOrders(groupOrdersByRoom())
	}, [setRoomOrders, groupOrdersByRoom])

	useEffect(() => {
		setOrdersWithNames(addNamesToOrders())
	}, [setOrdersWithNames, addNamesToOrders])

	useInterval(getOrders, 1000 * 10) // Fetch orders 10 seconds
	useInterval(getProducts, 1000 * 60 * 60) // Fetch products every hour
	useInterval(getOptions, 1000 * 60 * 60) // Fetch options every hour
	useInterval(getRooms, 1000 * 60 * 60) // Fetch rooms every hour

	return (
		<div>
			{fetching && <p className='flex justify-center p-10 font-bold text-gray-900 text-2xl'>Henter Order...</p>}
			{orders.length === 0 && !fetching && <p className='flex justify-center p-10 font-bold text-gray-900 text-2xl'>Ingen Ordrer 😊</p>}
			<div className="flex flex-row flex-wrap justify-evenly">
				{rooms.filter(room => roomOrders[room.name] !== undefined && roomOrders[room.name].length > 0).map((room) => (
					<RoomCol
						key={room._id}
						room={room}
						orders={roomOrders[room.name] ?? []}
						onOrderUpdate={handleOrderUpdate}
					/>
				))}
			</div>
		</div>
	)
}

export default OverviewView
