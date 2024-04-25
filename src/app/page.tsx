'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Products from '@/components/order/Products'
import SubmitButton from '@/components/order/SubmitButton'

const Page: React.FC = () => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState([])
	const [quantities, setQuantities] = useState<Record<string, number>>({})

	useEffect(() => {
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
			} catch (error) {
				console.error(error)
			}
		}

		fetchProducts()
	}, [])

	const handleQuantityChange = (key: string, newQuantity: number) => {
		setQuantities((prevQuantities) => ({
			...prevQuantities,
			[key]: newQuantity,
		}))
	}

	const submitOrder = async () => {
		try {
			// 15 minutes from now as UTC data
			const now = new Date();
			const requestedDeliveryDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() + 15));

			const rooms = await axios.get(API_URL + '/v1/rooms')
			const roomId = rooms.data[0]._id

			const productsArray = Object.entries(quantities).map(
				([product, quantity]) => ({ productId: product, quantity })
			)

			const data = {
				requestedDeliveryDate,
				products: productsArray,
				roomId,
			}

			console.log(data)

			const response = await axios.post(API_URL + '/v1/orders', data)

			console.log(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	return (
		<div className="bg-white">
			<Products
				products={products}
				quantities={quantities}
				onQuantityChange={handleQuantityChange}
			/>
			<SubmitButton onClick={submitOrder} />
		</div>
	)
}

export default Page
