'use client'

import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useState } from 'react'

import DeliveryTimeSelector from '@/components/order/DeliveryTimeSelector'
import Products from '@/components/order/Products'
import RoomSelector from '@/components/order/RoomSelector'
import SubmitButton from '@/components/ui/SubmitButton'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertUTCOrderWindowToLocal, isCurrentTimeInLocalOrderWindow } from '@/lib/timeUtils'
import { type OptionType, type ProductType, type RoomType } from '@/types/backendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [products, setProducts] = useState<ProductType[]>([])
	const [quantities, setQuantities] = useState<Record<ProductType['_id'] | OptionType['_id'], number>>({})
	const [availabilities, setAvailabilities] = useState<Record<ProductType['_id'], boolean>>({})
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [selectedRoomId, setSelectedRoomId] = useState<RoomType['_id']>('')
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [formIsValid, setFormIsValid] = useState(false)

	const fetchProducts = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/products', { withCredentials: true })
		const products = response.data as ProductType[]
		setProducts(products)
		const quantities = products.reduce(
			(acc: Record<ProductType['_id'], number>, product) => ({
				...acc,
				[product._id]: 0
			}),
			{}
		)
		setQuantities(quantities)
	}, [API_URL, setProducts, setQuantities])

	const updateAvailabilities = useCallback(() => {
		const availabilities = products.reduce(
			(acc: Record<ProductType['_id'], boolean>, product) => ({
				...acc,
				[product._id]: isCurrentTimeInLocalOrderWindow(convertUTCOrderWindowToLocal(
					product.orderWindow
				))
			}),
			{}
		)
		setAvailabilities(availabilities)
	}, [products, setAvailabilities])

	const fetchRooms = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/rooms', { withCredentials: true })
		const rooms = response.data as RoomType[]
		setRooms(rooms)
	}, [API_URL, setRooms])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null) return
		fetchRooms().catch((error) => {
			addError(error)
		})
		fetchProducts().catch((error) => {
			addError(error)
		})
	}, [API_URL, fetchRooms, fetchProducts, addError])

	useEffect(() => {
		updateAvailabilities()
	}, [products, updateAvailabilities])

	useEffect(() => {
		const productSelected = Object.values(quantities).some((quantity) => quantity > 0)
		const roomSelected = selectedRoomId !== ''
		const dateSelected = selectedDate !== null
		setFormIsValid(productSelected && roomSelected && dateSelected)
	}, [quantities, selectedRoomId, selectedDate])

	const handleDateSelect = useCallback((date: Date): void => {
		setSelectedDate(date)
	}, [setSelectedDate])

	const handleQuantityChange = useCallback((key: ProductType['_id'] | OptionType['_id'], newQuantity: number): void => {
		setQuantities((prevQuantities) => ({
			...prevQuantities,
			[key]: newQuantity
		}))
	}, [setQuantities])

	const handleRoomSelect = useCallback((roomId: RoomType['_id']): void => {
		setSelectedRoomId(roomId)
	}, [setSelectedRoomId])

	const submitOrder = useCallback((): void => {
		const productsArray = Object.entries(quantities).map(
			([product, quantity]) => ({
				id: product,
				quantity
			})
		)

		const data = {
			requestedDeliveryDate: selectedDate.toISOString(),
			products: productsArray,
			roomId: selectedRoomId
		}

		axios.post(API_URL + '/v1/orders', data, { withCredentials: true }).catch((error) => {
			addError(error)
		})
	}, [quantities, selectedDate, selectedRoomId, API_URL, addError])

	return (
		<main className="bg-white flex flex-col h-screen overflow-hidden mx-auto shadow-lg max-w-screen-lg">
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
					text="Bestil"
					onClick={submitOrder}
					disabled={!formIsValid}
				/>
			</div>
		</main>
	)
}
