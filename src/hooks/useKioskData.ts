'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useConfig } from '@/contexts/ConfigProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import { filterAvailableActivities, filterAvailableProducts, isKioskCurrentlyClosed } from '@/lib/kioskAvailability'
import { getNextOrderWindowChange } from '@/lib/timeUtils'
import { type ActivityType, type KioskType, type OptionType, type ProductType, type RoomType } from '@/types/backendDataTypes'

interface CheckoutMethods {
	sumUp: boolean
	later: boolean
	mobilePay: boolean
}

interface UseKioskDataReturn {
	kiosk: KioskType | null
	products: ProductType[]
	options: OptionType[]
	activities: ActivityType[]
	rooms: RoomType[]
	availableProducts: ProductType[]
	availableActivities: ActivityType[]
	checkoutMethods: CheckoutMethods
	isKioskClosed: boolean
	selectedActivity: ActivityType | null
	setSelectedActivity: (activity: ActivityType | null) => void
	selectedRoom: RoomType | null
	setSelectedRoom: (room: RoomType | null) => void
}

export function useKioskData (): UseKioskDataReturn {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { config } = useConfig()
	const { addError } = useError()
	const router = useRouter()

	const [kiosk, setKiosk] = useState<KioskType | null>(null)
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
	const [checkoutMethods, setCheckoutMethods] = useState<CheckoutMethods>({
		sumUp: false,
		later: true,
		mobilePay: false
	})
	const [availabilityTick, setAvailabilityTick] = useState(0)

	const updateCheckoutMethods = useCallback((kioskData: KioskType) => {
		setCheckoutMethods(prev => ({
			...prev,
			sumUp: kioskData.readerId !== null && kioskData.readerId !== undefined
		}))
	}, [])

	const availableProducts = useMemo(() => {
		void availabilityTick
		return filterAvailableProducts(products)
	}, [products, availabilityTick])

	const availableActivities = useMemo(() => {
		return filterAvailableActivities(activities, kiosk, availableProducts)
	}, [activities, kiosk, availableProducts])

	const isKioskClosed = useMemo(() => {
		return isKioskCurrentlyClosed(kiosk, config, availableProducts)
	}, [config, kiosk, availableProducts])

	useEffect(() => {
		const orderWindows = products.map(p => p.orderWindow)
		const nextChange = getNextOrderWindowChange(orderWindows)

		if (!nextChange) { return }

		const msUntilChange = nextChange.getTime() - Date.now() + 100
		const timeout = setTimeout(() => setAvailabilityTick(t => t + 1), msUntilChange)

		return () => clearTimeout(timeout)
	}, [products, availabilityTick])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') { return }

		const fetchData = async (): Promise<void> => {
			try {
				const [kioskData, productsData, optionsData, activitiesData, roomsData] = await Promise.all([
					axios.get<KioskType>(`${API_URL}/v1/kiosks/me`, { withCredentials: true }),
					axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
					axios.get<OptionType[]>(`${API_URL}/v1/options`, { withCredentials: true }),
					axios.get<ActivityType[]>(`${API_URL}/v1/activities`, { withCredentials: true }),
					axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true })
				])

				setKiosk(kioskData.data)
				setProducts(productsData.data)
				setOptions(optionsData.data)
				setActivities(activitiesData.data)
				setRooms(roomsData.data)
				updateCheckoutMethods(kioskData.data)
			} catch (error) {
				addError(error)
			}
		}

		fetchData().catch(addError)
	}, [API_URL, addError, updateCheckoutMethods])

	useEntitySocket<ProductType>('product', { setState: setProducts })
	useEntitySocket<OptionType>('option', { setState: setOptions })

	useEntitySocket<ActivityType>('activity', {
		setState: setActivities,
		onUpdate: activityUpdate => {
			if (selectedActivity?._id === activityUpdate._id) {
				setSelectedActivity(activityUpdate)
			}
			if (selectedRoom && !activityUpdate.enabledRooms.includes(selectedRoom._id)) {
				setSelectedRoom(null)
			}
		},
		onDelete: id => {
			if (selectedActivity?._id === id) {
				setSelectedActivity(null)
			}
		}
	})

	useEntitySocket<KioskType>('kiosk', {
		onUpdate: kioskUpdate => {
			if (kiosk && kioskUpdate._id === kiosk._id) {
				setKiosk(kioskUpdate)
				updateCheckoutMethods(kioskUpdate)
				if (selectedActivity && !kioskUpdate.enabledActivities?.includes(selectedActivity._id)) {
					setSelectedActivity(null)
				}
			}
		},
		onDelete: () => {
			router.push('/login-kiosk')
		}
	})

	useEntitySocket<RoomType>('room', {
		setState: setRooms,
		onUpdate: roomUpdate => {
			if (selectedRoom?._id === roomUpdate._id) {
				setSelectedRoom(roomUpdate)
			}
		},
		onDelete: id => {
			if (selectedRoom?._id === id) {
				setSelectedRoom(null)
			}
		}
	})

	return {
		kiosk,
		products,
		options,
		activities,
		rooms,
		availableProducts,
		availableActivities,
		checkoutMethods,
		isKioskClosed,
		selectedActivity,
		setSelectedActivity,
		selectedRoom,
		setSelectedRoom
	}
}
