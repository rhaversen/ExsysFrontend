'use client'

import axios from 'axios'
import dayjs from 'dayjs'
import { type ReactElement, useState, useEffect, useCallback, useMemo } from 'react'
import { FiMessageSquare, FiMail, FiUser, FiCalendar, FiEye, FiEyeOff, FiRefreshCw, FiThumbsUp, FiThumbsDown, FiTrendingUp, FiTrash2 } from 'react-icons/fi'
import 'dayjs/locale/da'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useEntitySocket } from '@/hooks/CudWebsocket'
import useCUDOperations from '@/hooks/useCUDOperations'
import { formatRelativeDateLabel } from '@/lib/timeUtils'
import type { FeedbackMessageType, PatchFeedbackMessageType, PostFeedbackMessageType, FeedbackRatingType, KioskType } from '@/types/backendDataTypes'

interface RatingsByKiosk {
	kioskId: string
	kioskName: string
	positive: number
	negative: number
	total: number
	positivePercent: number
}

interface DailyRating {
	date: string
	positive: number
	negative: number
}

export default function Page (): ReactElement {
	dayjs.locale('da')

	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [feedbackList, setFeedbackList] = useState<FeedbackMessageType[]>([])
	const [feedbackRatings, setFeedbackRatings] = useState<FeedbackRatingType[]>([])
	const [kiosks, setKiosks] = useState<KioskType[]>([])
	const [loading, setLoading] = useState(true)
	const [messageFilter, setMessageFilter] = useState<'all' | 'read' | 'unread'>('unread')
	const [rightPanelView, setRightPanelView] = useState<'messages' | 'ratings'>('messages')
	const [selectedKioskFilter, setSelectedKioskFilter] = useState<string | null>(null)
	const [timePeriod, setTimePeriod] = useState<7 | 14 | 30 | 'all'>(30)

	const { updateEntityAsync, deleteEntityAsync: deleteMessageAsync } = useCUDOperations<PostFeedbackMessageType, PatchFeedbackMessageType, FeedbackMessageType>(
		'/v1/feedback/message'
	)

	const { deleteEntityAsync: deleteRatingAsync } = useCUDOperations<object, object, FeedbackRatingType>(
		'/v1/feedback/rating'
	)

	useEntitySocket<FeedbackMessageType>('feedbackMessage', { setState: setFeedbackList })
	useEntitySocket<FeedbackRatingType>('feedbackRating', { setState: setFeedbackRatings })
	useEntitySocket<KioskType>('kiosk', { setState: setKiosks })

	const fetchFeedback = useCallback(async () => {
		try {
			const response = await axios.get<FeedbackMessageType[]>(`${API_URL}/v1/feedback/message`, {
				withCredentials: true
			})
			setFeedbackList(response.data.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()))
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchFeedbackRatings = useCallback(async () => {
		try {
			const response = await axios.get<FeedbackRatingType[]>(`${API_URL}/v1/feedback/rating`, {
				withCredentials: true
			})
			setFeedbackRatings(response.data.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()))
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	const fetchKiosks = useCallback(async () => {
		try {
			const response = await axios.get<KioskType[]>(`${API_URL}/v1/kiosks`, {
				withCredentials: true
			})
			setKiosks(response.data)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	useEffect(() => {
		if (API_URL != null) {
			setLoading(true)
			Promise.all([fetchFeedback(), fetchFeedbackRatings(), fetchKiosks()])
				.then(() => {
					setLoading(false)
					return null
				})
				.catch((error) => {
					addError(error)
					setLoading(false)
				})
		}
	}, [API_URL, fetchFeedback, fetchFeedbackRatings, fetchKiosks, addError])

	const handleToggleReadStatus = async (feedbackItem: FeedbackMessageType): Promise<void> => {
		try {
			const updatedFeedbackData: PatchFeedbackMessageType = { isRead: !feedbackItem.isRead }
			await updateEntityAsync(feedbackItem._id, updatedFeedbackData)
		} catch (error) {
			addError(error)
		}
	}

	const handleDeleteMessage = async (id: string): Promise<void> => {
		if (!window.confirm('Er du sikker på, at du vil slette denne besked?')) { return }
		try {
			await deleteMessageAsync(id)
		} catch (error) {
			addError(error)
		}
	}

	const handleDeleteRating = async (id: string): Promise<void> => {
		if (!window.confirm('Er du sikker på, at du vil slette denne vurdering?')) { return }
		try {
			await deleteRatingAsync(id)
		} catch (error) {
			addError(error)
		}
	}

	const getKioskName = useCallback((kioskId: string): string => {
		const kiosk = kiosks.find(k => k._id === kioskId)
		return kiosk?.name ?? 'Ukendt kiosk'
	}, [kiosks])

	const filteredMessages = useMemo(() => {
		return feedbackList.filter(item => {
			if (messageFilter === 'all') { return true }
			if (messageFilter === 'read') { return item.isRead }
			if (messageFilter === 'unread') { return !item.isRead }
			return true
		}).sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
	}, [feedbackList, messageFilter])

	const unreadCount = useMemo(() => feedbackList.filter(f => !f.isRead).length, [feedbackList])

	const ratingStats = useMemo(() => {
		const now = dayjs()
		const filteredRatings = timePeriod === 'all'
			? feedbackRatings
			: feedbackRatings.filter(r => dayjs(r.createdAt).isAfter(now.subtract(timePeriod, 'day')))

		const total = filteredRatings.length
		const positive = filteredRatings.filter(r => r.rating === 'positive').length
		const negative = filteredRatings.filter(r => r.rating === 'negative').length
		const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0

		return { total, positive, negative, positivePercent }
	}, [feedbackRatings, timePeriod])

	const ratingsByKiosk = useMemo((): RatingsByKiosk[] => {
		const kioskMap = new Map<string, { positive: number, negative: number }>()

		feedbackRatings.forEach(rating => {
			const existing = kioskMap.get(rating.kioskId) ?? { positive: 0, negative: 0 }
			if (rating.rating === 'positive') {
				existing.positive++
			} else {
				existing.negative++
			}
			kioskMap.set(rating.kioskId, existing)
		})

		return Array.from(kioskMap.entries()).map(([kioskId, counts]) => {
			const total = counts.positive + counts.negative
			return {
				kioskId,
				kioskName: getKioskName(kioskId),
				positive: counts.positive,
				negative: counts.negative,
				total,
				positivePercent: total > 0 ? Math.round((counts.positive / total) * 100) : 0
			}
		}).sort((a, b) => b.total - a.total)
	}, [feedbackRatings, getKioskName])

	const dailyRatings = useMemo((): DailyRating[] => {
		const days: DailyRating[] = []
		const now = dayjs()

		let numDays: number
		if (timePeriod === 'all') {
			if (feedbackRatings.length === 0) {
				numDays = 30
			} else {
				const oldestRating = feedbackRatings.reduce((oldest, r) =>
					dayjs(r.createdAt).isBefore(dayjs(oldest.createdAt)) ? r : oldest
				)
				numDays = Math.max(1, now.diff(dayjs(oldestRating.createdAt), 'day') + 1)
			}
		} else {
			numDays = timePeriod
		}

		for (let i = numDays - 1; i >= 0; i--) {
			const date = now.subtract(i, 'day').format('YYYY-MM-DD')
			days.push({ date, positive: 0, negative: 0 })
		}

		feedbackRatings.forEach(rating => {
			const ratingDate = dayjs(rating.createdAt).format('YYYY-MM-DD')
			const dayEntry = days.find(d => d.date === ratingDate)
			if (dayEntry !== undefined) {
				if (rating.rating === 'positive') {
					dayEntry.positive++
				} else {
					dayEntry.negative++
				}
			}
		})

		return days
	}, [feedbackRatings, timePeriod])

	const maxDailyValue = useMemo(() => {
		return Math.max(...dailyRatings.map(d => Math.max(d.positive, d.negative)), 1)
	}, [dailyRatings])

	const filteredRatings = useMemo(() => {
		if (selectedKioskFilter === null) { return feedbackRatings }
		return feedbackRatings.filter(r => r.kioskId === selectedKioskFilter)
	}, [feedbackRatings, selectedKioskFilter])

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto p-4 md:p-6 text-black">
				<div className="text-center py-20">
					<FiRefreshCw className="text-4xl text-blue-600 animate-spin mx-auto" />
					<p className="mt-2 text-gray-600">{'Henter feedback...'}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto p-4 md:p-6 text-black">
			<header className="mb-8">
				<h1 className="text-3xl font-bold text-gray-800 flex items-center">
					<FiMessageSquare className="mr-3 text-blue-600" />
					{'Brugerfeedback'}
				</h1>
				<p className="text-gray-600 mt-1">{'Gennemse og administrer feedback fra brugere og kiosker.'}</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-gray-600">{'Tidsperiode'}</span>
						<div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
							{([7, 14, 30, 'all'] as const).map(d => (
								<button
									key={d}
									onClick={() => setTimePeriod(d)}
									className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
										timePeriod === d
											? 'bg-white text-blue-600 shadow-sm'
											: 'text-gray-600 hover:text-gray-800'
									}`}
								>
									{d === 'all' ? 'Alt' : `${d}d`}
								</button>
							))}
						</div>
					</div>

					<section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5">
						<h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
							<FiTrendingUp className="text-blue-600" />
							{'Tilfredshed'}
						</h2>

						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-gray-600">
									{timePeriod === 'all' ? 'Alle vurderinger' : `Sidste ${timePeriod} dage`}
								</span>
								<span className="text-2xl font-bold text-gray-800">{ratingStats.positivePercent}{'%'}</span>
							</div>
							<div className="h-3 bg-gray-200 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
									style={{ width: `${ratingStats.positivePercent}%` }}
								/>
							</div>
							<div className="flex justify-between mt-1 text-xs text-gray-500">
								<span className="flex items-center gap-1">
									<FiThumbsUp className="text-green-500" />
									{ratingStats.positive}
								</span>
								<span className="flex items-center gap-1">
									<FiThumbsDown className="text-red-500" />
									{ratingStats.negative}
								</span>
							</div>
							<p className="text-xs text-gray-500 mt-2">
								{ratingStats.total} {'vurderinger i alt'}
							</p>
						</div>
					</section>

					<section className="bg-white rounded-xl p-5 shadow-sm">
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							{`Sidste ${dailyRatings.length} dage`}
						</h3>
						<div className="flex items-center justify-between gap-0.5 h-24">
							{dailyRatings.map((day, idx) => {
								const positiveHeight = maxDailyValue > 0 ? (day.positive / maxDailyValue) * 50 : 0
								const negativeHeight = maxDailyValue > 0 ? (day.negative / maxDailyValue) * 50 : 0
								const isToday = idx === dailyRatings.length - 1
								const hasData = day.positive > 0 || day.negative > 0

								return (
									<div
										key={day.date}
										className="flex-1 flex flex-col items-center group relative h-full"
										title={`${dayjs(day.date).format('D. MMM')}: ${day.positive} positive, ${day.negative} negative`}
									>
										<div className="w-full h-1/2 flex flex-col justify-end">
											{day.positive > 0 && (
												<div
													className="w-full bg-green-400 rounded-t-sm transition-all group-hover:bg-green-500"
													style={{ height: `${positiveHeight}%`, minHeight: '2px' }}
												/>
											)}
										</div>
										<div className="w-full h-1/2 flex flex-col justify-start">
											{day.negative > 0 && (
												<div
													className="w-full bg-red-400 rounded-b-sm transition-all group-hover:bg-red-500"
													style={{ height: `${negativeHeight}%`, minHeight: '2px' }}
												/>
											)}
										</div>
										{!hasData && (
											<div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 rounded-sm" />
										)}
										{isToday && (
											<div className="absolute -bottom-4 text-[10px] text-gray-400 whitespace-nowrap">{'i dag'}</div>
										)}
									</div>
								)
							})}
						</div>
						<div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
							<span className="flex items-center gap-1">
								<span className="w-2 h-2 bg-green-400 rounded-sm" />
								{'Positiv'}
							</span>
							<span className="flex items-center gap-1">
								<span className="w-2 h-2 bg-red-400 rounded-sm" />
								{'Negativ'}
							</span>
						</div>
					</section>

					{ratingsByKiosk.length > 0 && (
						<section className="bg-white rounded-xl p-5 shadow-sm">
							<h3 className="text-sm font-semibold text-gray-700 mb-3">{'Pr. kiosk'}</h3>
							<div className="space-y-3">
								{ratingsByKiosk.slice(0, 5).map(kiosk => (
									<button
										key={kiosk.kioskId}
										onClick={() => {
											setSelectedKioskFilter(selectedKioskFilter === kiosk.kioskId ? null : kiosk.kioskId)
											setRightPanelView('ratings')
										}}
										className={`w-full text-left transition-all rounded-lg p-2 -mx-2 ${
											selectedKioskFilter === kiosk.kioskId
												? 'bg-blue-50 ring-1 ring-blue-200'
												: 'hover:bg-gray-50'
										}`}
									>
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-medium text-gray-700">{kiosk.kioskName}</span>
											<span className="text-sm text-gray-500">{kiosk.positivePercent}{'%'}</span>
										</div>
										<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="h-full bg-green-400 rounded-full"
												style={{ width: `${kiosk.positivePercent}%` }}
											/>
										</div>
										<div className="flex justify-between mt-1 text-xs text-gray-400">
											<span>{kiosk.positive}{' / '}{kiosk.total}</span>
										</div>
									</button>
								))}
							</div>
						</section>
					)}
				</div>

				<div className="lg:col-span-2 space-y-4">
					<div className="flex items-center gap-2 border-b border-gray-200 pb-2">
						<button
							onClick={() => setRightPanelView('messages')}
							className={`flex items-center gap-2 px-4 py-2 font-medium rounded-t-lg transition-colors ${
								rightPanelView === 'messages'
									? 'bg-white text-blue-600 border-b-2 border-blue-600 -mb-[2px]'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							<FiMail />
							{'Beskeder'}
							{unreadCount > 0 && (
								<span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
									{unreadCount}
								</span>
							)}
						</button>
						<button
							onClick={() => setRightPanelView('ratings')}
							className={`flex items-center gap-2 px-4 py-2 font-medium rounded-t-lg transition-colors ${
								rightPanelView === 'ratings'
									? 'bg-white text-blue-600 border-b-2 border-blue-600 -mb-[2px]'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							<FiThumbsUp />
							{'Vurderinger'}
							<span className="text-xs text-gray-400">{'('}{feedbackRatings.length}{')'}</span>
						</button>
					</div>

					{rightPanelView === 'messages' && (
						<section>
							<div className="flex items-center justify-end mb-4">
								<div className="flex gap-1">
									{(['unread', 'read', 'all'] as const).map(f => (
										<button
											key={f}
											onClick={() => setMessageFilter(f)}
											className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
												${messageFilter === f
											? 'bg-blue-600 text-white'
											: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										}`}
										>
											{f === 'unread' ? 'Ulæst' : f === 'read' ? 'Læst' : 'Alle'}
										</button>
									))}
								</div>
							</div>

							{filteredMessages.length === 0 ? (
								<div className="text-center py-8 bg-gray-50 rounded-lg">
									<FiMail className="text-4xl text-gray-300 mx-auto mb-2" />
									<p className="text-gray-500">
										{messageFilter === 'unread' ? 'Ingen ulæste beskeder' : messageFilter === 'read' ? 'Ingen læste beskeder' : 'Ingen beskeder endnu'}
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{filteredMessages.map(item => (
										<div
											key={item._id}
											className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
												item.isRead ? 'border-gray-300 opacity-75' : 'border-blue-500'
											}`}
										>
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
														{item.name != null && (
															<span className="flex items-center gap-1 font-medium text-gray-700">
																<FiUser className="text-gray-400" />
																{item.name}
															</span>
														)}
														<span className="flex items-center gap-1">
															<FiCalendar className="text-gray-400" />
															{formatRelativeDateLabel(item.createdAt)}
														</span>
													</div>
													<p className="text-gray-800 whitespace-pre-wrap">{item.message}</p>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<button
														onClick={async () => await handleToggleReadStatus(item)}
														className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
															item.isRead
																? 'text-gray-500 bg-gray-100 hover:bg-blue-50 hover:text-blue-600'
																: 'text-blue-600 bg-blue-50 hover:bg-gray-100 hover:text-gray-600'
														}`}
													>
														{item.isRead ? (
															<FiEyeOff className="w-4 h-4" />
														) : (
															<FiEye className="w-4 h-4" />
														)}
														<span className="hidden sm:inline">
															{item.isRead ? 'Marker ulæst' : 'Marker læst'}
														</span>
													</button>
													<button
														onClick={async () => await handleDeleteMessage(item._id)}
														className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors"
													>
														<FiTrash2 className="w-4 h-4" />
														<span className="hidden sm:inline">{'Slet'}</span>
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</section>
					)}

					{rightPanelView === 'ratings' && (
						<section>
							{selectedKioskFilter !== null && (
								<div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
									<span>{'Filtreret på:'}</span>
									<span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
										{getKioskName(selectedKioskFilter)}
									</span>
									<button
										onClick={() => setSelectedKioskFilter(null)}
										className="text-gray-400 hover:text-gray-600"
									>
										{'× Ryd filter'}
									</button>
								</div>
							)}

							{filteredRatings.length === 0 ? (
								<div className="text-center py-8 bg-gray-50 rounded-lg">
									<FiThumbsUp className="text-4xl text-gray-300 mx-auto mb-2" />
									<p className="text-gray-500">{'Ingen vurderinger endnu'}</p>
								</div>
							) : (
								<>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{filteredRatings.slice(0, 50).map(item => (
											<div
												key={item._id}
												className={`bg-white rounded-lg p-3 border-l-4 shadow-sm ${
													item.rating === 'positive' ? 'border-green-400' : 'border-red-400'
												}`}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														{item.rating === 'positive' ? (
															<FiThumbsUp className="text-green-500" />
														) : (
															<FiThumbsDown className="text-red-500" />
														)}
														<span className="text-sm font-medium text-gray-700">{getKioskName(item.kioskId)}</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="text-xs text-gray-400">{formatRelativeDateLabel(item.createdAt)}</span>
														<button
															onClick={async () => await handleDeleteRating(item._id)}
															title="Slet vurdering"
															className="p-1.5 rounded-full transition-colors text-gray-400 hover:bg-red-50 hover:text-red-500"
														>
															<FiTrash2 className="w-3.5 h-3.5" />
														</button>
													</div>
												</div>
											</div>
										))}
									</div>

									{filteredRatings.length > 50 && (
										<p className="text-center text-sm text-gray-400 mt-4">
											{'Viser de første 50 af '}{filteredRatings.length}{' vurderinger'}
										</p>
									)}
								</>
							)}
						</section>
					)}
				</div>
			</div>
		</div>
	)
}
