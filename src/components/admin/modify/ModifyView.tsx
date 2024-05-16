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
import AddProduct from '@/components/admin/modify/AddProduct'
import AddOption from '@/components/admin/modify/AddOption'
import AddRoom from '@/components/admin/modify/AddRoom'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'

const ModifyView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const views = ['Produkter', 'Tilvalg', 'Rum']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)

	const fetchProductsOptionsRooms = useCallback(async () => {
		const optionsResponse = await axios.get(API_URL + '/v1/options')
		const options = optionsResponse.data as OptionType[]
		setOptions(options)
		const productsResponse = await axios.get(API_URL + '/v1/products')
		const products = productsResponse.data as ProductType[]
		products.forEach((product) => {
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
		})
		setProducts(products)
		const roomsResponse = await axios.get(API_URL + '/v1/rooms')
		const rooms = roomsResponse.data as RoomType[]
		setRooms(rooms)
	}, [API_URL, setProducts, setOptions, setRooms])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === undefined) return
		fetchProductsOptionsRooms().catch((error) => {
			console.error('Error fetching products, options and rooms:', error)
		})
	}, [API_URL, fetchProductsOptionsRooms])

	useInterval(fetchProductsOptionsRooms, 1000 * 60 * 60) // Fetch products, options and rooms every hour

	return (
		<div>
			<ViewSelectionBar
				subBar={true}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">Vælg en kategori</p>}
			{selectedView === 'Produkter' &&
				<ItemList
					buttonText="Nyt Produkt"
					onAdd={() => {
						setShowAddProduct(true)
					}}
				>
					{products.map((product) => (
						<div className="min-w-64" key={product._id}>
							<Product
								options={options}
								product={product}
								onProductPatched={(product) => {
									setProducts((products) => products.map((p) => p._id === product._id ? product : p))
								}}
								onProductDeleted={(id) => {
									setProducts((products) => products.filter((p) => p._id !== id))
								}}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Tilvalg' &&
				<ItemList
					buttonText="Nyt Tilvalg"
					onAdd={() => {
						setShowAddOption(true)
					}}
				>
					{options.map((option) => (
						<div className="min-w-64 h-full" key={option._id}>
							<Option
								option={option}
								onOptionPatched={(option) => {
									setOptions((options) => options.map((o) => o._id === option._id ? option : o))
								}}
								onOptionDeleted={(id) => {
									setOptions((options) => options.filter((o) => o._id !== id))
									setProducts((products) =>
										products.map((product) => ({
											...product,
											options: product.options.filter((option) => option._id !== id)
										}))
									)
								}}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Rum' &&
				<ItemList
					buttonText="Nyt Rum"
					onAdd={() => {
						setShowAddRoom(true)
					}}
				>
					{rooms.map((room) => (
						<div className="min-w-64" key={room._id}>
							<Room
								room={room}
								onRoomPatched={(room) => {
									setRooms((rooms) => rooms.map((r) => r._id === room._id ? room : r))
								}}
								onRoomDeleted={(id) => {
									setRooms((rooms) => rooms.filter((r) => r._id !== id))
								}}
							/>
						</div>
					))}
				</ItemList>
			}
			{showAddProduct &&
				<AddProduct
					options={options}
					onProductPosted={function (product: ProductType): void {
						setProducts((products) => [...products, product])
					}}
					onClose={function (): void {
						setShowAddProduct(false)
					}}
				/>
			}
			{showAddOption &&
				<AddOption
					onOptionPosted={function (option: OptionType): void {
						setOptions((options) => [...options, option])
					}}
					onClose={function (): void {
						setShowAddOption(false)
					}}
				/>
			}
			{showAddRoom &&
				<AddRoom
					onRoomPosted={function (room: RoomType): void {
						setRooms((rooms) => [...rooms, room])
					}}
					onClose={function (): void {
						setShowAddRoom(false)
					}}
				/>
			}
		</div>
	)
}

export default ModifyView
