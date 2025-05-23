'use client'

import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

import AdminView from '@/components/admin/modify/AdminView'
import ConfigsView from '@/components/admin/modify/setup/config/ConfigsView'
import SessionsView from '@/components/admin/modify/setup/session/SessionsView'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSocket } from '@/hooks/CudWebsocket'
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

	useSocket<ProductType>('product', { setState: setProducts })
	useSocket<OptionType>('option', { setState: setOptions })
	useSocket<ActivityType>('activity', { setState: setActivities })
	useSocket<RoomType>('room', { setState: setRooms })
	useSocket<KioskType>('kiosk', { setState: setKiosks })
	useSocket<ReaderType>('reader', { setState: setReaders })
	useSocket<AdminType>('admin', { setState: setAdmins })
	useSocket<SessionType>('session', { setState: setSessions })

	// Fetch data on component mount
	useEffect(() => {
		if (hasFetchedData.current) { return } // Prevent double fetching
		hasFetchedData.current = true

		fetchData().catch(addError)
	}, [fetchData, addError])

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
