'use client'

import Room from '@/components/orderstation/Room'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type RoomType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [rooms, setRooms] = useState<RoomType[]>([])

	const router = useRouter()
	const { addError } = useError()

	const fetchRooms = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/rooms', { withCredentials: true })
		const rooms = response.data as RoomType[]
		setRooms(rooms)
	}, [API_URL, setRooms])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return
		fetchRooms().catch((error) => {
			addError(error)
		})
	}, [API_URL, fetchRooms, addError])

	const handleRoomSelect = useCallback((roomId: RoomType['_id']): void => {
		router.push(`/orderstation/${roomId}`)
	}, [router])

	useInterval(fetchRooms, 1000 * 60 * 60) // Fetch rooms every hour

	return (
		<main className="flex flex-col justify-center items-center h-screen">
			<h1 className="m-10 p-0 text-center text-gray-800 text-4xl">Vælg et rum</h1>
			<div className="flex flex-wrap justify-center items-center p-20">
				{rooms.map((room) => (
					<Room
						key={room._id}
						room={room}
						onRoomSelect={handleRoomSelect}
					/>
				))}
			</div>
		</main>
	)
}
