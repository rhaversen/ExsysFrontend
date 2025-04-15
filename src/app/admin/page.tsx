'use client'

import { useUser } from '@/contexts/UserProvider'
import type { OrderType, ConfigsType, KioskType, ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { useCallback, useEffect, useState, type ReactElement } from 'react'
import { useConfig } from '@/contexts/ConfigProvider'
import { GiCookingPot } from 'react-icons/gi'
import { FaEdit, FaChartBar, FaStore, FaStoreSlash, FaSyncAlt } from 'react-icons/fa'
import CloseableModal from '@/components/ui/CloseableModal'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { io, type Socket } from 'socket.io-client'
import KioskStatusManager from '@/components/admin/KioskStatusManager'

export default function Page (): ReactElement | null {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { currentUser } = useUser()
	const { config } = useConfig()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [showKioskModal, setShowKioskModal] = useState(false)
	const [kioskAction, setKioskAction] = useState<'open' | 'close'>('open')
	const [showRefreshModal, setShowRefreshModal] = useState(false)
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [socket, setSocket] = useState<Socket | null>(null)

	const kioskIsOpen = config?.configs.kioskIsOpen ?? true

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

	const fetchKiosks = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true })
			setKiosks(response.data)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL])

	const fetchProducts = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true })
			setProducts(response.data)
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

	const handleForceRefresh = async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/service/force-kiosk-refresh`, {
				withCredentials: true
			})
			setShowRefreshModal(false)
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
		fetchKiosks().catch(() => { setKiosks([]) })
		fetchProducts().catch(() => { setProducts([]) })
	}, [API_URL, fetchPendingOrders, fetchTotalOrdersToday, fetchKiosks, fetchProducts])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '' || (process.env.NEXT_PUBLIC_WS_URL == null)) return
		const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL)
		setSocket(socketInstance)
		return () => { socketInstance.disconnect() }
	}, [API_URL])

	// Listen for kiosk and product CUD events
	useEntitySocketListeners<KioskType>(
		socket,
		'kiosk',
		kiosk => { setKiosks(prev => [...prev, kiosk]) },
		kiosk => { setKiosks(prev => prev.map(k => k._id === kiosk._id ? kiosk : k)) },
		id => { setKiosks(prev => prev.filter(k => k._id !== id)) }
	)
	useEntitySocketListeners<ProductType>(
		socket,
		'product',
		product => { setProducts(prev => [...prev, product]) },
		product => { setProducts(prev => prev.map(p => p._id === product._id ? product : p)) },
		id => { setProducts(prev => prev.filter(p => p._id !== id)) }
	)

	if (!hasMounted) return null

	return (
		<main className="p-8 flex flex-col items-center">
			<div className="bg-white shadow-lg rounded-lg flex flex-col gap-8 p-6 w-full max-w-2xl">

				{/* Welcome */}
				<p className="text-3xl font-bold text-gray-800">
					{'Velkommen '}{((currentUser?.name) != null) ? currentUser.name : 'Gæst'}{'!'}
				</p>

				{/* Statistics section */}
				<div className="grid grid-cols-2 gap-4">
					<div className="bg-blue-50 p-4 rounded-lg">
						<p className="text-sm text-blue-600 mb-1">{'Antal bestillinger i dag'}</p>
						<p className="text-2xl font-bold text-blue-700">{totalOrdersToday}</p>
					</div>
					<div className="bg-amber-50 p-4 rounded-lg">
						<p className="text-sm text-amber-600 mb-1">{'Afventende bestillinger'}</p>
						<p className="text-2xl font-bold text-amber-700">{pendingOrders}</p>
					</div>
				</div>

				{/* Task selection buttons */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
					<Link href="/admin/kitchen" className="w-full">
						<div className="flex flex-col items-center justify-center py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
							<GiCookingPot className="w-12 h-12 mb-3"/>
							<span className="text-lg font-medium">{'Se bestillinger'}</span>
						</div>
					</Link>
					<Link href="/admin/modify" className="w-full">
						<div className="flex flex-col items-center justify-center py-6 bg-green-500 hover:bg-green-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
							<FaEdit className="w-12 h-12 mb-3"/>
							<span className="text-lg font-medium">{'Rediger opsætning'}</span>
						</div>
					</Link>
					<Link href="/admin/statistics" className="w-full">
						<div className="flex flex-col items-center justify-center py-6 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition transform hover:scale-105 shadow-md h-full">
							<FaChartBar className="w-12 h-12 mb-3"/>
							<span className="text-lg font-medium">{'Se statistik'}</span>
						</div>
					</Link>
				</div>

				{/* Kiosk Refresh */}
				<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
					<FaSyncAlt className="text-blue-500 text-2xl" />
					<div className="flex flex-col flex-grow px-4">
						<span className="text-lg text-gray-800">
							{'Genindlæs kiosker'}
						</span>
						<div className="text-sm text-gray-600">
							{'Tvinger alle kiosker til at genindlæse deres interface'}
						</div>
					</div>
					<button
						type="button"
						onClick={() => { setShowRefreshModal(true) }}
						className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md"
					>
						{'Genindlæs'}
					</button>
				</div>

				{/* Kiosk Open/Close */}
				<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
					{kioskIsOpen
						? <FaStore className="text-green-500 text-2xl" />
						: <FaStoreSlash className="text-red-500 text-2xl" />
					}
					<div className="flex flex-col flex-grow px-4">
						<span className="text-lg text-gray-800">
							{'Kioskerne er '}
							{kioskIsOpen
								? <span className="text-green-600 font-bold">{'åbne'}</span>
								: <span className="text-red-600 font-bold">{'lukkede'}</span>
							}
							{' for bestillinger'}
						</span>
						<div className="text-sm text-gray-600">
							{kioskIsOpen
								? 'Kunder kan bruge kioskerne til at bestille mad'
								: 'Kunder kan ikke bestille mad via kioskerne'
							}
						</div>
					</div>
					<button
						type="button"
						onClick={openKioskConfirmation}
						className={`px-5 py-2 rounded-full text-white transition-all shadow-md ${
							kioskIsOpen
								? 'bg-red-500 hover:bg-red-600'
								: 'bg-green-500 hover:bg-green-600'
						}`}
					>
						{kioskIsOpen ? 'Luk kioskerne' : 'Åben kioskerne'}
					</button>
				</div>

				{/* Kiosk Status */}
				<KioskStatusManager
					kiosks={kiosks}
					products={products}
				/>
			</div>

			{showRefreshModal && (
				<CloseableModal
					canClose={true}
					canComplete={true}
					onClose={() => { setShowRefreshModal(false) }}
					onComplete={() => { void handleForceRefresh() }}
				>
					<div className="text-center flex flex-col gap-4">
						<FaSyncAlt className="text-blue-500 text-4xl mx-auto" />
						<h2 className="text-2xl font-bold text-gray-800">
							{'Genindlæs alle kiosker?'}
						</h2>
						<div className="text-left">
							<p className="text-gray-700 text-lg font-medium">
								{'Dette vil tvinge alle kiosker til at genindlæse deres interface.'}
							</p>
							<p className="text-gray-600">
								{'Genindlæsningen sker øjeblikkeligt og kan ikke fortrydes.'}
							</p>
							<p className="text-gray-600">
								{'Iganværende bestillinger vil blive nulstillet, men færdige bestillinger vil ikke blive påvirket.'}
							</p>
							<p className="text-gray-600">
								{'Brug kun denne funktion hvis det er nødvendigt, eller uden for åbningstiderne.'}
							</p>
						</div>
						<div className="flex gap-4 justify-center pt-2">
							<button
								type="button"
								onClick={() => { setShowRefreshModal(false) }}
								className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800"
							>
								{'Annuller'}
							</button>
							<button
								type="button"
								onClick={() => { void handleForceRefresh() }}
								className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
							>
								{'Genindlæs'}
							</button>
						</div>
					</div>
				</CloseableModal>
			)}

			{showKioskModal && (
				<CloseableModal
					canClose={true}
					canComplete={true}
					onClose={() => { setShowKioskModal(false) }}
					onComplete={() => { void handleToggleKiosk() }}
				>
					<div className="text-center flex flex-col gap-4">
						{kioskAction === 'open'
							? <FaStore className="text-green-500 text-4xl mx-auto" />
							: <FaStoreSlash className="text-red-500 text-4xl mx-auto" />
						}
						<h2 className="text-2xl font-bold text-gray-800">
							{kioskAction === 'open' ? 'Åben kioskerne?' : 'Luk kioskerne manuelt?'}
						</h2>
						<div className="text-left">
							{kioskAction === 'open'
								? (
									<>
										<p className="text-gray-700 text-lg font-medium">
											{'Kioskerne vil igen automatisk åbne og lukke efter køkkenets åbningstider.'}
										</p>
										<p className="text-gray-600">
											{'Køkkenets åbningstider bestemmes automatisk efter produkternes bestillingsvinduer.'}
										</p>
									</>
								)
								: (
									<>
										<p className="text-gray-700 text-lg font-medium">
											{'Kioskerne lukkes for nye bestillinger, indtil de åbnes igen manuelt.'}
										</p>
										<p className="text-gray-600">
											{'Kioskerne forbliver logget ind og funktionelle, så de nemt kan åbnes igen.'}
										</p>
										<p className="text-gray-600">
											{'Luk kun kioskerne ved særlige situationer, f.eks. ved tekniske problemer eller hvis køkkenet må lukke akut.'}
										</p>
										<p className="text-gray-600">
											{'Ved normal drift vil kioskerne automatisk åbne og lukke ifølge køkkenets åbningstider.'}
										</p>
										<p className="text-gray-600">
											{'Køkkenets åbningstider bestemmes automatisk efter produkternes bestillingsvinduer.'}
										</p>
									</>
								)}
						</div>
						<div className="flex gap-4 justify-center pt-2">
							<button
								type="button"
								onClick={() => { setShowKioskModal(false) }}
								className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800"
							>
								{'Annuller'}
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
