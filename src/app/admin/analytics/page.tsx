'use client'

import axios from 'axios'
import { type ReactElement, useState, useEffect, useMemo } from 'react'
import { FiActivity, FiBarChart2, FiClock, FiAlertTriangle, FiMonitor, FiList, FiFilter, FiMessageSquare, FiUsers } from 'react-icons/fi'

import BehaviorTab from '@/components/admin/analytics/BehaviorTab'
import FeedbackTab from '@/components/admin/analytics/FeedbackTab'
import KiosksTab from '@/components/admin/analytics/KiosksTab'
import OverviewTab from '@/components/admin/analytics/OverviewTab'
import ProblemsTab from '@/components/admin/analytics/ProblemsTab'
import SessionsTab from '@/components/admin/analytics/SessionsTab'
import TimingTab from '@/components/admin/analytics/TimingTab'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import type { ActivityType, InteractionType, KioskType, OptionType, OrderType, ProductType, RoomType } from '@/types/backendDataTypes'

type AnalyticsTab = 'overview' | 'timing' | 'behavior' | 'problems' | 'kiosks' | 'sessions' | 'feedback'
type TimeRange = '7d' | '14d' | '30d' | 'all'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
	const [timeRange, setTimeRange] = useState<TimeRange>('7d')
	const [selectedKiosk, setSelectedKiosk] = useState<string>('all')
	const [loading, setLoading] = useState(true)

	const [interactions, setInteractions] = useState<InteractionType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [orders, setOrders] = useState<OrderType[]>([])
	const [activities, setActivities] = useState<ActivityType[]>([])
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])

	useEntitySocket<InteractionType>('interaction', { setState: setInteractions })
	useEntitySocket<KioskType>('kiosk', { setState: setKiosks })
	useEntitySocket<OrderType>('order', { setState: setOrders })
	useEntitySocket<ActivityType>('activity', { setState: setActivities })
	useEntitySocket<RoomType>('room', { setState: setRooms })
	useEntitySocket<ProductType>('product', { setState: setProducts })
	useEntitySocket<OptionType>('option', { setState: setOptions })

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			setLoading(true)
			try {
				let dateParams: { from?: string, to?: string } = {}

				if (timeRange !== 'all') {
					const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30
					const from = new Date()
					from.setDate(from.getDate() - days)
					from.setHours(0, 0, 0, 0)
					dateParams = {
						from: from.toISOString(),
						to: new Date().toISOString()
					}
				}

				const [interactionsRes, kiosksRes, ordersRes, activitiesRes, roomsRes, productsRes, optionsRes] = await Promise.all([
					axios.get<InteractionType[]>(`${API_URL}/v1/interactions`, {
						params: dateParams,
						withCredentials: true
					}),
					axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true }),
					axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
						params: dateParams.from !== undefined ? { fromDate: dateParams.from, toDate: dateParams.to } : {},
						withCredentials: true
					}),
					axios.get<ActivityType[]>(`${API_URL}/v1/activities`, { withCredentials: true }),
					axios.get<RoomType[]>(`${API_URL}/v1/rooms`, { withCredentials: true }),
					axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
					axios.get<OptionType[]>(`${API_URL}/v1/options`, { withCredentials: true })
				])

				setInteractions(interactionsRes.data)
				setKiosks(kiosksRes.data)
				setOrders(ordersRes.data)
				setActivities(activitiesRes.data)
				setRooms(roomsRes.data)
				setProducts(productsRes.data)
				setOptions(optionsRes.data)
			} catch (error) {
				addError(error)
			} finally {
				setLoading(false)
			}
		}

		if (API_URL != null) {
			void fetchData()
		}
	}, [API_URL, addError, timeRange])

	const filteredInteractions = useMemo(() => {
		if (selectedKiosk === 'all') { return interactions }
		return interactions.filter(i => i.kioskId === selectedKiosk)
	}, [interactions, selectedKiosk])

	const tabs: Array<{ id: AnalyticsTab, label: string, icon: ReactElement }> = [
		{ id: 'overview', label: 'Overblik', icon: <FiBarChart2 className="w-4 h-4" /> },
		{ id: 'timing', label: 'Tidsmålinger', icon: <FiClock className="w-4 h-4" /> },
		{ id: 'behavior', label: 'Adfærd', icon: <FiUsers className="w-4 h-4" /> },
		{ id: 'problems', label: 'Problemer', icon: <FiAlertTriangle className="w-4 h-4" /> },
		{ id: 'kiosks', label: 'Kiosker', icon: <FiMonitor className="w-4 h-4" /> },
		{ id: 'sessions', label: 'Sessioner', icon: <FiList className="w-4 h-4" /> },
		{ id: 'feedback', label: 'Ris og Ros', icon: <FiMessageSquare className="w-4 h-4" /> }
	]

	return (
		<main className="flex flex-col p-4 gap-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
					<FiActivity className="w-6 h-6" />
					{'Brugeranalyse'}
				</h1>

				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<FiFilter className="w-4 h-4 text-gray-500" />
						<select
							value={selectedKiosk}
							onChange={(e) => { setSelectedKiosk(e.target.value) }}
							className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
							title="Vælg kiosk"
						>
							<option value="all">{'Alle kiosker'}</option>
							{kiosks.map(kiosk => (
								<option key={kiosk._id} value={kiosk._id}>
									{kiosk.name}
								</option>
							))}
						</select>
					</div>

					<div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
						{(['7d', '14d', '30d', 'all'] as TimeRange[]).map((range) => (
							<button
								key={range}
								onClick={() => { setTimeRange(range) }}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
									timeRange === range
										? 'bg-white text-blue-600 shadow-sm'
										: 'text-gray-600 hover:text-gray-800'
								}`}
							>
								{range === 'all' ? 'Alt' : `${range.replace('d', '')}d`}
							</button>
						))}
					</div>

					<span className="text-sm text-gray-400">
						{filteredInteractions.length}{' interaktioner'}
					</span>
				</div>
			</div>

			<div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
				{tabs.map(tab => (
					<button
						key={tab.id}
						onClick={() => { setActiveTab(tab.id) }}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
							activeTab === tab.id
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:bg-gray-100'
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
				</div>
			) : (
				<>
					{activeTab === 'overview' && (
						<OverviewTab
							interactions={filteredInteractions}
							orders={orders}
						/>
					)}
					{activeTab === 'timing' && (
						<TimingTab
							interactions={filteredInteractions}
							orders={orders}
						/>
					)}
					{activeTab === 'behavior' && (
						<BehaviorTab
							interactions={filteredInteractions}
							orders={orders}
							activities={activities}
							rooms={rooms}
							products={products}
							options={options}
						/>
					)}
					{activeTab === 'problems' && (
						<ProblemsTab
							interactions={filteredInteractions}
							kiosks={kiosks}
							orders={orders}
							activities={activities}
							rooms={rooms}
						/>
					)}
					{activeTab === 'kiosks' && (
						<KiosksTab
							interactions={filteredInteractions}
							kiosks={kiosks}
							orders={orders}
						/>
					)}
					{activeTab === 'sessions' && (
						<SessionsTab
							interactions={filteredInteractions}
							kiosks={kiosks}
							orders={orders}
							activities={activities}
							rooms={rooms}
							products={products}
							options={options}
						/>
					)}
					{activeTab === 'feedback' && (
						<FeedbackTab
							interactions={filteredInteractions}
							kiosks={kiosks}
						/>
					)}
				</>
			)}
		</main>
	)
}
