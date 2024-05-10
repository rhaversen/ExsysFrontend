'use client'

import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import { type OptionType, type ProductType, type RoomType } from '@/lib/backendDataTypes'
import { useInterval } from 'react-use'
import ItemList from '@/components/admin/modify/ItemList'
import Product from '@/components/admin/modify/Product'
import Option from '@/components/admin/modify/Option'
import Room from '@/components/admin/modify/Room'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])

	const fetchProductsOptionsRooms = useCallback(async () => {
		const productsResponse = await axios.get(API_URL + '/v1/products')
		const products = productsResponse.data as ProductType[]
		products.forEach((product) => {
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
		})
		setProducts(products)
		const optionsResponse = await axios.get(API_URL + '/v1/options')
		const options = optionsResponse.data as OptionType[]
		setOptions(options)
		const roomsResponse = await axios.get(API_URL + '/v1/rooms')
		const rooms = roomsResponse.data as RoomType[]
		setRooms(rooms)
	}, [API_URL, setProducts, setOptions])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === undefined) return
		fetchProductsOptionsRooms().catch((error) => {
			console.error('Error fetching products, options and rooms:', error)
		})
	}, [API_URL, fetchProductsOptionsRooms])

	useInterval(fetchProductsOptionsRooms, 1000 * 60 * 60) // Fetch products and options every hour

	return (
		<main className="fixed">
			<div className="flex flex-col h-screen justify-between p-5">
				<ItemList
					header="Produkter"
					buttonText="Nyt Produkt"
					onAdd={() => {
						console.log('Add product')
					}}
				>
					{products.map((product) => (
						<div className="min-w-64"
							key={product._id}>
							<Product
								product={product}
								onProductPatched={(product) => {
									console.log('Product patched:', product)
								}}
								onProductDeleted={(id) => {
									console.log('Product deleted:', id)
								}}
							/>
						</div>
					))}
				</ItemList>
				<ItemList
					header="Tilvalg"
					buttonText="Nyt Tilvalg"
					onAdd={() => {
						console.log('Add option')
					}}
				>
					{options.map((option) => (
						<div className="min-w-64 h-full"
							key={option._id}>
							<Option
								option={option}
								onOptionPatched={(option) => {
									console.log('Option patched:', option)
								}}
								onOptionDeleted={(id) => {
									console.log('Option deleted:', id)
								}}
							/>
						</div>
					))}
				</ItemList>
				<ItemList
					header="Rum"
					buttonText="Nyt Rum"
					onAdd={() => {
						console.log('Add room')
					}}
				>
					{rooms.map((room) => (
						<div className="min-w-64"
							key={room._id}>
							<Room
								room={room}
								onRoomPatched={(room) => {
									console.log('Room patched:', room)
								}}
								onRoomDeleted={(id) => {
									console.log('Room deleted:', id)
								}}
							/>
						</div>
					))}
				</ItemList>
			</div>
		</main>
	)
}
