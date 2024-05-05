'use client'

import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'
import { type CartType, type OptionType, type ProductType } from '@/lib/backendDataTypes'
import { useInterval } from 'react-use'

export default function Page ({ params }: Readonly<{ params: { room: string } }>): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [formIsValid, setFormIsValid] = useState(false)
	const [price, setPrice] = useState(0)

	const fetchProductsAndOptions = useCallback(async () => {
		console.log('Fetching products and options')
		try {
			const response = await axios.get(API_URL + '/v1/products')
			const products = response.data as ProductType[]
			products.forEach((product) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(products)
		} catch (error) {
			console.error(error)
		}
		try {
			const response = await axios.get(API_URL + '/v1/options')
			const options = response.data as OptionType[]
			setOptions(options)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL, setProducts, setOptions])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === undefined) return
		fetchProductsAndOptions()
	}, [API_URL, fetchProductsAndOptions])

	// Check if any product is selected
	useEffect(() => {
		const productSelected = Object.values(cart.products).some((quantity) => quantity > 0)
		setFormIsValid(productSelected)
	}, [cart])

	// Calculate total price
	useEffect(() => {
		const price = (
			Object.entries(cart.products).reduce((acc, [_id, quantity]) => acc + (products.find(product => product._id === _id)?.price ?? 0) * quantity, 0) +
			Object.entries(cart.options).reduce((acc, [_id, quantity]) => acc + (options.find(option => option._id === _id)?.price ?? 0) * quantity, 0)
		)
		setPrice(price)
	}, [cart])

	useInterval(fetchProductsAndOptions, 1000 * 60 * 60) // Fetch products and options every hour

	const handleCartChange = (_id: string, type: 'products' | 'options', change: number): void => {
		// Copy the cart object
		const newCart = { ...cart }
		// If the item is not in the cart, add it with a quantity of 0
		if (newCart[type][_id] === undefined) newCart[type][_id] = 0
		// Change the quantity of the item
		newCart[type][_id] += change
		// If the quantity is 0 or less, remove the item from the cart
		if (newCart[type][_id] <= 0) {
			newCart[type] = Object.entries(newCart[type]).reduce<CartType[typeof type]>((acc, [key, value]) => {
				// If the item is not the one to remove, add it to the accumulator
				if (key !== _id) acc[key] = value
				return acc
			}, {})
		}
		setCart(newCart)
	}

	const submitOrder = async (): Promise<void> => {
		try {
			const productCart = Object.entries(cart.products).map(
				([item, quantity]) => ({
					id: item,
					quantity
				})
			)

			const optionCart = Object.entries(cart.options).map(
				([item, quantity]) => ({
					id: item,
					quantity
				})
			)

			const data = {
				roomId: params.room,
				products: productCart,
				options: optionCart
			}

			console.log(data)

			await axios.post(API_URL + '/v1/orders', data)
		} catch (error) {
			console.error(error)
		}
	}

	return (
		<main className="flex h-screen">
			<div className="flex-1 overflow-y-auto">
				<SelectionWindow
					products={products}
					options={options}
					handleCartChange={handleCartChange}
				/>
			</div>
			<div className="w-[400px] h-screen overflow-y-auto">
				<CartWindow
					products={products}
					options={options}
					cart={cart}
					onCartChange={handleCartChange}
					onSubmit={submitOrder}
					formIsValid={formIsValid}
				/>
			</div>
		</main>
	)
}
