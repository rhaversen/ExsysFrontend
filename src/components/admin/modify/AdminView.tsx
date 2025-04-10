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
import { FaPlus, FaMinus } from 'react-icons/fa'
import {
	type ProductType,
	type ActivityType,
	type AdminType,
	type KioskType,
	type ReaderType,
	type RoomType,
	type OptionType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState, useEffect } from 'react'

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
	const [showAddForm, setShowAddForm] = useState(false)

	const {
		setSortField,
		setSortDirection,
		sortByField,
		sortField,
		sortDirection,
		sortingOptions,
		isEnabled
	} = useSorting(selectedView as keyof typeof sortConfig)

	// Add useEffect to hide forms when view changes
	useEffect(() => {
		setShowAddForm(false)
	}, [selectedView])

	const toggleAdd = (): void => {
		setShowAddForm(!showAddForm)
	}

	const renderContent = (): ReactElement => {
		switch (selectedView) {
			case 'Spisesteder':
				return (
					<div className="space-y-1">
						{showAddForm && <AddRoom rooms={rooms} activities={activities} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(rooms).map((room) => <Room key={room._id} rooms={rooms} room={room} activities={activities} />)}
					</div>
				)
			case 'Aktiviteter':
				return (
					<div className="space-y-1">
						{showAddForm && <AddActivity products={products} rooms={rooms} kiosks={kiosks} activities={activities} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(activities).map((activity) => <Activity key={activity._id} products={products} activity={activity} kiosks={kiosks} rooms={rooms} activities={activities} />)}
					</div>
				)
			case 'Kiosker':
				return (
					<div className="space-y-1">
						{showAddForm && <AddKiosk kiosks={kiosks} activities={activities} readers={readers} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(kiosks).map((kiosk) => <Kiosk key={kiosk._id} kiosks={kiosks} kiosk={kiosk} activities={activities} readers={readers} />)}
					</div>
				)
			case 'Admins':
				return (
					<div className="space-y-1">
						{showAddForm && <AddAdmin admins={admins} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(admins).map((admin) => <Admin key={admin._id} admins={admins} admin={admin} />)}
					</div>
				)
			case 'Kortlæsere':
				return (
					<div className="space-y-1">
						{showAddForm && <AddReader kiosks={kiosks} readers={readers} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(readers).map((reader) => <Reader key={reader._id} kiosks={kiosks} readers={readers} reader={reader} />)}
					</div>
				)
			case 'Produkter':
				return (
					<div className="space-y-1">
						{showAddForm && <AddProduct products={products} options={options} activities={activities} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(products).map((product: ProductType) => <Product key={product._id} product={product} products={products} options={options} activities={activities} />)}
					</div>
				)
			case 'Tilvalg':
				return (
					<div className="space-y-1">
						{showAddForm && <AddOption products={products} options={options} onClose={() => { setShowAddForm(false) }} />}
						{sortByField(options).map((option) => <Option key={option._id} products={products} option={option} options={options} />)}
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
			<div className="w-full px-4 py-2">
				{selectedView !== null && selectedView !== 'Konfiguration' && (
					<div className="mb-2 space-y-1">
						<ResourceInfo viewName={selectedView} />
						<div className="flex flex-wrap justify-between items-center">
							<button
								type="button"
								title={showAddForm ? 'Skjul ny' : 'Tilføj ny'}
								className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg shadow-md"
								onClick={toggleAdd}
							>
								{showAddForm
									? <FaMinus className="h-4 w-4" />
									: <FaPlus className="h-4 w-4" />
								}
								<span className="ml-2">{showAddForm ? 'Skjul ny' : 'Tilføj ny'}</span>
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
					</div>
				)}
				{renderContent()}
			</div>
		</div>
	)
}

export default AdminView
