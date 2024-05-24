'use client'

import AddOption from '@/components/admin/modify/AddOption'
import AddProduct from '@/components/admin/modify/AddProduct'
import AddRoom from '@/components/admin/modify/AddRoom'
import ItemList from '@/components/admin/modify/ItemList'
import Option from '@/components/admin/modify/Option'
import Product from '@/components/admin/modify/Product'
import Room from '@/components/admin/modify/Room'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import { type OptionType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'

const ModifyView = ({
	products,
	options,
	rooms,
	onUpdatedProduct,
	onDeletedProduct,
	onAddedProduct,
	onUpdatedOption,
	onDeletedOption,
	onAddedOption,
	onUpdatedRoom,
	onDeletedRoom,
	onAddedRoom
}: {
	products: ProductType[]
	options: OptionType[]
	rooms: RoomType[]
	onUpdatedProduct: (product: ProductType) => void
	onDeletedProduct: (id: string) => void
	onAddedProduct: (product: ProductType) => void
	onUpdatedOption: (option: OptionType) => void
	onDeletedOption: (id: string) => void
	onAddedOption: (option: OptionType) => void
	onUpdatedRoom: (room: RoomType) => void
	onDeletedRoom: (id: string) => void
	onAddedRoom: (room: RoomType) => void
}): ReactElement => {
	const views = ['Produkter', 'Tilvalg', 'Rum']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)

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
						<div
							className="min-w-64"
							key={product._id}
						>
							<Product
								options={options}
								product={product}
								onProductPatched={onUpdatedProduct}
								onProductDeleted={onDeletedProduct}
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
						<div
							className="min-w-64 h-full"
							key={option._id}
						>
							<Option
								option={option}
								onOptionPatched={onUpdatedOption}
								onOptionDeleted={onDeletedOption}
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
						<div
							className="min-w-64"
							key={room._id}
						>
							<Room
								room={room}
								onRoomPatched={onUpdatedRoom}
								onRoomDeleted={onDeletedRoom}
							/>
						</div>
					))}
				</ItemList>
			}
			{showAddProduct &&
				<AddProduct
					options={options}
					onProductPosted={onAddedProduct}
					onClose={() => {
						setShowAddProduct(false)
					}}
				/>
			}
			{showAddOption &&
				<AddOption
					onOptionPosted={onAddedOption}
					onClose={() => {
						setShowAddOption(false)
					}}
				/>
			}
			{showAddRoom &&
				<AddRoom
					onRoomPosted={onAddedRoom}
					onClose={() => {
						setShowAddRoom(false)
					}}
				/>
			}
		</div>
	)
}

export default ModifyView
