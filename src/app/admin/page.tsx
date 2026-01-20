'use client'

import axios from 'axios'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useCallback, useEffect, useState, useMemo, useRef, type ReactElement } from 'react'
import { FiMessageSquare, FiThumbsUp, FiThumbsDown, FiChevronRight, FiChevronDown, FiMonitor, FiCalendar, FiClock, FiShoppingBag, FiTerminal } from 'react-icons/fi'
import { GiCookingPot } from 'react-icons/gi'
import 'dayjs/locale/da'

import AllKiosksStatusManager from '@/components/admin/AllKiosksStatusManager'
import ConfigWeekdaysEditor from '@/components/admin/ConfigWeekdaysEditor'
import EntitiesTimelineOverview from '@/components/admin/EntitiesTimelineOverview'
import KioskStatusManager from '@/components/admin/KioskStatusManager'
import { useConfig } from '@/contexts/ConfigProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import type { OrderType, KioskType, ProductType, SessionType, FeedbackMessageType, FeedbackRatingType } from '@/types/backendDataTypes'

export default function Page (): ReactElement | null {
	dayjs.locale('da')

	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const { config } = useConfig()
	const { currentUser } = useUser()
	const [pendingOrders, setPendingOrders] = useState<number>(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState<number>(0)
	const [hasMounted, setHasMounted] = useState(false)
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [products, setProducts] = useState<ProductType[]>([])
	const [sessions, setSessions] = useState<SessionType[]>([])
	const [orders, setOrders] = useState<OrderType[]>([])
	const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessageType[]>([])
	const [feedbackRatings, setFeedbackRatings] = useState<FeedbackRatingType[]>([])
	const resetAllKiosksRef = useRef<(() => void) | null>(null)

	const calculateOrderStats = useCallback((ordersList: OrderType[]): void => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const todayOrders = ordersList.filter(order => {
			const orderDate = new Date(order.createdAt)
			return orderDate >= today && orderDate < tomorrow && order.paymentStatus === 'successful'
		})

		const pendingOrders = todayOrders.filter(order =>
			order.status === 'pending' || order.status === 'confirmed'
		)
		setPendingOrders(pendingOrders.length)

		const allValidOrders = todayOrders.filter(order =>
			order.status === 'pending' || order.status === 'confirmed' || order.status === 'delivered'
		)
		setTotalOrdersToday(allValidOrders.length)
	}, [])

	useEffect(() => {
		calculateOrderStats(orders)
	}, [orders, calculateOrderStats])

	const fetchData = useCallback(async (): Promise<void> => {
		try {
			const fromDate = new Date(); fromDate.setHours(0, 0, 0, 0)
			const toDate = new Date(); toDate.setHours(24, 0, 0, 0)

			const [kiosksRes, productsRes, sessionsRes, ordersRes, feedbackRes, ratingsRes] = await Promise.all([
				axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, { withCredentials: true }),
				axios.get<ProductType[]>(`${API_URL}/v1/products`, { withCredentials: true }),
				axios.get<SessionType[]>(`${API_URL}/v1/sessions`, { withCredentials: true }),
				axios.get<OrderType[]>(`${API_URL}/v1/orders`, {
					params: { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() },
					withCredentials: true
				}),
				axios.get<FeedbackMessageType[]>(`${API_URL}/v1/feedback/message`, { withCredentials: true }),
				axios.get<FeedbackRatingType[]>(`${API_URL}/v1/feedback/rating`, { withCredentials: true })
			])

			setKiosks(kiosksRes.data)
			setProducts(productsRes.data)
			setSessions(sessionsRes.data)
			setOrders(ordersRes.data)
			setFeedbackMessages(feedbackRes.data)
			setFeedbackRatings(ratingsRes.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	useEffect(() => {
		setHasMounted(true)
		fetchData().catch(() => {
			setPendingOrders(0)
			setTotalOrdersToday(0)
			setKiosks([])
			setProducts([])
			setSessions([])
			setOrders([])
			setFeedbackMessages([])
			setFeedbackRatings([])
		})
	}, [fetchData])

	useEntitySocket<KioskType>('kiosk', { setState: setKiosks })
	useEntitySocket<ProductType>('product', { setState: setProducts })
	useEntitySocket<SessionType>('session', { setState: setSessions })
	useEntitySocket<OrderType>('order', { setState: setOrders })
	useEntitySocket<FeedbackMessageType>('feedbackMessage', { setState: setFeedbackMessages })
	useEntitySocket<FeedbackRatingType>('feedbackRating', { setState: setFeedbackRatings })

	const unreadFeedbackCount = feedbackMessages.filter(f => !f.isRead).length
	const recentUnreadMessages = useMemo(() => {
		return feedbackMessages
			.filter(f => !f.isRead)
			.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
			.slice(0, 3)
	}, [feedbackMessages])

	const todayRatings = useMemo(() => {
		const today = dayjs().startOf('day')
		const todayRatings = feedbackRatings.filter(r => dayjs(r.createdAt).isAfter(today))
		const positive = todayRatings.filter(r => r.rating === 'positive').length
		const negative = todayRatings.filter(r => r.rating === 'negative').length
		const total = positive + negative
		const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0
		return { positive, negative, total, positivePercent }
	}, [feedbackRatings])

	const allTimeRatings = useMemo(() => {
		const positive = feedbackRatings.filter(r => r.rating === 'positive').length
		const negative = feedbackRatings.filter(r => r.rating === 'negative').length
		const total = positive + negative
		const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0
		return { positive, negative, total, positivePercent }
	}, [feedbackRatings])

	if (!hasMounted) { return null }

	return (
		<main className="flex flex-col items-center relative">
			{/* Dev tools - absolutely positioned top left */}
			<details className="group text-xs text-gray-400 absolute top-2 left-4 z-20">
				<summary className="cursor-pointer hover:text-gray-500 flex items-center gap-1 list-none">
					<FiChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
					{'Udviklerværktøjer'}
				</summary>
				<div className="absolute top-full left-0 mt-2 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
					<Link
						href="/admin/debug"
						className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors text-sm whitespace-nowrap"
					>
						<FiTerminal className="w-4 h-4" />
						{'Betalingssimulator'}
					</Link>
				</div>
			</details>

			<div className="flex flex-col pt-4 gap-6 w-full px-4">
				{/* Header row */}
				<div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
					{/* Spacer for left side */}
					<div className="hidden sm:block flex-1" />
					{/* Welcome + Stats centered */}
					<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
						<h1 className="text-xl font-bold text-gray-800">
							{'Velkommen, '}{currentUser?.name ?? 'Gæst'}{'!'}
						</h1>
						<div className="flex items-center gap-3 text-sm">
							<span className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
								<FiShoppingBag className="w-4 h-4 text-blue-600" />
								<span className="font-semibold text-gray-800">{totalOrdersToday}</span>
								<span className="text-gray-400">{'bestillinger i dag'}</span>
							</span>
							{unreadFeedbackCount > 0 && (
								<Link
									href="/admin/feedback"
									className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-1.5 shadow-sm border border-red-200 hover:bg-red-100 transition"
								>
									<FiMessageSquare className="w-4 h-4 text-red-600" />
									<span className="font-semibold text-red-700">{unreadFeedbackCount}</span>
									<span className="text-red-500">{'ulæste feedback'}</span>
								</Link>
							)}
						</div>
					</div>
					{/* Kitchen button on the right */}
					<div className="sm:flex-1 flex justify-center sm:justify-end">
						<Link
							href="/admin/kitchen"
							className="flex items-center gap-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg group"
						>
							<GiCookingPot className="w-6 h-6" />
							<span className="font-semibold text-lg">{'Køkken'}</span>
							{pendingOrders > 0 && (
								<span className="bg-white text-blue-600 text-sm font-bold px-2 py-0.5 rounded-full min-w-6 text-center">
									{pendingOrders}
								</span>
							)}
							<FiChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</Link>
					</div>
				</div>

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
					{/* Left Column */}
					<div className="flex flex-col gap-6">
						{/* Åbningstider + Feedback side by side */}
						<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
							{/* Åbningstider */}
							<section className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
								<div className="flex items-center gap-3 mb-4">
									<FiCalendar className="w-5 h-5 text-gray-600" />
									<h2 className="font-semibold text-gray-800">{'Åbningstider'}</h2>
								</div>
								<div className="flex-1 flex flex-col justify-center">
									<ConfigWeekdaysEditor configs={config} />
								</div>
							</section>

							{/* Feedback Overview */}
							<section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-3">
										<FiMessageSquare className="w-5 h-5 text-gray-600" />
										<h2 className="font-semibold text-gray-800">{'Feedback'}</h2>
									</div>
									<Link
										href="/admin/feedback"
										className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
									>
										{'Se alt'}
										<FiChevronRight className="w-4 h-4" />
									</Link>
								</div>

								<div className="flex-1 flex flex-col justify-center space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">{'I dag'}</span>
										<div className="flex items-center gap-3">
											<span className="flex items-center gap-1 text-sm">
												<FiThumbsUp className="w-4 h-4 text-green-500" />
												<span className="font-medium text-gray-700">{todayRatings.positive}</span>
											</span>
											<span className="flex items-center gap-1 text-sm">
												<FiThumbsDown className="w-4 h-4 text-red-500" />
												<span className="font-medium text-gray-700">{todayRatings.negative}</span>
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">{'Alt'}</span>
										<div className="flex items-center gap-3">
											<span className="flex items-center gap-1 text-sm">
												<FiThumbsUp className="w-4 h-4 text-green-500" />
												<span className="font-medium text-gray-700">{allTimeRatings.positive}</span>
											</span>
											<span className="flex items-center gap-1 text-sm">
												<FiThumbsDown className="w-4 h-4 text-red-500" />
												<span className="font-medium text-gray-700">{allTimeRatings.negative}</span>
											</span>
										</div>
									</div>

									{unreadFeedbackCount > 0
										? (
											<div className="pt-2 border-t border-gray-100">
												<p className="text-sm text-gray-600">
													<span className="font-medium text-gray-800">{unreadFeedbackCount}</span>
													{' ulæste beskeder'}
													{recentUnreadMessages[0] != null && (
														<span className="text-gray-400">
															{' fra '}
															{recentUnreadMessages[0].name != null && recentUnreadMessages[0].name.length > 0
																? recentUnreadMessages[0].name
																: 'Anonym'}
														</span>
													)}
												</p>
											</div>
										)
										: (
											<p className="text-sm text-gray-400">{'Ingen ulæste beskeder'}</p>
										)}
								</div>
							</section>
						</div>

						{/* Product Timeline */}
						<section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
							<div className="flex items-center gap-3 mb-4">
								<FiClock className="w-5 h-5 text-gray-600" />
								<h2 className="font-semibold text-gray-800">{'Produkttidslinje'}</h2>
							</div>
							<EntitiesTimelineOverview products={products} />
						</section>
					</div>

					{/* Right Column */}
					<div className="flex flex-col gap-6">
						{/* Kioskhåndtering */}
						<section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<FiMonitor className="w-5 h-5 text-gray-600" />
									<h2 className="font-semibold text-gray-800">{'Kioskhåndtering'}</h2>
								</div>
								<AllKiosksStatusManager kiosks={kiosks} products={products} onRefreshAll={() => resetAllKiosksRef.current?.()} />
							</div>

							<KioskStatusManager kiosks={kiosks} products={products} configs={config} sessions={sessions} onResetAllKiosks={(fn) => { resetAllKiosksRef.current = fn }} />
						</section>
					</div>
				</div>
			</div>
		</main>
	)
}
