'use client'

import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import RoomCol from '@/components/admin/kitchen/RoomCol'
import SoundsConfig from '@/components/admin/kitchen/SoundsConfig'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSound } from '@/contexts/SoundProvider'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { type RoomType, type ActivityType, type OrderType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL
	const { addError } = useError()
	const { isMuted, setIsMuted } = useSound()

	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [orders, setOrders] = useState<OrderType[]>([])
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

			const [roomsRes, actsRes, ordersRes] = await Promise.all([
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
				})
			])

			setRooms(roomsRes.data)
			setActivities(actsRes.data)
			setOrders(ordersRes.data)
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

	// Rooms & Activities real-time updates
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
	const [showSoundSettings, setShowSoundSettings] = useState(false)

	// Flatten all orders to check if there's any pending
	const allActive = Object.values(groupedOrders).flat()

	return (
		<main>
			{allActive.length === 0
				? (
					<>

						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
							<div className="text-gray-800 text-2xl">
								{'Ingen Ordrer 😊'}
							</div>
							<div className="text-gray-800 text-lg mt-2">
								{'Nye ordrer vil automatisk blive vist her'}
							</div>
						</div>
					</>
				)
				: (
					<div className="p-2 flex flex-wrap justify-start">
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

			<div className="fixed bottom-4 right-4 z-20 flex">
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
					className={`px-5 py-3 shadow-md text-lg font-medium rounded-r-md transition-colors ${
						showSoundSettings
							? 'bg-blue-500 text-white hover:bg-blue-600'
							: 'bg-white text-gray-700 hover:bg-gray-50'
					}`}
				>
					{'Lydindstillinger'}
				</button>
			</div>

			{showSoundSettings && (
				<SoundsConfig onClose={() => { setShowSoundSettings(false) }} />
			)}
		</main>
	)
}
