'use client'

import { useUser } from '@/contexts/UserProvider'
import type { OrderType, ConfigsType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { useCallback, useEffect, useState, type ReactElement } from 'react'
import { useConfig } from '@/contexts/ConfigProvider'
import { GiCookingPot } from 'react-icons/gi'
import { FaEdit, FaChartBar, FaStore, FaStoreSlash } from 'react-icons/fa'
import CloseableModal from '@/components/ui/CloseableModal'

export default function Page (): ReactElement | null {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { currentUser } = useUser()
	const { config } = useConfig()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [showKioskModal, setShowKioskModal] = useState(false)
	const [kioskAction, setKioskAction] = useState<'open' | 'close'>('open')

	const kioskIsOpen = config?.configs.kioskIsOpen ?? false

	const fetchPendingOrders = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const response = await axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
				params: {
					fromDate: fromDate.toISOString(),
					toDate: toDate.toISOString(),
					status: 'pending,confirmed',
					paymentStatus: 'successful'
				},
				withCredentials: true
			})
			const uniqueActivities = new Set(response.data.map(order => order.activityId))
			setPendingOrders(uniqueActivities.size)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL])

	const fetchTotalOrdersToday = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const response = await axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
				params: {
					fromDate: fromDate.toISOString(),
					toDate: toDate.toISOString(),
					status: 'pending,confirmed,delivered',
					paymentStatus: 'successful'
				},
				withCredentials: true
			})
			const uniqueActivities = new Set(response.data.map(order => order.activityId))
			setTotalOrdersToday(uniqueActivities.size)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL])

	const handleToggleKiosk = async (): Promise<void> => {
		try {
			const newValue = !kioskIsOpen
			await axios.patch<ConfigsType>(
				`${API_URL}/v1/configs`,
				{ kioskIsOpen: newValue },
				{ withCredentials: true }
			)
			setShowKioskModal(false)
		} catch (error) {
			console.error(error)
		}
	}

	const openKioskConfirmation = (): void => {
		setKioskAction(kioskIsOpen ? 'close' : 'open')
		setShowKioskModal(true)
	}

	useEffect(() => {
		setHasMounted(true)
		fetchPendingOrders().catch(() => { setPendingOrders(0) })
		fetchTotalOrdersToday().catch(() => { setTotalOrdersToday(0) })
	}, [API_URL, fetchPendingOrders, fetchTotalOrdersToday])

	if (!hasMounted) return null

	return (
		<main className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
			{/* Welcome and Status Section */}
			<div className="bg-white shadow-lg rounded-lg p-8 mb-8 w-full max-w-xl">
				<p className="text-3xl font-bold text-gray-800 mb-6">
					{'Velkommen '}{((currentUser?.name) != null) ? currentUser.name : 'Gæst'}{'!'}
				</p>

				<div className="grid grid-cols-2 gap-4 mb-6">
					<div className="bg-blue-50 p-4 rounded-lg">
						<p className="text-sm text-blue-600 mb-1">{'Ordrer i dag'}</p>
						<p className="text-2xl font-bold text-blue-700">{totalOrdersToday}</p>
					</div>
					<div className="bg-amber-50 p-4 rounded-lg">
						<p className="text-sm text-amber-600 mb-1">{'Afventende ordrer'}</p>
						<p className="text-2xl font-bold text-amber-700">{pendingOrders}</p>
					</div>
				</div>

				<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
					<div className="flex items-center">
						{kioskIsOpen
							? <FaStore className="text-green-500 text-xl mr-2" />
							: <FaStoreSlash className="text-red-500 text-xl mr-2" />
						}
						<span className="text-lg text-gray-800">
							{'Kantinen er '}
							{kioskIsOpen
								? <span className="text-green-600 font-bold">{'åben'}</span>
								: <span className="text-red-600 font-bold">{'lukket'}</span>
							}
						</span>
					</div>
					<button
						type="button"
						onClick={openKioskConfirmation}
						className={`px-5 py-2 rounded-md text-white transition-all shadow-md ${
							kioskIsOpen
								? 'bg-red-500 hover:bg-red-600'
								: 'bg-green-500 hover:bg-green-600'
						}`}
					>
						{kioskIsOpen ? 'Luk kantinen' : 'Åben kantinen'}
					</button>
				</div>
			</div>

			{/* Task selection buttons with grid layout and icons */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-xl">
				<Link href="/admin/kitchen" className="w-full">
					<div className="flex flex-col items-center justify-center p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
						<GiCookingPot className="w-12 h-12 mb-3"/>
						<span className="text-lg font-medium">{'Køkken'}</span>
					</div>
				</Link>
				<Link href="/admin/modify" className="w-full">
					<div className="flex flex-col items-center justify-center p-6 bg-green-500 hover:bg-green-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
						<FaEdit className="w-12 h-12 mb-3"/>
						<span className="text-lg font-medium">{'Modificer'}</span>
					</div>
				</Link>
				<Link href="/admin/statistics" className="w-full">
					<div className="flex flex-col items-center justify-center p-6 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
						<FaChartBar className="w-12 h-12 mb-3"/>
						<span className="text-lg font-medium">{'Statistik'}</span>
					</div>
				</Link>
			</div>

			{/* Confirmation Modal */}
			{showKioskModal && (
				<CloseableModal
					canClose={true}
					canComplete={true}
					onClose={() => { setShowKioskModal(false) }}
					onComplete={() => { void handleToggleKiosk() }}
				>
					<div className="text-center">
						<div className="mb-4">
							{kioskAction === 'open'
								? <FaStore className="text-green-500 text-4xl mx-auto" />
								: <FaStoreSlash className="text-red-500 text-4xl mx-auto" />
							}
						</div>
						<h2 className="text-2xl font-bold mb-4">
							{kioskAction === 'open' ? 'Åben kantinen?' : 'Luk kantinen?'}
						</h2>
						<p className="text-gray-600 mb-6">
							{kioskAction === 'open'
								? 'Er du sikker på, at du vil åbne kantinen for bestillinger?'
								: 'Er du sikker på, at du vil lukke kantinen for nye bestillinger?'
							}
						</p>
						<div className="flex gap-4 justify-center">
							<button
								type="button"
								onClick={() => { setShowKioskModal(false) }}
								className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition"
							>
								{'Annuller\r'}
							</button>
							<button
								type="button"
								onClick={() => { void handleToggleKiosk() }}
								className={`px-5 py-2 text-white rounded-md transition ${
									kioskAction === 'open'
										? 'bg-green-500 hover:bg-green-600'
										: 'bg-red-500 hover:bg-red-600'
								}`}
							>
								{kioskAction === 'open' ? 'Åben' : 'Luk'}
							</button>
						</div>
					</div>
				</CloseableModal>
			)}
		</main>
	)
}
