'use client'

import Activity from '@/components/admin/modify/setup/activity/Activity'
import AddActivity from '@/components/admin/modify/setup/activity/AddActivity'
import AddAdmin from '@/components/admin/modify/setup/admin/AddAdmin'
import Admin from '@/components/admin/modify/setup/admin/Admin'
import ConfigsView from '@/components/admin/modify/setup/config/ConfigsView'
import AddKiosk from '@/components/admin/modify/setup/kiosk/AddKiosk'
import Kiosk from '@/components/admin/modify/setup/kiosk/Kiosk'
import AddReader from '@/components/admin/modify/setup/reader/AddReader'
import Reader from '@/components/admin/modify/setup/reader/Reader'
import AddRoom from '@/components/admin/modify/setup/room/AddRoom'
import Room from '@/components/admin/modify/setup/room/Room'
import AddOption from '@/components/admin/modify/catalog/option/AddOption'
import Option from '@/components/admin/modify/catalog/option/Option'
import AddProduct from '@/components/admin/modify/catalog/product/AddProduct'
import Product from '@/components/admin/modify/catalog/product/Product'
import SortingControl from '@/components/admin/modify/ui/SortingControl'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import ResourceInfo from '@/components/admin/modify/ui/ResourceInfo'
import useSorting from '@/hooks/useSorting'
import type sortConfig from '@/lib/SortConfig'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'
import {
	type ProductType,
	type ActivityType,
	type AdminType,
	type KioskType,
	type ReaderType,
	type RoomType,
	type OptionType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'

export type ViewType = 'Aktiviteter' | 'Spisesteder' | 'Kiosker' | 'Kortlæsere' | 'Admins' | 'Konfiguration' | 'Produkter' | 'Tilvalg'

interface AdminViewProps {
	views: ViewType[]
	activities?: ActivityType[]
	rooms?: RoomType[]
	kiosks?: KioskType[]
	readers?: ReaderType[]
	admins?: AdminType[]
	products?: ProductType[]
	options?: OptionType[]
}

const AdminView = ({
	views,
	activities = [],
	rooms = [],
	kiosks = [],
	readers = [],
	admins = [],
	products = [],
	options = []
}: AdminViewProps): ReactElement => {
	const [selectedView, setSelectedView] = useState<ViewType | null>(null)
	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddActivity, setShowAddActivity] = useState(false)
	const [showAddKiosk, setShowAddKiosk] = useState(false)
	const [showAddAdmin, setShowAddAdmin] = useState(false)
	const [showAddReader, setShowAddReader] = useState(false)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)

	const {
		setSortField,
		setSortDirection,
		sortByField,
		sortField,
		sortDirection,
		sortingOptions,
		isEnabled
	} = useSorting(selectedView as keyof typeof sortConfig)

	const handleAdd = (): void => {
		switch (selectedView) {
			case 'Spisesteder':
				setShowAddRoom(true)
				break
			case 'Aktiviteter':
				setShowAddActivity(true)
				break
			case 'Kiosker':
				setShowAddKiosk(true)
				break
			case 'Admins':
				setShowAddAdmin(true)
				break
			case 'Kortlæsere':
				setShowAddReader(true)
				break
			case 'Produkter':
				setShowAddProduct(true)
				break
			case 'Tilvalg':
				setShowAddOption(true)
				break
		}
	}

	const renderContent = (): ReactElement => {
		switch (selectedView) {
			case 'Spisesteder':
				return (
					<div className="flex flex-wrap justify-start gap-2">
						{sortByField(rooms).map((room) => (
							<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-1" key={room._id}>
								<Room rooms={rooms} room={room} activities={activities} />
							</div>
						))}
					</div>
				)
			case 'Aktiviteter':
				return (
					<div className="flex flex-wrap justify-start gap-2">
						{sortByField(activities).map((activity) => (
							<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-1" key={activity._id}>
								<Activity products={products} activity={activity} kiosks={kiosks} rooms={rooms} activities={activities} />
							</div>
						))}
					</div>
				)
			case 'Kiosker':
				return (
					<div className="flex flex-wrap justify-start gap-2">
						{sortByField(kiosks).map((kiosk) => (
							<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-1" key={kiosk._id}>
								<Kiosk kiosks={kiosks} kiosk={kiosk} activities={activities} readers={readers} />
							</div>
						))}
					</div>
				)
			case 'Admins':
				return (
					<div className="flex flex-wrap justify-start gap-2">
						{sortByField(admins).map((admin) => (
							<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-1" key={admin._id}>
								<Admin admins={admins} admin={admin} />
							</div>
						))}
					</div>
				)
			case 'Kortlæsere':
				return (
					<div className="flex flex-wrap justify-start gap-2">
						{sortByField(readers).map((reader) => (
							<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-1" key={reader._id}>
								<Reader kiosks={kiosks} readers={readers} reader={reader} />
							</div>
						))}
					</div>
				)
			case 'Produkter':
				return (
					<div className="w-full">
						<div className="space-y-1">
							{sortByField(products).map((product: ProductType) => (
								<Product key={product._id} product={product} products={products} options={options} />
							))}
						</div>
					</div>
				)
			case 'Tilvalg':
				return (
					<div className="flex flex-wrap justify-start gap-2">
						{sortByField(options).map((option) => (
							<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-1" key={option._id}>
								<Option products={products} option={option} options={options} />
							</div>
						))}
					</div>
				)
			case 'Konfiguration':
				return <ConfigsView />
			default:
				return <p className="flex justify-center p-4 font-bold text-gray-800 text-xl">{'Vælg en kategori'}</p>
		}
	}

	return (
		<div className="w-full">
			<ViewSelectionBar
				subLevel={1}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			<div className="flex flex-col p-2 w-full">
				{selectedView !== null && selectedView !== 'Konfiguration' && (
					<div className="flex flex-col mb-2 gap-2">
						<div className="flex flex-wrap justify-between items-center gap-2">
							<button
								type="button"
								title="Tilføj"
								className="flex bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded items-center justify-center text-sm"
								onClick={handleAdd}
							>
								<Image
									className="h-5 w-5"
									src={AdminImages.add.src}
									alt={AdminImages.add.alt}
									width={10}
									height={10}
								/>
								<span className="p-1 mx-2 font-medium">{`Tilføj ${selectedView}`}</span>
							</button>
							{isEnabled && (
								<SortingControl
									options={sortingOptions}
									currentField={sortField}
									currentDirection={sortDirection}
									onSortFieldChange={setSortField}
									onSortDirectionChange={setSortDirection}
								/>
							)}
						</div>
						<ResourceInfo viewName={selectedView} />
					</div>
				)}
				{renderContent()}
			</div>
			{showAddRoom && <AddRoom rooms={rooms} activities={activities} onClose={() => { setShowAddRoom(false) }} />}
			{showAddActivity && <AddActivity products={products} rooms={rooms} kiosks={kiosks} activities={activities} onClose={() => { setShowAddActivity(false) }} />}
			{showAddKiosk && <AddKiosk kiosks={kiosks} activities={activities} readers={readers} onClose={() => { setShowAddKiosk(false) }} />}
			{showAddAdmin && <AddAdmin admins={admins} onClose={() => { setShowAddAdmin(false) }} />}
			{showAddReader && <AddReader kiosks={kiosks} readers={readers} onClose={() => { setShowAddReader(false) }} />}
			{showAddProduct && <AddProduct options={options} products={products} onClose={() => { setShowAddProduct(false) }} />}
			{showAddOption && <AddOption products={products} options={options} onClose={() => { setShowAddOption(false) }} />}
		</div>
	)
}

export default AdminView
