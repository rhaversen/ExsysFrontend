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
import SessionsView from '@/components/admin/modify/session/SessionsView'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import type sortConfig from '@/lib/SortConfig'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import {
	type ActivityType,
	type AdminType,
	type KioskType,
	type OptionType,
	type ProductType,
	type ReaderType,
	type RoomType,
	type SessionType
} from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import SortingControl from './ui/SortingControl'

const ModifyView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { addError } = useError()

	const views = ['Produkter', 'Tilvalg', 'Aktiviteter', 'Spisesteder', 'Kiosker', 'Kortlæsere', 'Admins', 'Login Sessioner']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [admins, setAdmins] = useState<AdminType[]>([])
	const [readers, setReaders] = useState<ReaderType[]>([])
	const [sessions, setSessions] = useState<SessionType[]>([])

	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)
	const [showAddActivity, setShowAddActivity] = useState(false)
	const [showAddKiosk, setShowAddKiosk] = useState(false)
	const [showAddAdmin, setShowAddAdmin] = useState(false)
	const [showAddReader, setShowAddReader] = useState(false)
	const [sortField, setSortField] = useState('name')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

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
				readersResponse,
				sessionsResponse
			] = await Promise.all([
				axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get<OptionType[]>(`${API_URL}/v1/options`, { withCredentials: true }),
				axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true }),
				axios.get<ActivityType[]>(`${API_URL}/v1/activities`, { withCredentials: true }),
				axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true }),
				axios.get<AdminType[]>(`${API_URL}/v1/admins`, { withCredentials: true }),
				axios.get<ReaderType[]>(`${API_URL}/v1/readers`, { withCredentials: true }),
				axios.get<SessionType[]>(`${API_URL}/v1/sessions`, { withCredentials: true })
			])

			const productsData = productsResponse.data
			// Convert orderWindow to local time for all products
			productsData.forEach((product) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(productsData)
			setOptions(optionsResponse.data)
			setRooms(roomsResponse.data)
			setActivities(activitiesResponse.data)
			setKiosks(kiosksResponse.data)
			setAdmins(adminsResponse.data)
			setReaders(readersResponse.data)
			setSessions(sessionsResponse.data)
		} catch (error: any) {
			addError(error)
		}
	}, [API_URL, addError])

	// Generic update handler
	const CreateUpdateHandler = <T extends { _id: string }> (
		setState: React.Dispatch<React.SetStateAction<T[]>>
	): (item: T) => void => {
		return useCallback(
			(item: T) => {
				setState((prevItems) => {
					const index = prevItems.findIndex((i) => i._id === item._id)
					if (index === -1) return prevItems
					const newItems = [...prevItems]
					newItems[index] = item
					return newItems
				})
			},
			[setState]
		)
	}

	// Generic delete handler
	const CreateDeleteHandler = <T extends { _id: string }> (
		setState: React.Dispatch<React.SetStateAction<T[]>>
	): (id: string) => void => {
		return useCallback(
			(id: string) => {
				setState((prevItems) => prevItems.filter((i) => i._id !== id))
			},
			[setState]
		)
	}

	// Generic add handler
	const CreateAddHandler = <T, > (
		setState: React.Dispatch<React.SetStateAction<T[]>>
	): (item: T) => void => {
		return useCallback(
			(item: T) => {
				setState((prevItems) => [...prevItems, item])
			},
			[setState]
		)
	}

	// Products
	const handleUpdateProduct = CreateUpdateHandler<ProductType>(setProducts)
	const handleDeleteProduct = CreateDeleteHandler<ProductType>(setProducts)
	const handleAddProduct = CreateAddHandler<ProductType>(setProducts)

	// Options
	const handleUpdateOption = CreateUpdateHandler<OptionType>(setOptions)
	const handleDeleteOption = CreateDeleteHandler<OptionType>(setOptions)
	const handleAddOption = CreateAddHandler<OptionType>(setOptions)

	// Rooms
	const handleUpdateRoom = CreateUpdateHandler<RoomType>(setRooms)
	const handleDeleteRoom = CreateDeleteHandler<RoomType>(setRooms)
	const handleAddRoom = CreateAddHandler<RoomType>(setRooms)

	// Activities
	const handleUpdateActivity = CreateUpdateHandler<ActivityType>(setActivities)
	const handleDeleteActivity = CreateDeleteHandler<ActivityType>(setActivities)
	const handleAddActivity = CreateAddHandler<ActivityType>(setActivities)

	// Kiosks
	const handleUpdateKiosk = CreateUpdateHandler<KioskType>(setKiosks)
	const handleDeleteKiosk = CreateDeleteHandler<KioskType>(setKiosks)
	const handleAddKiosk = CreateAddHandler<KioskType>(setKiosks)

	// Admins
	const handleUpdateAdmin = CreateUpdateHandler<AdminType>(setAdmins)
	const handleDeleteAdmin = CreateDeleteHandler<AdminType>(setAdmins)
	const handleAddAdmin = CreateAddHandler<AdminType>(setAdmins)

	// Readers
	const handleUpdateReader = CreateUpdateHandler<ReaderType>(setReaders)
	const handleDeleteReader = CreateDeleteHandler<ReaderType>(setReaders)
	const handleAddReader = CreateAddHandler<ReaderType>(setReaders)

	// Sessions
	const handleUpdateSession = CreateUpdateHandler<SessionType>(setSessions)
	const handleDeleteSession = CreateDeleteHandler<SessionType>(setSessions)
	const handleAddSession = CreateAddHandler<SessionType>(setSessions)

	// Activities
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		handleAddActivity,
		handleUpdateActivity,
		handleDeleteActivity
	)

	// Admins
	useEntitySocketListeners<AdminType>(
		socket,
		'admin',
		handleAddAdmin,
		handleUpdateAdmin,
		handleDeleteAdmin
	)

	// Kiosks
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		handleAddKiosk,
		handleUpdateKiosk,
		handleDeleteKiosk
	)

	// Options
	useEntitySocketListeners<OptionType>(
		socket,
		'option',
		handleAddOption,
		handleUpdateOption,
		handleDeleteOption
	)

	// Products with preprocessing
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		handleAddProduct,
		handleUpdateProduct,
		handleDeleteProduct,
		(product) => {
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			return product
		}
	)

	// Rooms
	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		handleAddRoom,
		handleUpdateRoom,
		handleDeleteRoom
	)

	// Readers
	useEntitySocketListeners<ReaderType>(
		socket,
		'reader',
		handleAddReader,
		handleUpdateReader,
		handleDeleteReader
	)

	// Sessions
	useEntitySocketListeners<SessionType>(
		socket,
		'session',
		handleAddSession,
		handleUpdateSession,
		handleDeleteSession
	)

	// Fetch data on component mount
	useEffect(() => {
		if (hasFetchedData.current) return // Prevent double fetching
		hasFetchedData.current = true

		fetchData().catch(addError)
	}, [fetchData, addError])

	// Initialize WebSocket connection
	useEffect(() => {
		if (WS_URL === undefined || WS_URL === null || WS_URL === '') return
		// Initialize WebSocket connection
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			// Cleanup WebSocket connection on component unmount
			socketInstance.disconnect()
		}
	}, [WS_URL])

	return (
		<div>
			<ViewSelectionBar
				subLevel={1}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView !== null && selectedView !== 'Login Sessioner' &&
				<SortingControl
					onSortFieldChange={setSortField}
					onSortDirectionChange={(direction: string) => { setSortDirection(direction as 'asc' | 'desc') }}
					type={selectedView as keyof typeof sortConfig}
				/>
			}
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
			}
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
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Spisesteder' &&
				<ItemList
					buttonText="Nyt Spisested"
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
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Login Sessioner' &&
				<SessionsView
					admins={admins}
					kiosks={kiosks}
					sessions={sessions}
				/>
			}
			{showAddProduct &&
				<AddProduct
					options={options}
					onClose={() => {
						setShowAddProduct(false)
					}}
				/>
			}
			{showAddOption &&
				<AddOption
					onClose={() => {
						setShowAddOption(false)
					}}
				/>
			}
			{showAddRoom &&
				<AddRoom
					rooms={rooms}
					onClose={() => {
						setShowAddRoom(false)
					}}
				/>
			}
			{showAddActivity &&
				<AddActivity
					rooms={rooms}
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
					onClose={() => {
						setShowAddKiosk(false)
					}}
				/>
			}
			{showAddAdmin &&
				<AddAdmin
					admins={admins}
					onClose={() => {
						setShowAddAdmin(false)
					}}
				/>
			}
			{showAddReader &&
				<AddReader
					readers={readers}
					onClose={() => {
						setShowAddReader(false)
					}}
				/>
			}
		</div>
	)
}

export default ModifyView
