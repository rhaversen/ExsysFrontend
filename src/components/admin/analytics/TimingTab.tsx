'use client'

import { type ReactElement, useMemo, useState } from 'react'

import type { InteractionType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	formatDuration,
	calcPercentileStats,
	analyzeSession,
	groupInteractionsBySession,
	isAutoInteraction
} from './analyticsHelpers'

interface TimingTabProps {
	interactions: InteractionType[]
	orders: OrderType[]
}

type ViewType = 'activity' | 'room' | 'order' | 'checkout'

interface PauseEvent {
	view: ViewType
	duration: number
}

export default function TimingTab ({
	interactions,
	orders
}: TimingTabProps): ReactElement {
	const sessions = useMemo(() => {
		const grouped = groupInteractionsBySession(interactions)
		const analyzed: SessionAnalysis[] = []
		grouped.forEach((sessionInteractions) => {
			const session = analyzeSession(sessionInteractions, orders)
			if (!session.isFeedbackOnly) {
				analyzed.push(session)
			}
		})
		return analyzed
	}, [interactions, orders])

	const timeToCheckout = useMemo(() => {
		const times = sessions
			.filter(s => s.hasCheckoutComplete)
			.map(s => s.duration)
		return calcPercentileStats(times)
	}, [sessions])

	const timeToFirstAction = useMemo(() => {
		const validSessions = sessions.filter(s => {
			if (s.hasTimeout) { return false }
			if (s.timeToFirstAction === null) { return false }

			const manualInteractions = s.interactions.filter(i => isAutoInteraction(i.type) === false)
			if (manualInteractions.length === 0) { return false }

			const firstManual = manualInteractions[0]
			if (firstManual.type === 'checkout_start' && !s.hasCheckoutComplete) {
				return false
			}

			return true
		})

		const times = validSessions
			.map(s => s.timeToFirstAction)
			.filter((t): t is number => t !== null)

		return calcPercentileStats(times)
	}, [sessions])

	const decisionDuration = useMemo(() => {
		const times: number[] = []

		for (const session of sessions) {
			if (!session.hasCheckoutStart) { continue }

			const firstProductAdd = session.interactions.find(i =>
				i.type === 'product_select' || i.type === 'option_select'
			)
			const checkoutStart = session.interactions.find(i => i.type === 'checkout_start')

			if (firstProductAdd && checkoutStart) {
				const duration = new Date(checkoutStart.timestamp).getTime() - new Date(firstProductAdd.timestamp).getTime()
				if (duration > 0) {
					times.push(duration)
				}
			}
		}

		return calcPercentileStats(times)
	}, [sessions])

	const paymentDuration = useMemo(() => {
		const times: number[] = []

		for (const session of sessions) {
			if (!session.hasCheckoutComplete) { continue }

			const checkoutStart = session.interactions.find(i => i.type === 'checkout_start')
			const checkoutComplete = session.interactions.find(i => i.type === 'checkout_complete')

			if (checkoutStart && checkoutComplete) {
				const duration = new Date(checkoutComplete.timestamp).getTime() - new Date(checkoutStart.timestamp).getTime()
				if (duration > 0) {
					times.push(duration)
				}
			}
		}

		return calcPercentileStats(times)
	}, [sessions])

	const maxPause = useMemo(() => {
		const pauses = sessions
			.filter(s => s.maxIdleGap > 0)
			.map(s => s.maxIdleGap)

		return calcPercentileStats(pauses)
	}, [sessions])

	const [selectedPauseView, setSelectedPauseView] = useState<ViewType | 'all'>('all')

	const pauseEvents = useMemo(() => {
		const pauses: PauseEvent[] = []
		const PAUSE_THRESHOLD = 3000

		for (const session of sessions) {
			let currentView: ViewType = 'activity'

			for (let i = 1; i < session.interactions.length; i++) {
				const prev = session.interactions[i - 1]
				const curr = session.interactions[i]

				if (prev.type === 'nav_to_activity' || prev.type === 'nav_auto_to_activity') {
					currentView = 'activity'
				} else if (prev.type === 'nav_to_room' || prev.type === 'nav_auto_to_room') {
					currentView = 'room'
				} else if (prev.type === 'nav_to_order' || prev.type === 'nav_auto_to_order') {
					currentView = 'order'
				} else if (prev.type === 'checkout_start') {
					currentView = 'checkout'
				} else if (prev.type === 'checkout_cancel' || prev.type === 'payment_cancel' || prev.type === 'checkout_failed') {
					currentView = 'order'
				}

				const gap = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()

				if (gap >= PAUSE_THRESHOLD && isAutoInteraction(prev.type) === false && prev.type !== 'session_start') {
					pauses.push({ view: currentView, duration: gap })
				}
			}
		}

		return pauses
	}, [sessions])

	const pausesByView = useMemo(() => {
		const views: ViewType[] = ['activity', 'room', 'order', 'checkout']
		return views.map(view => {
			const viewPauses = pauseEvents.filter(p => p.view === view)
			const durations = viewPauses.map(p => p.duration)
			return {
				view,
				count: viewPauses.length,
				avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
			}
		}).filter(v => v.count > 0)
	}, [pauseEvents])

	const pauseDistribution = useMemo(() => {
		const filtered = selectedPauseView === 'all'
			? pauseEvents
			: pauseEvents.filter(p => p.view === selectedPauseView)

		const buckets = [
			{ label: '3-5s', min: 3000, max: 5000, count: 0 },
			{ label: '5-10s', min: 5000, max: 10000, count: 0 },
			{ label: '10-20s', min: 10000, max: 20000, count: 0 },
			{ label: '20-30s', min: 20000, max: 30000, count: 0 },
			{ label: '30s+', min: 30000, max: Infinity, count: 0 }
		]

		for (const pause of filtered) {
			for (const bucket of buckets) {
				if (pause.duration >= bucket.min && pause.duration < bucket.max) {
					bucket.count++
					break
				}
			}
		}

		const maxCount = Math.max(...buckets.map(b => b.count), 1)
		return buckets.map(b => ({ ...b, pct: (b.count / maxCount) * 100 }))
	}, [pauseEvents, selectedPauseView])

	const timePerView = useMemo(() => {
		const viewTimes: Record<string, number[]> = {
			activity: [],
			room: [],
			order: [],
			checkout: []
		}

		for (const session of sessions) {
			let currentView = 'welcome'
			let viewStart = session.startTime.getTime()

			for (const interaction of session.interactions) {
				const time = new Date(interaction.timestamp).getTime()
				const type = interaction.type

				let nextView = currentView
				if (type === 'nav_to_welcome' || type === 'session_start') {
					nextView = 'welcome'
				} else if (type.includes('activity') || type === 'nav_to_activity' || type === 'nav_auto_to_activity') {
					nextView = 'activity'
				} else if (type.includes('room') || type === 'nav_to_room' || type === 'nav_auto_to_room') {
					nextView = 'room'
				} else if (type === 'nav_to_order' || type === 'nav_auto_to_order' || type.includes('product') || type.includes('option') || type.includes('cart')) {
					nextView = 'order'
				} else if (type.includes('checkout') || type.includes('payment')) {
					nextView = 'checkout'
				}

				if (nextView !== currentView) {
					const duration = time - viewStart
					if (duration > 0 && currentView in viewTimes && currentView !== 'welcome') {
						viewTimes[currentView].push(duration)
					}
					currentView = nextView
					viewStart = time
				}
			}

			const finalDuration = session.endTime.getTime() - viewStart
			if (finalDuration > 0 && currentView in viewTimes && currentView !== 'welcome') {
				viewTimes[currentView].push(finalDuration)
			}
		}

		return Object.entries(viewTimes).map(([view, times]) => ({
			view,
			stats: calcPercentileStats(times)
		}))
	}, [sessions])

	const viewLabels: Record<string, string> = {
		activity: 'Aktivitetsvalg',
		room: 'Lokalevalg',
		order: 'Produktvalg',
		checkout: 'Betaling'
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Tid til checkout'}</h3>
					<p className="text-xs text-gray-500 mb-3">{'Gennemsnitlig tid fra session start til gennemført køb'}</p>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(timeToCheckout.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(timeToCheckout.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{timeToCheckout.count}</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Tid til første handling'}</h3>
					<p className="text-xs text-gray-500 mb-3">{'Tid fra session start til første manuelle handling (ekskl. checkout-afbrydere)'}</p>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(timeToFirstAction.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(timeToFirstAction.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{timeToFirstAction.count}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Beslutningsvarighed'}</h3>
					<p className="text-xs text-gray-500 mb-3">{'Fra første produkt tilføjet til checkout start'}</p>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(decisionDuration.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(decisionDuration.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{decisionDuration.count}</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Betalingsvarighed'}</h3>
					<p className="text-xs text-gray-500 mb-3">{'Fra checkout start til gennemført betaling'}</p>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(paymentDuration.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(paymentDuration.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{paymentDuration.count}</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Max pause'}</h3>
					<p className="text-xs text-gray-500 mb-3">{'Længste pause mellem handlinger i en session'}</p>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(maxPause.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(maxPause.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{maxPause.count}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Tid per visning'}</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left border-b border-gray-200">
								<th className="pb-2 pr-4">{'Visning'}</th>
								<th className="pb-2 pr-4 text-right">{'Gns.'}</th>
								<th className="pb-2 pr-4 text-right">{'Median'}</th>
								<th className="pb-2 text-right">{'Antal'}</th>
							</tr>
						</thead>
						<tbody>
							{timePerView.map(({ view, stats }) => (
								<tr key={view} className="border-b border-gray-100 last:border-b-0">
									<td className="py-2 pr-4 font-medium">{viewLabels[view] ?? view}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.avg)}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.median)}</td>
									<td className="py-2 text-right">{stats.count}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-gray-800">{'Pauser per visning'}</h3>
						<span className="text-xs text-gray-500">{'Pause = ≥3s inaktivitet'}</span>
					</div>
					{pausesByView.length > 0 ? (
						<div className="space-y-3">
							{pausesByView.map(stat => {
								const maxPauses = Math.max(...pausesByView.map(v => v.count), 1)
								const barWidth = (stat.count / maxPauses) * 100
								return (
									<div key={stat.view} className="flex items-center gap-3">
										<div className="w-28 text-sm text-gray-600 shrink-0">{viewLabels[stat.view]}</div>
										<div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
											<div
												className="absolute inset-y-0 left-0 bg-amber-500 rounded-full"
												style={{ width: `${barWidth}%` }}
											/>
											<span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
												{stat.count}{' pauser · '}{formatDuration(stat.avgDuration)}{' gns.'}
											</span>
										</div>
									</div>
								)
							})}
						</div>
					) : (
						<div className="text-gray-400 text-center py-4">{'Ingen pauser registreret'}</div>
					)}
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold text-gray-800">{'Pausefordeling'}</h3>
						<select
							value={selectedPauseView}
							onChange={(e) => { setSelectedPauseView(e.target.value as ViewType | 'all') }}
							className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
						>
							<option value="all">{'Alle visninger'}</option>
							<option value="activity">{'Aktivitetsvalg'}</option>
							<option value="room">{'Lokalevalg'}</option>
							<option value="order">{'Produktvalg'}</option>
							<option value="checkout">{'Checkout'}</option>
						</select>
					</div>
					<div className="flex items-end gap-2 h-32">
						{pauseDistribution.map(bucket => (
							<div key={bucket.label} className="flex-1 flex flex-col items-center">
								<div
									className="w-full bg-amber-400 rounded-t"
									style={{ height: `${Math.max(bucket.pct, 2)}%` }}
								/>
								<span className="text-xs text-gray-500 mt-1">{bucket.label}</span>
								<span className="text-xs font-medium text-gray-700">{bucket.count}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
