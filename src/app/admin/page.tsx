'use client'

import ModifyView from '@/components/admin/modify/ModifyView'
import OverviewView from '@/components/admin/overview/OverviewView'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import { type AdminType, type KioskType, type ActivityType, type OptionType, type OrderType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const views = ['Ordre Oversigt', 'Rediger Katalog']
	const { addError } = useError()

	const [selectedView, setSelectedView] = useState('Ordre Oversigt')

	const [orders, setOrders] = useState<OrderType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [admins, setAdmins] = useState<AdminType[]>([])

	const [fetching, setFetching] = useState<boolean>(true)

	const getOrders = useCallback(async () => {
		const fromDate = new Date()
		fromDate.setHours(0, 0, 0, 0)
		const toDate = new Date()
		toDate.setHours(24, 0, 0, 0)

		try {
			const response = await axios.get(`${API_URL}/v1/orders?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}&status=pending,confirmed`, { withCredentials: true })
			const data = response.data as OrderType[]
			setOrders(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const getProducts = useCallback(async () => {
		try {
			const productsResponse = await axios.get(API_URL + '/v1/products', { withCredentials: true })
			const products = productsResponse.data as ProductType[]
			// Convert orderWindow to local time for all products
			products.forEach((product) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(products)
		} catch (error: any) {
		}
	}, [API_URL])

	const getOptions = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/options', { withCredentials: true })
			const data = response.data as OptionType[]
			setOptions(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const getRooms = useCallback(async () => {
		try {
			const roomsResponse = await axios.get(API_URL + '/v1/rooms', { withCredentials: true })
			const rooms = roomsResponse.data as RoomType[]
			setRooms(rooms)
		} catch (error: any) {
		}
	}, [API_URL])

	const getActivities = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/activities', { withCredentials: true })
			const data = response.data as ActivityType[]
			setActivities(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const getKiosks = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/kiosks', { withCredentials: true })
			const data = response.data as KioskType[]
			setKiosks(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const getAdmins = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/admins', { withCredentials: true })
			const data = response.data as AdminType[]
			setAdmins(data)
		} catch (error: any) {
		}
	}, [API_URL])

	const fetchData = useCallback(() => {
		setFetching(true)
		Promise.all([
			getRooms(),
			getProducts(),
			getOptions(),
			getOrders(),
			getActivities(),
			getKiosks(),
			getAdmins()
		]).catch((error: any) => {
			addError(error)
		})
		setFetching(false)
	}, [getOrders, getProducts, getOptions, getRooms, addError, getActivities, getKiosks, getAdmins])

	const handleOrdersUpdate = useCallback((orders: OrderType[]) => {
		// Only update the orders that were changed
		setOrders((prevOrders) => {
			const newOrders = [...prevOrders]
			orders.forEach((newOrder) => {
				const index = newOrders.findIndex((order) => order._id === newOrder._id)
				if (index === -1) return
				if (newOrder.status === 'delivered') {
					newOrders.splice(index, 1)
					return
				}
				newOrders[index] = newOrder
			})
			return newOrders
		})
	}, [])

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

	useInterval(getOrders, 1000 * 10) // Fetch orders 10 seconds
	useInterval(getProducts, 1000 * 60 * 60) // Fetch products every hour
	useInterval(getOptions, 1000 * 60 * 60) // Fetch options every hour
	useInterval(getRooms, 1000 * 60 * 60) // Fetch rooms every hour

	useEffect(() => {
		fetchData()
	}, [fetchData])

	return (
		<main>
			<ViewSelectionBar
				subBar={false}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView === 'Ordre Oversigt' &&
				<OverviewView
					orders={orders}
					products={products}
					options={options}
					rooms={rooms}
					activities={activities}
					isFetching={fetching}
					onUpdatedOrders={handleOrdersUpdate}
				/>
			}
			{selectedView === 'Rediger Katalog' &&
				<ModifyView
					products={products}
					options={options}
					rooms={rooms}
					activities={activities}
					kiosks={kiosks}
					admins={admins}
					onUpdatedProduct={handleUpdateProduct}
					onDeletedProduct={handleDeleteProduct}
					onAddedProduct={handleAddProduct}
					onUpdatedOption={handleUpdateOption}
					onDeletedOption={handleDeleteOption}
					onAddedOption={handleAddOption}
					onUpdatedRoom={handleUpdateRoom}
					onDeletedRoom={handleDeleteRoom}
					onAddedRoom={handleAddRoom}
					onAddedActivity={handleAddActivity}
					onUpdatedActivity={handleUpdateActivity}
					onDeletedActivity={handleDeleteActivity}
					onAddedKiosk={handleAddKiosk}
					onUpdatedKiosk={handleUpdateKiosk}
					onDeletedKiosk={handleDeleteKiosk}
					onAddedAdmin={handleAddAdmin}
					onUpdatedAdmin={handleUpdateAdmin}
					onDeletedAdmin={handleDeleteAdmin}
				/>
			}
		</main>
	)
}
