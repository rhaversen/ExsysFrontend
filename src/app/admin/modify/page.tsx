'use client'

import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import AdminView from '@/components/admin/modify/AdminView'
import ConfigsView from '@/components/admin/modify/setup/config/ConfigsView'
import SessionsView from '@/components/admin/modify/setup/session/SessionsView'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
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

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { addError } = useError()

	const views = ['Rediger Katalog', 'Rediger Opsætning', 'Konfiguration', 'Login Sessioner']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [admins, setAdmins] = useState<AdminType[]>([])
	const [readers, setReaders] = useState<ReaderType[]>([])
	const [sessions, setSessions] = useState<SessionType[]>([])

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

	// Flag to prevent double fetching
	const hasFetchedData = useRef(false)

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

			setProducts(productsResponse.data)
			setOptions(optionsResponse.data)
			setRooms(roomsResponse.data)
			setActivities(activitiesResponse.data)
			setKiosks(kiosksResponse.data)
			setAdmins(adminsResponse.data)
			setReaders(readersResponse.data)
			setSessions(sessionsResponse.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

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

	// Generic update handler
	const CreateUpdateHandler = <T extends { _id: string }> (
		setState: React.Dispatch<React.SetStateAction<T[]>>
	): (item: T) => void => {
		return useCallback(
			(item: T) => {
				setState((prevItems) => {
					const index = prevItems.findIndex((i) => i._id === item._id)
					if (index === -1) { return prevItems }
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

	// Products
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		CreateAddHandler<ProductType>(setProducts),
		CreateUpdateHandler<ProductType>(setProducts),
		CreateDeleteHandler<ProductType>(setProducts)
	)

	// Options
	useEntitySocketListeners<OptionType>(
		socket,
		'option',
		CreateAddHandler<OptionType>(setOptions),
		CreateUpdateHandler<OptionType>(setOptions),
		CreateDeleteHandler<OptionType>(setOptions)
	)

	// Activities
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		CreateAddHandler<ActivityType>(setActivities),
		CreateUpdateHandler<ActivityType>(setActivities),
		CreateDeleteHandler<ActivityType>(setActivities)
	)

	// Rooms
	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		CreateAddHandler<RoomType>(setRooms),
		CreateUpdateHandler<RoomType>(setRooms),
		CreateDeleteHandler<RoomType>(setRooms)
	)

	// Kiosks
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		CreateAddHandler<KioskType>(setKiosks),
		CreateUpdateHandler<KioskType>(setKiosks),
		CreateDeleteHandler<KioskType>(setKiosks)
	)

	// Readers
	useEntitySocketListeners<ReaderType>(
		socket,
		'reader',
		CreateAddHandler<ReaderType>(setReaders),
		CreateUpdateHandler<ReaderType>(setReaders),
		CreateDeleteHandler<ReaderType>(setReaders)
	)

	// Admins
	useEntitySocketListeners<AdminType>(
		socket,
		'admin',
		CreateAddHandler<AdminType>(setAdmins),
		CreateUpdateHandler<AdminType>(setAdmins),
		CreateDeleteHandler<AdminType>(setAdmins)
	)

	// Sessions
	useEntitySocketListeners<SessionType>(
		socket,
		'session',
		CreateAddHandler<SessionType>(setSessions),
		CreateUpdateHandler<SessionType>(setSessions),
		CreateDeleteHandler<SessionType>(setSessions)
	)

	// Fetch data on component mount
	useEffect(() => {
		if (hasFetchedData.current) { return } // Prevent double fetching
		hasFetchedData.current = true

		fetchData().catch(addError)
	}, [fetchData, addError])

	// Initialize WebSocket connection
	useEffect(() => {
		if (WS_URL === undefined || WS_URL === null || WS_URL === '') { return }
		// Initialize WebSocket connection
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			// Cleanup WebSocket connection on component unmount
			socketInstance.disconnect()
		}
	}, [WS_URL])

	return (
		<main>
			<ViewSelectionBar
				subLevel={0}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
			}
			{(selectedView === 'Rediger Katalog' || selectedView === 'Rediger Opsætning') &&
				<AdminView
					products={products}
					options={options}
					activities={activities}
					admins={admins}
					kiosks={kiosks}
					readers={readers}
					rooms={rooms}
					views={selectedView === 'Rediger Katalog' ? ['Produkter', 'Tilvalg'] : ['Kiosker', 'Aktiviteter', 'Spisesteder', 'Kortlæsere', 'Admins']}
				/>
			}
			{selectedView === 'Login Sessioner' &&
				<SessionsView
					admins={admins}
					kiosks={kiosks}
					sessions={sessions}
				/>
			}
			{selectedView === 'Konfiguration' &&
				<ConfigsView/>
			}
		</main>
	)
}
