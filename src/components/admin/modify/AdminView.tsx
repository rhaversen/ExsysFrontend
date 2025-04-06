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

type ViewType = 'Aktiviteter' | 'Spisesteder' | 'Kiosker' | 'Kortlæsere' | 'Admins' | 'Konfiguration' | 'Produkter' | 'Tilvalg'

const AdminView = ({
	views,
	activities,
	rooms,
	kiosks,
	readers,
	admins,
	products,
	options
}: {
	views: ViewType[]
	activities: ActivityType[]
	rooms: RoomType[]
	kiosks: KioskType[]
	readers: ReaderType[]
	admins: AdminType[]
	products: ProductType[]
	options: OptionType[]
}): ReactElement => {
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
					<div className="space-y-1">{sortByField(rooms).map((room) => <Room key={room._id} rooms={rooms} room={room} activities={activities} />)}</div>
				)
			case 'Aktiviteter':
				return (
					<div className="space-y-1">{sortByField(activities).map((activity) => <Activity key={activity._id} products={products} activity={activity} kiosks={kiosks} rooms={rooms} activities={activities} />)}</div>
				)
			case 'Kiosker':
				return (
					<div className="space-y-1">{sortByField(kiosks).map((kiosk) => <Kiosk key={kiosk._id} kiosks={kiosks} kiosk={kiosk} activities={activities} readers={readers} />)}</div>
				)
			case 'Admins':
				return (
					<div className="space-y-1">{sortByField(admins).map((admin) => <Admin key={admin._id} admins={admins} admin={admin} />)}</div>
				)
			case 'Kortlæsere':
				return (
					<div className="space-y-1">{sortByField(readers).map((reader) => <Reader key={reader._id} kiosks={kiosks} readers={readers} reader={reader} />)}</div>
				)
			case 'Produkter':
				return (
					<div className="space-y-1">{sortByField(products).map((product: ProductType) => <Product key={product._id} product={product} products={products} options={options} />)}</div>
				)
			case 'Tilvalg':
				return (
					<div className="space-y-1">{sortByField(options).map((option) => <Option key={option._id} products={products} option={option} options={options} />)}</div>
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
			<div className="w-full px-4 py-2">
				{selectedView !== null && selectedView !== 'Konfiguration' && (
					<div className="mb-4 space-y-4">
						<div className="flex flex-wrap justify-between items-center gap-2">
							<button
								type="button"
								title="Tilføj"
								className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg shadow-md"
								onClick={handleAdd}
							>
								<Image className="h-4 w-4" src={AdminImages.add.src} alt={AdminImages.add.alt} width={16} height={16} />
								<span className="ml-2">{`Tilføj ${selectedView}`}</span>
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
