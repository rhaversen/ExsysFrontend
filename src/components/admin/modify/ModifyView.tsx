'use client'

import AddOption from '@/components/admin/modify/AddOption'
import AddProduct from '@/components/admin/modify/AddProduct'
import AddRoom from '@/components/admin/modify/AddRoom'
import AddActivity from '@/components/admin/modify/AddActivity'
import AddKiosk from '@/components/admin/modify/AddKiosk'
import AddAdmin from '@/components/admin/modify/AddAdmin'
import ItemList from '@/components/admin/modify/ItemList'
import Option from '@/components/admin/modify/Option'
import Product from '@/components/admin/modify/Product'
import Room from '@/components/admin/modify/Room'
import Activity from '@/components/admin/modify/Activity'
import Kiosk from '@/components/admin/modify/Kiosk'
import Admin from '@/components/admin/modify/Admin'
import Reader from '@/components/admin/modify/Reader'
import AddReader from '@/components/admin/modify/AddReader'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import { type ActivityType, type AdminType, type KioskType, type OptionType, type ProductType, type RoomType, type ReaderType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'

const ModifyView = ({
	products,
	options,
	rooms,
	activities,
	kiosks,
	admins,
	readers,
	onUpdatedProduct,
	onDeletedProduct,
	onAddedProduct,
	onUpdatedOption,
	onDeletedOption,
	onAddedOption,
	onUpdatedRoom,
	onDeletedRoom,
	onAddedRoom,
	onAddedActivity,
	onUpdatedActivity,
	onDeletedActivity,
	onAddedKiosk,
	onUpdatedKiosk,
	onDeletedKiosk,
	onAddedAdmin,
	onUpdatedAdmin,
	onDeletedAdmin,
	onAddedReader,
	onUpdatedReader,
	onDeletedReader
}: {
	products: ProductType[]
	options: OptionType[]
	rooms: RoomType[]
	activities: ActivityType[]
	kiosks: KioskType[]
	admins: AdminType[]
	readers: ReaderType[]
	onUpdatedProduct: (product: ProductType) => void
	onDeletedProduct: (id: string) => void
	onAddedProduct: (product: ProductType) => void
	onUpdatedOption: (option: OptionType) => void
	onDeletedOption: (id: string) => void
	onAddedOption: (option: OptionType) => void
	onUpdatedRoom: (room: RoomType) => void
	onDeletedRoom: (id: string) => void
	onAddedRoom: (room: RoomType) => void
	onAddedActivity: (activity: ActivityType) => void
	onUpdatedActivity: (activity: ActivityType) => void
	onDeletedActivity: (id: string) => void
	onAddedKiosk: (kiosk: KioskType) => void
	onUpdatedKiosk: (kiosk: KioskType) => void
	onDeletedKiosk: (id: string) => void
	onAddedAdmin: (admin: AdminType) => void
	onUpdatedAdmin: (admin: AdminType) => void
	onDeletedAdmin: (id: string) => void
	onAddedReader: (reader: ReaderType) => void
	onUpdatedReader: (reader: ReaderType) => void
	onDeletedReader: (id: string) => void
}): ReactElement => {
	const views = ['Produkter', 'Tilvalg', 'Aktiviteter', 'Rum', 'Kiosker', 'Kortlæsere', 'Admins']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)
	const [showAddActivity, setShowAddActivity] = useState(false)
	const [showAddKiosk, setShowAddKiosk] = useState(false)
	const [showAddAdmin, setShowAddAdmin] = useState(false)
	const [showAddReader, setShowAddReader] = useState(false)

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
			{selectedView === 'Aktiviteter' &&
				<ItemList
					buttonText="Ny Aktivitet"
					onAdd={() => {
						setShowAddActivity(true)
					}}
				>
					{activities.map((activity) => (
						<div
							className="min-w-64"
							key={activity._id}
						>
							<Activity
								activity={activity}
								rooms={rooms}
								onActivityPatched={onUpdatedActivity}
								onActivityDeleted={onDeletedActivity}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Kiosker' &&
				<ItemList
					buttonText="Ny Kiosk"
					onAdd={() => {
						setShowAddKiosk(true)
					}}
				>
					{kiosks.map((kiosk) => (
						<div
							className="min-w-64"
							key={kiosk._id}
						>
							<Kiosk
								kiosk={kiosk}
								activities={activities}
								readers={readers}
								onKioskPatched={onUpdatedKiosk}
								onKioskDeleted={onDeletedKiosk}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Admins' &&
				<ItemList
					buttonText="Ny Admin"
					onAdd={() => {
						setShowAddAdmin(true)
					}}
				>
					{admins.map((admin) => (
						<div
							className="min-w-64"
							key={admin._id}
						>
							<Admin
								admin={admin}
								onAdminPatched={onUpdatedAdmin}
								onAdminDeleted={onDeletedAdmin}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Kortlæsere' &&
				<ItemList
					buttonText="Ny Kortlæser"
					onAdd={() => {
						setShowAddReader(true)
					}}
				>
					{readers.map((reader) => (
						<div
							className="min-w-64"
							key={reader._id}
						>
							<Reader
								reader={reader}
								onReaderPatched={onUpdatedReader}
								onReaderDeleted={onDeletedReader}
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
			{showAddActivity &&
				<AddActivity
					rooms={rooms}
					onActivityPosted={onAddedActivity}
					onClose={() => {
						setShowAddActivity(false)
					}}
				/>
			}
			{showAddKiosk &&
				<AddKiosk
					activities={activities}
					readers={readers}
					onKioskPosted={onAddedKiosk}
					onClose={() => {
						setShowAddKiosk(false)
					}}
				/>
			}
			{showAddAdmin &&
				<AddAdmin
					onAdminPosted={onAddedAdmin}
					onClose={() => {
						setShowAddAdmin(false)
					}}
				/>
			}
			{showAddReader &&
				<AddReader
					onReaderPosted={onAddedReader}
					onClose={() => {
						setShowAddReader(false)
					}}
				/>
			}
		</div>
	)
}

export default ModifyView
