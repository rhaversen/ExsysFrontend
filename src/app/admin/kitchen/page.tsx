'use client'

import RoomCol from '@/components/admin/kitchen/RoomCol'
import SoundsConfig from '@/components/admin/kitchen/SoundsConfig'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSound } from '@/contexts/SoundProvider'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { LoadingImage } from '@/lib/images'
import { type ActivityType, type OrderType, type RoomType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'
import axios from 'axios'
import Image from 'next/image'
import React, { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useInterval } from 'react-use'
import { io, type Socket } from 'socket.io-client'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { addError } = useError()
	const {
		isMuted,
		setIsMuted
	} = useSound()

	const [roomOrders, setRoomOrders] = useState<Record<string, OrderType[]>>({})
	const [rawOrders, setRawOrders] = useState<OrderType[]>([])

	const [rooms, setRooms] = useState<RoomType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])

	// Mapping activity id to activity name
	const activityMap = useMemo(() => {
		return activities.reduce<Record<string, string>>((acc, act) => {
			acc[act._id] = act.name
			return acc
		}, {})
	}, [activities])

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

	const [showSoundSettings, setShowSoundSettings] = useState(false)

	// Combined fetch function for all initial data
	const fetchAllData = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date()
			fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date()
			toDate.setHours(24, 0, 0, 0)

			const [roomsResponse, activitiesResponse, ordersResponse] = await Promise.all([
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

			setRooms(roomsResponse.data)
			setActivities(activitiesResponse.data)
			setRawOrders(ordersResponse.data)
		} catch (error: any) {
			addError(error)
		}
	}, [API_URL, addError])

	const getRoomNameFromOrder = useCallback((order: OrderType): string => {
		const room = rooms.find(r => r._id === order.roomId)
		return room?.name ?? 'no-room'
	}, [rooms])

	const groupOrdersByRoomName = useCallback((orders: OrderType[]): Record<string, OrderType[]> => {
		return orders.reduce<Record<string, OrderType[]>>((acc, order) => {
			const roomName = getRoomNameFromOrder(order)
			if (acc[roomName] === undefined) {
				acc[roomName] = []
			}
			acc[roomName].push(order)
			return acc
		}, {})
	}, [getRoomNameFromOrder])

	// Process orders whenever raw orders or rooms change
	useEffect(() => {
		const groupedOrders = groupOrdersByRoomName(rawOrders)
		setRoomOrders(groupedOrders)
	}, [rawOrders, groupOrdersByRoomName])

	const handleNewOrder = useCallback(
		(order: OrderType) => {
			try {
				setRawOrders(prevOrders => [...prevOrders, order])
			} catch (error: any) {
				addError(error)
			}
		},
		[addError]
	)

	const handleUpdatedOrders = useCallback((updatedOrders: UpdatedOrderType[]) => {
		try {
			setRawOrders(prevOrders => {
				return prevOrders.map(order => {
					const updatedOrder = updatedOrders.find(uo => uo._id === order._id)
					if (updatedOrder !== undefined) {
						return {
							...order,
							status: updatedOrder.status
						}
					}
					return order
				})
			})
		} catch (error: any) {
			addError(error)
		}
	}, [addError])

	// Fetch data and orders on component mount
	useEffect(() => {
		fetchAllData().catch(addError)
	}, [addError, fetchAllData])

	// Listen for new orders
	useEffect(() => {
		if (socket !== null) {
			socket.on('orderCreated', (order: OrderType) => {
				handleNewOrder(order)
			})

			// Cleanup the listener when order or socket changes
			return () => {
				socket.off('orderCreated', handleNewOrder)
			}
		}
	}, [socket, addError, handleNewOrder])

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

	// Refresh data every hour
	useInterval(() => {
		fetchAllData().catch(addError)
	}, 1000 * 60 * 60) // Every hour

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

	// Rooms
	useEntitySocketListeners<RoomType>(
		socket,
		'room',
		CreateAddHandler<RoomType>(setRooms),
		CreateUpdateHandler<RoomType>(setRooms),
		CreateDeleteHandler<RoomType>(setRooms)
	)

	// Activities
	useEntitySocketListeners<ActivityType>(
		socket,
		'activity',
		CreateAddHandler<ActivityType>(setActivities),
		CreateUpdateHandler<ActivityType>(setActivities),
		CreateDeleteHandler<ActivityType>(setActivities)
	)

	return (
		<main>
			{Object.values(roomOrders).flat().filter(order => order.status !== 'delivered').length === 0
				? (
					<>
						<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">
							{'Ingen Ordrer '}&#128522;{'\r'}
						</p>
						<div
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
							<Image
								src={LoadingImage.src}
								alt={LoadingImage.alt}
								priority
								draggable="false"
								width={100}
								height={100}
							/>
						</div>
						<div className="fixed bottom-4 right-4 z-20 flex">
							<button
								type="button"
								onClick={() => { setIsMuted(!isMuted) }}
								className="px-4 py-3 bg-white shadow-md text-gray-700 rounded-l-md hover:bg-gray-50 border-r border-gray-200 text-xl"
								title={isMuted ? 'Slå lyd til' : 'Slå lyd fra' }
							>
								<span>{isMuted ? '🔇' : '🔊'}</span>
							</button>
							<button
								type="button"
								onClick={() => { setShowSoundSettings(!showSoundSettings) }}
								className={`px-5 py-3 shadow-md text-lg font-medium rounded-r-md transition-colors
									${showSoundSettings
						? 'bg-blue-500 text-white hover:bg-blue-600'
						: 'bg-white text-gray-700 hover:bg-gray-50'
					}`}
							>
								{'Lydindstillinger'}
							</button>
						</div>
					</>
				)
				: (
					<>
						<div className="p-2 flex flex-wrap justify-start">
							{roomOrders['no-room']?.filter(order => order.status !== 'delivered')?.length > 0 && (
								// Render a column for orders without a room
								<RoomCol
									key="no-room"
									room={{
										_id: 'no-room',
										name: 'Ukendt Spisested',
										description: 'Aktivitet har intet spisested tildelt',
										createdAt: '',
										updatedAt: ''
									}}
									orders={roomOrders['no-room']?.filter(order => order.status !== 'delivered') ?? []}
									onUpdatedOrders={handleUpdatedOrders}
									activityMap={activityMap}
								/>
							)}
							{rooms
								// Filter out rooms without pending orders
								.filter(
									room =>
										roomOrders[room.name]?.filter(order => order.status !== 'delivered').length > 0
								)
								.sort((a, b) => {
									const aOrders = roomOrders[a.name]?.filter(order => order.status !== 'delivered') ?? []
									const bOrders = roomOrders[b.name]?.filter(order => order.status !== 'delivered') ?? []
									const aEarliest = Math.min(...aOrders.map(order => new Date(order.updatedAt).getTime()))
									const bEarliest = Math.min(...bOrders.map(order => new Date(order.updatedAt).getTime()))
									return aEarliest - bEarliest
								})
								.map(room => (
									<RoomCol
										key={room._id}
										room={room}
										orders={roomOrders[room.name]?.filter(order => order.status !== 'delivered') ?? []}
										onUpdatedOrders={handleUpdatedOrders}
										activityMap={activityMap}
									/>
								))}
						</div>
						<div className="fixed bottom-4 right-4 z-20 flex">
							<button
								type="button"
								onClick={() => { setIsMuted(!isMuted) }}
								className="px-4 py-3 bg-white shadow-md text-gray-700 rounded-l-md hover:bg-gray-50 border-r border-gray-200 text-xl"
								title={isMuted ? 'Slå lyd til' : 'Slå lyd fra' }
							>
								<span>{isMuted ? '🔇' : '🔊'}</span>
							</button>
							<button
								type="button"
								onClick={() => { setShowSoundSettings(!showSoundSettings) }}
								className={`px-5 py-3 shadow-md text-lg font-medium rounded-r-md transition-colors
									${showSoundSettings
						? 'bg-blue-500 text-white hover:bg-blue-600'
						: 'bg-white text-gray-700 hover:bg-gray-50'
					}`}
							>
								{'Lydindstillinger'}
							</button>
						</div>
					</>
				)}
			{showSoundSettings && (
				<SoundsConfig onClose={() => { setShowSoundSettings(false) }} />
			)}
		</main>
	)
}
