'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Products from '@/components/order/Products'
import SubmitButton from '@/components/order/SubmitButton'
import { OrderWindow, isCurrentTimeInUTCOrderWindow } from '@/lib/timeUtils'
import RoomSelector from '@/components/order/RoomSelector'
import DeliveryTimeSelector from '@/components/order/DeliveryTimeSelector'

export default function Page() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState([])
	const [quantities, setQuantities] = useState<Record<string, number>>({})
	const [availabilities, setAvailabilities] = useState<Record<string, boolean>>({})
	const [rooms, setRooms] = useState<{ _id: string; name: string; description: string }[]>([]) // Ensure rooms is an array of objects
	const [selectedRoomId, setSelectedRoomId] = useState<string>('')
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [formIsValid, setFormIsValid] = useState(false)

	useEffect(() => {
		if (API_URL === undefined || API_URL === null) return

		const fetchProducts = async () => {
			try {
				const response = await axios.get(API_URL + '/v1/products')
				setProducts(response.data)
				setQuantities(
					response.data.reduce(
						(acc: any, product: { _id: string }) => ({
							...acc,
							[product._id]: 0,
						}),
						{}
					)
				)
				setAvailabilities(
					response.data.reduce(
						(
							acc: any,
							product: { _id: string; orderWindow: OrderWindow }
						) => ({
							...acc,
							[product._id]: isCurrentTimeInUTCOrderWindow(
								product.orderWindow
							),
						}),
						{}
					)
				)
			} catch (error) {
				console.error(error)
			}
		}

		const fetchRooms = async () => {
			try {
				const response = await axios.get<{ _id: string; name: string; description: string; }[]>(API_URL + '/v1/rooms')
				setRooms(response.data)
			} catch (error) {
				console.error('Failed to fetch rooms:', error)
			}
		}

		fetchRooms()
		fetchProducts()
	}, [API_URL])

	useEffect(() => {
		const productSelected = Object.values(quantities).some((quantity) => quantity > 0)
		const roomSelected = selectedRoomId !== ''
		const dateSelected = selectedDate !== null
		setFormIsValid(productSelected && roomSelected && dateSelected)
	}, [quantities, selectedRoomId, selectedDate])

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date)
	}

	const handleQuantityChange = (key: string, newQuantity: number) => {
		setQuantities((prevQuantities) => ({
			...prevQuantities,
			[key]: newQuantity,
		}))
	}

	const handleRoomSelect = (roomId: string) => {
		setSelectedRoomId(roomId)
	}

	const submitOrder = async () => {
		try {
			const productsArray = Object.entries(quantities).map(
				([product, quantity]) => ({ productId: product, quantity })
			)

			const data = {
				requestedDeliveryDate: selectedDate.toISOString(),
				products: productsArray,
				roomId: selectedRoomId
			}

			console.log(data)

			await axios.post(API_URL + '/v1/orders', data)

		} catch (error) {
			console.error(error)
		}
	}

	return (
		<div className="bg-white flex flex-col h-screen overflow-hidden mx-auto shadow-lg max-w-screen-lg">
			<div className="overflow-auto">
				<Products
					products={products}
					quantities={quantities}
					availabilities={availabilities}
					onQuantityChange={handleQuantityChange}
				/>
			</div>
			<div className="mt-auto">
				<div className="flex justify-center mt-4">
					<RoomSelector
						rooms={rooms}
						onRoomSelect={handleRoomSelect}
					/>
					<DeliveryTimeSelector
						selectedDate={selectedDate}
						onDateSelect={handleDateSelect}
					/>
				</div>
				<SubmitButton
					onClick={submitOrder}
					disabled={!formIsValid}
				/>
			</div>
		</div>
	)
}