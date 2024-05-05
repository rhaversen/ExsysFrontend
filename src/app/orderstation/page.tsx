'use client'

import React, { type ReactElement, useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Room from '@/components/orderstation/Room'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [rooms, setRooms] = useState<Array<{ _id: string, name: string, description: string }>>([])

	const router = useRouter()

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return

		const fetchRooms = async () => {
			try {
				const response = await axios.get<Array<{
					_id: string
					name: string
					description: string
				}>>(API_URL + '/v1/rooms')
				setRooms(response.data)
			} catch (error) {
				console.error('Failed to fetch rooms:', error)
			}
		}

		fetchRooms()
	}, [API_URL])

	const handleRoomSelect = (roomId: string) => {
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
