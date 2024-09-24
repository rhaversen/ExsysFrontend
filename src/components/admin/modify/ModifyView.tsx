'use client'

import Activity from '@/components/admin/modify/activity/Activity'
import AddActivity from '@/components/admin/modify/activity/AddActivity'
import AddAdmin from '@/components/admin/modify/admin/AddAdmin'
import Admin from '@/components/admin/modify/admin/Admin'
import ItemList from '@/components/admin/modify/ItemList'
import AddKiosk from '@/components/admin/modify/kiosk/AddKiosk'
import Kiosk from '@/components/admin/modify/kiosk/Kiosk'
import AddOption from '@/components/admin/modify/option/AddOption'
import Option from '@/components/admin/modify/option/Option'
import AddProduct from '@/components/admin/modify/product/AddProduct'
import Product from '@/components/admin/modify/product/Product'
import AddReader from '@/components/admin/modify/reader/AddReader'
import Reader from '@/components/admin/modify/reader/Reader'
import AddRoom from '@/components/admin/modify/room/AddRoom'
import Room from '@/components/admin/modify/room/Room'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import type sortConfig from '@/lib/SortConfig'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import {
	type ActivityType,
	type AdminType,
	type KioskType,
	type OptionType,
	type ProductType,
	type ReaderType,
	type RoomType
} from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from 'react-use'
import SortingControl from './ui/SortingControl'

const ModifyView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const views = ['Produkter', 'Tilvalg', 'Aktiviteter', 'Rum', 'Kiosker', 'Kortlæsere', 'Admins']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [admins, setAdmins] = useState<AdminType[]>([])
	const [readers, setReaders] = useState<ReaderType[]>([])

	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)
	const [showAddActivity, setShowAddActivity] = useState(false)
	const [showAddKiosk, setShowAddKiosk] = useState(false)
	const [showAddAdmin, setShowAddAdmin] = useState(false)
	const [showAddReader, setShowAddReader] = useState(false)
	const [sortField, setSortField] = useState('name')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	// Flag to prevent double fetching
	const hasFetchedData = useRef(false)

	const resolveProperty = (obj: any, path: string): any => {
		return path.split('.').reduce((acc, part) => acc != null ? acc[part] : undefined, obj)
	}

	const compareStrings = (strA: string, strB: string): number => {
		const lowerStrA = strA.toLowerCase()
		const lowerStrB = strB.toLowerCase()
		if (lowerStrA < lowerStrB) return sortDirection === 'asc' ? -1 : 1
		if (lowerStrA > lowerStrB) return sortDirection === 'asc' ? 1 : -1
		return 0
	}

	const compareValues = (valA: any, valB: any): number => {
		if (typeof valA === 'string' && typeof valB === 'string') {
			return compareStrings(valA, valB)
		}

		let result
		if (sortDirection === 'asc') {
			result = valA > valB ? 1 : -1
		} else {
			result = valA < valB ? 1 : -1
		}
		return result
	}

	const sortByField = (items: any[]): any[] => {
		return items.slice().sort((a: any, b: any) => {
			const valA = resolveProperty(a, sortField)
			const valB = resolveProperty(b, sortField)
			return compareValues(valA, valB)
		})
	}

	// Fetch all data in parallel
	const fetchData = useCallback(async (): Promise<void> => {
		try {
			const [
				productsResponse,
				optionsResponse,
				roomsResponse,
				activitiesResponse,
				kiosksResponse,
				adminsResponse,
				readersResponse
			] = await Promise.all([
				axios.get(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/options`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/rooms`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/activities`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/kiosks`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/admins`, { withCredentials: true }),
				axios.get(`${API_URL}/v1/readers`, { withCredentials: true })
			])

			const productsData = productsResponse.data as ProductType[]
			// Convert orderWindow to local time for all products
			productsData.forEach((product) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(productsData)
			setOptions(optionsResponse.data as OptionType[])
			setRooms(roomsResponse.data as RoomType[])
			setActivities(activitiesResponse.data as ActivityType[])
			setKiosks(kiosksResponse.data as KioskType[])
			setAdmins(adminsResponse.data as AdminType[])
			setReaders(readersResponse.data as ReaderType[])
		} catch (error: any) {
			addError(error)
		}
	}, [API_URL, addError])

	// Define handlers with useCallback and appropriate dependencies
	const handleUpdateProduct = useCallback((product: ProductType) => {
		setProducts((prevProducts) => {
			const index = prevProducts.findIndex((p) => p._id === product._id)
			if (index === -1) return prevProducts
			const newProducts = [...prevProducts]
			newProducts[index] = product
			return newProducts
		})
	}, [])

	const handleDeleteProduct = useCallback((id: string) => {
		setProducts((prevProducts) => prevProducts.filter((p) => p._id !== id))
	}, [])

	const handleAddProduct = useCallback((product: ProductType) => {
		setProducts((prevProducts) => [...prevProducts, product])
	}, [])

	const handleUpdateOption = useCallback((option: OptionType) => {
		setOptions((prevOptions) => {
			const index = prevOptions.findIndex((o) => o._id === option._id)
			if (index === -1) return prevOptions
			const newOptions = [...prevOptions]
			newOptions[index] = option
			return newOptions
		})
	}, [])

	const handleDeleteOption = useCallback((id: string) => {
		setOptions((prevOptions) => prevOptions.filter((o) => o._id !== id))
	}, [])

	const handleAddOption = useCallback((option: OptionType) => {
		setOptions((prevOptions) => [...prevOptions, option])
	}, [])

	const handleUpdateRoom = useCallback((room: RoomType) => {
		setRooms((prevRooms) => {
			const index = prevRooms.findIndex((r) => r._id === room._id)
			if (index === -1) return prevRooms
			const newRooms = [...prevRooms]
			newRooms[index] = room
			return newRooms
		})
	}, [])

	const handleDeleteRoom = useCallback((id: string) => {
		setRooms((prevRooms) => prevRooms.filter((r) => r._id !== id))
	}, [])

	const handleAddRoom = useCallback((room: RoomType) => {
		setRooms((prevRooms) => [...prevRooms, room])
	}, [])

	const handleUpdateActivity = useCallback((activity: ActivityType) => {
		setActivities((prevActivities) => {
			const index = prevActivities.findIndex((a) => a._id === activity._id)
			if (index === -1) return prevActivities
			const newActivities = [...prevActivities]
			newActivities[index] = activity
			return newActivities
		})
	}, [])

	const handleDeleteActivity = useCallback((id: string) => {
		setActivities((prevActivities) => prevActivities.filter((a) => a._id !== id))
	}, [])

	const handleAddActivity = useCallback((activity: ActivityType) => {
		setActivities((prevActivities) => [...prevActivities, activity])
	}, [])

	const handleUpdateKiosk = useCallback((kiosk: KioskType) => {
		setKiosks((prevKiosks) => {
			const index = prevKiosks.findIndex((k) => k._id === kiosk._id)
			if (index === -1) return prevKiosks
			const newKiosks = [...prevKiosks]
			newKiosks[index] = kiosk
			return newKiosks
		})
	}, [])

	const handleDeleteKiosk = useCallback((id: string) => {
		setKiosks((prevKiosks) => prevKiosks.filter((k) => k._id !== id))
	}, [])

	const handleAddKiosk = useCallback((kiosk: KioskType) => {
		setKiosks((prevKiosks) => [...prevKiosks, kiosk])
	}, [])

	const handleUpdateAdmin = useCallback((admin: AdminType) => {
		setAdmins((prevAdmins) => {
			const index = prevAdmins.findIndex((a) => a._id === admin._id)
			if (index === -1) return prevAdmins
			const newAdmins = [...prevAdmins]
			newAdmins[index] = admin
			return newAdmins
		})
	}, [])

	const handleDeleteAdmin = useCallback((id: string) => {
		setAdmins((prevAdmins) => prevAdmins.filter((a) => a._id !== id))
	}, [])

	const handleAddAdmin = useCallback((admin: AdminType) => {
		setAdmins((prevAdmins) => [...prevAdmins, admin])
	}, [])

	const handleUpdateReader = useCallback((reader: ReaderType) => {
		setReaders((prevReaders) => {
			const index = prevReaders.findIndex((r) => r._id === reader._id)
			if (index === -1) return prevReaders
			const newReaders = [...prevReaders]
			newReaders[index] = reader
			return newReaders
		})
	}, [])

	const handleDeleteReader = useCallback((id: string) => {
		setReaders((prevReaders) => prevReaders.filter((r) => r._id !== id))
	}, [])

	const handleAddReader = useCallback((reader: ReaderType) => {
		setReaders((prevReaders) => [...prevReaders, reader])
	}, [])

	// Fetch data on component mount
	useEffect(() => {
		if (hasFetchedData.current) return // Prevent double fetching
		hasFetchedData.current = true

		fetchData().catch(addError)
	}, [fetchData, addError])

	// Refresh data every hour
	useInterval(() => {
		fetchData().catch(addError)
	}, 1000 * 60 * 60) // Every hour

	return (
		<div>
			<ViewSelectionBar
				subLevel={1}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView !== null &&
				<SortingControl
					onSortFieldChange={setSortField}
					onSortDirectionChange={(direction: string) => { setSortDirection(direction as 'asc' | 'desc') }}
					type={selectedView as keyof typeof sortConfig}
				/>
			}
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>}
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
								onProductPatched={handleUpdateProduct}
								onProductDeleted={handleDeleteProduct}
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
								onOptionPatched={handleUpdateOption}
								onOptionDeleted={handleDeleteOption}
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
								rooms={rooms}
								room={room}
								onRoomPatched={handleUpdateRoom}
								onRoomDeleted={handleDeleteRoom}
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
								onActivityPatched={handleUpdateActivity}
								onActivityDeleted={handleDeleteActivity}
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
								kiosks={kiosks}
								kiosk={kiosk}
								activities={activities}
								readers={readers}
								onKioskPatched={handleUpdateKiosk}
								onKioskDeleted={handleDeleteKiosk}
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
								admins={admins}
								admin={admin}
								onAdminPatched={handleUpdateAdmin}
								onAdminDeleted={handleDeleteAdmin}
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
								readers={readers}
								reader={reader}
								onReaderPatched={handleUpdateReader}
								onReaderDeleted={handleDeleteReader}
							/>
						</div>
					))}
				</ItemList>
			}
			{showAddProduct &&
				<AddProduct
					options={options}
					onProductPosted={handleAddProduct}
					onClose={() => {
						setShowAddProduct(false)
					}}
				/>
			}
			{showAddOption &&
				<AddOption
					onOptionPosted={handleAddOption}
					onClose={() => {
						setShowAddOption(false)
					}}
				/>
			}
			{showAddRoom &&
				<AddRoom
					rooms={rooms}
					onRoomPosted={handleAddRoom}
					onClose={() => {
						setShowAddRoom(false)
					}}
				/>
			}
			{showAddActivity &&
				<AddActivity
					rooms={rooms}
					onActivityPosted={handleAddActivity}
					onClose={() => {
						setShowAddActivity(false)
					}}
				/>
			}
			{showAddKiosk &&
				<AddKiosk
					kiosks={kiosks}
					activities={activities}
					readers={readers}
					onKioskPosted={handleAddKiosk}
					onClose={() => {
						setShowAddKiosk(false)
					}}
				/>
			}
			{showAddAdmin &&
				<AddAdmin
					admins={admins}
					onAdminPosted={handleAddAdmin}
					onClose={() => {
						setShowAddAdmin(false)
					}}
				/>
			}
			{showAddReader &&
				<AddReader
					readers={readers}
					onReaderPosted={handleAddReader}
					onClose={() => {
						setShowAddReader(false)
					}}
				/>
			}
		</div>
	)
}

export default ModifyView
