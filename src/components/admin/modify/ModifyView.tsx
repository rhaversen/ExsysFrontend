'use client'

import Activity from '@/components/admin/modify/Activity'
import AddActivity from '@/components/admin/modify/AddActivity'
import AddAdmin from '@/components/admin/modify/AddAdmin'
import AddKiosk from '@/components/admin/modify/AddKiosk'
import AddOption from '@/components/admin/modify/AddOption'
import AddProduct from '@/components/admin/modify/AddProduct'
import AddReader from '@/components/admin/modify/AddReader'
import AddRoom from '@/components/admin/modify/AddRoom'
import Admin from '@/components/admin/modify/Admin'
import ItemList from '@/components/admin/modify/ItemList'
import Kiosk from '@/components/admin/modify/Kiosk'
import Option from '@/components/admin/modify/Option'
import Product from '@/components/admin/modify/Product'
import Reader from '@/components/admin/modify/Reader'
import Room from '@/components/admin/modify/Room'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import {
	type ActivityType,
	type AdminType,
	type KioskType,
	type OptionType,
	type ProductType,
	type ReaderType,
	type RoomType
} from '@/types/backendDataTypes'
import { type sortConfig } from '@/types/frontendDataTypes'
import React, { type ReactElement, useState } from 'react'
import SortingControl from './SortingControl'

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
	const [sortField, setSortField] = useState('name')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	const sortByField = (items: any[]): any[] => {
		// Helper function to resolve nested properties
		const resolveProperty = (obj: any, path: string): any => {
			return path.split('.').reduce((acc, part) => (acc !== null && acc !== undefined) ? acc[part] : undefined, obj)
		}

		return items.slice().sort((a: any, b: any) => {
			const valA = resolveProperty(a, sortField)
			const valB = resolveProperty(b, sortField)

			// If both values are strings, compare them case-insensitively
			if (typeof valA === 'string' && typeof valB === 'string') {
				const strA = valA.toLowerCase()
				const strB = valB.toLowerCase()
				if (strA < strB) return sortDirection === 'asc' ? -1 : 1
				if (strA > strB) return sortDirection === 'asc' ? 1 : -1
				return 0
			}

			// Otherwise, perform a basic comparison (works for numbers and dates)
			return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
		})
	}

	return (
		<div>
			<ViewSelectionBar
				subBar={true}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView !== null &&
				<SortingControl
					onSortFieldChange={setSortField}
					onSortDirectionChange={(sortDirection: string) => { setSortDirection(sortDirection as 'asc' | 'desc') }}
					type={selectedView as keyof typeof sortConfig}
				/>
			}
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">Vælg en kategori</p>}
			{selectedView === 'Produkter' &&
				<ItemList
					buttonText="Nyt Produkt"
					onAdd={() => {
						setShowAddProduct(true)
					}}
				>
					{sortByField(products).map((product) => (
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
					{sortByField(options).map((option) => (
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
					{sortByField(rooms).map((room) => (
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
					{sortByField(activities).map((activity) => (
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
					{sortByField(kiosks).map((kiosk) => (
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
					{sortByField(admins).map((admin) => (
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
					{sortByField(readers).map((reader) => (
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
