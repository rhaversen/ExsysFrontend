'use client'

import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import ManualOrderSidebar from '@/components/admin/kitchen/ManualOrderSidebar'
import RoomCol from '@/components/admin/kitchen/RoomCol'
import SoundsConfig from '@/components/admin/kitchen/SoundsConfig'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSound } from '@/contexts/SoundProvider'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { type ActivityType, type OptionType, type OrderType, type ProductType, type RoomType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL
	const { addError } = useError()
	const { isMuted, setIsMuted } = useSound()

	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [orders, setOrders] = useState<OrderType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [socket, setSocket] = useState<Socket | null>(null)

	// Activity map
	const activityMap = useMemo(() => {
		return activities.reduce<Record<string, string>>((acc, act) => {
			acc[act._id] = act.name
			return acc
		}, {})
	}, [activities])

	// Group orders by room name
	const groupedOrders = useMemo(() => {
		return rooms.reduce<Record<string, OrderType[]>>((acc, room) => {
			acc[room.name] = orders.filter(o => o.roomId === room._id && o.status !== 'delivered')
			return acc
		}, {
			// Include "no-room" fallback
			'no-room': orders.filter(o => !rooms.some(r => r._id === o.roomId) && o.status !== 'delivered')
		})
	}, [rooms, orders])

	const fetchData = useCallback(async () => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const [roomsRes, actsRes, ordersRes, productsRes, optionsRes] = await Promise.all([
				axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true }),
				axios.get<ActivityType[]>(`${API_URL}/v1/activities`, { withCredentials: true }),
				axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
					params: {
						fromDate: fromDate.toISOString(),
						toDate: toDate.toISOString(),
						status: 'pending,confirmed',
						paymentStatus: 'successful'
					},
					withCredentials: true
				}),
				axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get<OptionType[]>(`${API_URL}/v1/options`, { withCredentials: true })
			])

			setRooms(roomsRes.data)
			setActivities(actsRes.data)
			setOrders(ordersRes.data)
			setProducts(productsRes.data)
			setOptions(optionsRes.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	// Update orders locally by matching _id
	const handleUpdatedOrders = useCallback((updated: UpdatedOrderType[]) => {
		setOrders(prev => prev.map(o => {
			const find = updated.find(u => u._id === o._id)
			return (find != null) ? { ...o, status: find.status } : o
		}))
	}, [])

	// Socket setup
	useEffect(() => {
		if (WS_URL == null) { return }
		const s = io(WS_URL)
		setSocket(s)
		return () => { s.disconnect() }
	}, [WS_URL])

	// Listen for new orders
	useEffect(() => {
		if (socket == null) { return }
		const onCreated = (o: OrderType): void => { setOrders(prev => [...prev, o]) }
		socket.on('orderCreated', onCreated)
		return () => { socket.off('orderCreated', onCreated) }
	}, [socket])

	// Fetch on mount
	useEffect(() => { fetchData().catch(addError) }, [fetchData, addError])

	// Rooms, activities, products and options socket listeners
	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		r => { setRooms(prev => [...prev, r]) },
		r => { setRooms(prev => prev.map(p => p._id === r._id ? r : p)) },
		id => { setRooms(prev => prev.filter(r => r._id !== id)) }
	)
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		a => { setActivities(prev => [...prev, a]) },
		a => { setActivities(prev => prev.map(p => p._id === a._id ? a : p)) },
		id => { setActivities(prev => prev.filter(a => a._id !== id)) }
	)
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		p => { setProducts(prev => [...prev, p]) },
		p => { setProducts(prev => prev.map(pr => pr._id === p._id ? p : pr)) },
		id => { setProducts(prev => prev.filter(p => p._id !== id)) }
	)
	useEntitySocketListeners<OptionType>(
		socket,
		'option',
		o => { setOptions(prev => [...prev, o]) },
		o => { setOptions(prev => prev.map(opt => opt._id === o._id ? o : opt)) },
		id => { setOptions(prev => prev.filter(o => o._id !== id)) }
	)

	const [showSoundSettings, setShowSoundSettings] = useState(false)
	const [showManual, setShowManual] = useState(false) // Default to false

	useEffect(() => {
		const mediaQuery = window.matchMedia('(min-width: 640px)') // Tailwind's sm breakpoint
		if (mediaQuery.matches) {
			setShowManual(true)
		}
	}, [])

	// Flatten all orders to check if there's any pending
	const allActive = Object.values(groupedOrders).flat()

	return (
		<main className="flex">
			{/* Main Content Area */}
			<div className="flex-grow">
				{allActive.length === 0
					? (
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
							<div className="text-gray-800 text-2xl">
								{'Ingen Ordrer 😊'}
							</div>
							<div className="text-gray-800 text-center text-lg mt-2">
								{'Nye ordrer vil automatisk blive vist her'}
							</div>
						</div>
					)
					: (
						<div className="p-2 pb-20 flex flex-wrap justify-start">
							{groupedOrders['no-room']?.length > 0 && (
								<RoomCol
									key="no-room"
									room={{
										_id: 'no-room',
										name: 'Ukendt Spisested',
										description: '',
										createdAt: '',
										updatedAt: ''
									}}
									orders={groupedOrders['no-room']}
									onUpdatedOrders={handleUpdatedOrders}
									activityMap={activityMap}
								/>
							)}
							{rooms
								.filter(r => groupedOrders[r.name]?.length > 0)
								.map(r => (
									<RoomCol
										key={r._id}
										room={r}
										orders={groupedOrders[r.name]}
										onUpdatedOrders={handleUpdatedOrders}
										activityMap={activityMap}
									/>
								))}
						</div>
					)}

				{/* Sound settings and manual order button */}
				<div className="fixed bottom-4 left-4 flex">
					<button
						type="button"
						onClick={() => { setIsMuted(!isMuted) }}
						className="px-4 py-3 bg-white shadow-md text-gray-700 rounded-l-md hover:bg-gray-50 border-r border-gray-200 text-xl"
						title={isMuted ? 'Slå lyd til' : 'Slå lyd fra'}
					>
						<span>{isMuted ? '🔇' : '🔊'}</span>
					</button>
					<button
						type="button"
						onClick={() => { setShowSoundSettings(!showSoundSettings) }}
						className={`px-5 py-3 shadow-md text-lg font-medium rounded-r-md transition-colors ${showSoundSettings
							? 'bg-blue-500 text-white hover:bg-blue-600'
							: 'bg-white text-gray-700 hover:bg-gray-50'
						}`}
					>
						{'Lydindstillinger'}
					</button>
					<button
						type="button"
						onClick={() => setShowManual(!showManual)}
						className={`px-5 py-3 shadow-md text-lg font-medium rounded-md ml-2 transition-colors ${!showManual // Button is blue when sidebar is hidden
							? 'bg-blue-500 text-white hover:bg-blue-600'
							: 'bg-white text-gray-700 hover:bg-gray-50'
						}`}
						title={showManual ? 'Skjul Manuel Ordre' : 'Vis Manuel Ordre'}
					>
						{'Manuel Ordre'}
					</button>
				</div>
			</div>

			{/* Sound settings modal */}
			{showSoundSettings && (
				<SoundsConfig onClose={() => { setShowSoundSettings(false) }} />
			)}

			{/* Sidebar for small screens */}
			{showManual && (
				<div className="fixed inset-0 sm:hidden bg-white z-50 overflow-x-auto shadow-lg">
					<div className="absolute top-4 right-4">
						<button
							type="button"
							onClick={() => setShowManual(false)}
							className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md text-lg"
							aria-label="Skjul manuel ordre"
						>
							&times;
						</button>
					</div>
					<ManualOrderSidebar
						rooms={rooms}
						activities={activities}
						products={products}
						options={options}
						recentManualOrders={orders.filter(o => o.checkoutMethod === 'manual')}
					/>
				</div>
			)}

			{/* Sidebar for larger screens */}
			{showManual &&
			<>
				{/* Space for the sidebar */}
				<div className="hidden sm:block min-w-90" />

				{/* Sidebar for larger screens */}
				<div className="hidden sm:block fixed right-0 h-full overflow-x-auto bg-white shadow-lg">
					<ManualOrderSidebar
						rooms={rooms}
						activities={activities}
						products={products}
						options={options}
						recentManualOrders={orders.filter(o => o.checkoutMethod === 'manual')}
					/>
				</div>
			</>
			}
		</main>
	)
}
