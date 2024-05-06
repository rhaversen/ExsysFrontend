'use client'

import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Room from '@/components/orderstation/Room'
import { type RoomType } from '@/lib/backendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [rooms, setRooms] = useState<RoomType[]>([])

	const router = useRouter()

	const fetchRooms = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/rooms')
		const rooms = response.data as RoomType[]
		setRooms(rooms)
	}, [API_URL, setRooms])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return
		fetchRooms().catch((error) => {
			console.error('Error fetching rooms:', error)
		})
	}, [API_URL, fetchRooms])

	const handleRoomSelect = (roomId: string): void => {
		router.push(`/orderstation/${roomId}`)
	}

	return (
		<main className="flex flex-col justify-center items-center h-screen">
			<h1 className="m-10 p-0 text-center text-black text-4xl">Vælg et rum</h1>
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
