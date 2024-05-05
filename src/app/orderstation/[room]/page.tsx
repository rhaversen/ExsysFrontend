'use client'

import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { convertOrderWindowFromUTC, type OrderWindow } from '@/lib/timeUtils'
import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'

export interface CartType {
	products: Record<ProductType['_id'], number>
	options: Record<OptionType['_id'], number>
}

export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: string[]
	imageURL?: string
}

export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
}

export default function Page ({ params }: Readonly<{ params: { room: string } }>): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [formIsValid, setFormIsValid] = useState(false)

	const fetchProducts = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/products')
			response.data.forEach((product: { orderWindow: OrderWindow }) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(response.data)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL, setProducts])

	const fetchOptions = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/options')
			setOptions(response.data)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL, setOptions])

	useEffect(() => {
		if (API_URL === undefined) return
		fetchProducts()
		fetchOptions()
	}, [API_URL, fetchProducts, fetchOptions])

	useEffect(() => {
		const productSelected = Object.values(cart.products).some((quantity) => quantity > 0)
		setFormIsValid(productSelected)
	}, [cart])

	const handleCartChange = (_id: string, type: 'products' | 'options', change: number) => {
		const newCart = { ...cart }
		if (newCart[type][_id] === undefined) newCart[type][_id] = 0
		newCart[type][_id] += change
		if (newCart[type][_id] <= 0) delete newCart[type][_id]
		setCart(newCart)
	}

	const submitOrder = async () => {
		try {
			const productCart = Object.entries(cart.products).map(
				([item, quantity]) => ({ id: item, quantity })
			)

			const optionCart = Object.entries(cart.options).map(
				([item, quantity]) => ({ id: item, quantity })
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
