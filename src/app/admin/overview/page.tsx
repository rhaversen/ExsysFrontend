'use client'

import React, { useCallback, useEffect, useState, type ReactElement } from 'react'
import axios from 'axios'
import { type RoomType, type OptionType, type OrderType, type ProductType } from '@/lib/backendDataTypes'
import { useInterval } from 'react-use'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [orders, setOrders] = useState<OrderType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])

	const getOrders = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/orders')
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
		try {
			await getRooms()
			await getProducts()
			await getOptions()
			await getOrders()
		} catch (error) {
			console.error(error)
		}
	}, [getOrders, getProducts, getOptions, getRooms])

	const updateOrders = useCallback(async (orderIds: OrderType['_id'], status: OrderType['status']) => {
		const response = await axios.patch(API_URL + '/v1/orders', { orderIds, status })
		const data = response.data as OrderType[]
		// Only update the orders that were changed
		setOrders((prevOrders) => {
			const newOrders = [...prevOrders]
			data.forEach((newOrder) => {
				const index = newOrders.findIndex((order) => order._id === newOrder._id)
				newOrders[index] = newOrder
			})
			return newOrders
		})
	}, [API_URL, setOrders])

	useEffect(() => {
		fetchData().catch(console.error)
	}, [fetchData])

	useInterval(getOrders, 1000 * 60) // Fetch orders every minute
	useInterval(getProducts, 1000 * 60 * 60) // Fetch products every hour
	useInterval(getOptions, 1000 * 60 * 60) // Fetch options every hour
	useInterval(getRooms, 1000 * 60 * 60) // Fetch rooms every hour

	return (
		<main>
		</main>
	)
}
