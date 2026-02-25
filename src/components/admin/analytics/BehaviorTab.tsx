'use client'

import { type ReactElement, useMemo } from 'react'

import type { ActivityType, InteractionType, OptionType, OrderType, ProductType, RoomType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	analyzeSession,
	groupInteractionsBySession,
	roundPercent,
	formatDuration
} from './analyticsHelpers'

interface BehaviorTabProps {
	interactions: InteractionType[]
	orders: OrderType[]
	activities: ActivityType[]
	rooms: RoomType[]
	products: ProductType[]
	options: OptionType[]
}

type ViewType = 'welcome' | 'activity' | 'room' | 'order' | 'checkout' | 'confirmation'

type FlowEntry = {
	from: ViewType
	to: ViewType
	count: number
	sessions: Array<{ sessionId: string, kioskId: string, time: Date, outcome: 'completed' | 'abandoned' | 'timeout' | 'other' }>
}

export default function BehaviorTab ({
	interactions,
	orders,
	activities,
	rooms,
	products,
	options
}: BehaviorTabProps): ReactElement {
	const sessions = useMemo(() => {
		const grouped = groupInteractionsBySession(interactions)
		const analyzed: SessionAnalysis[] = []
		grouped.forEach((sessionInteractions) => {
			const session = analyzeSession(sessionInteractions, orders)
			if (!session.isFeedbackOnly) {
				analyzed.push(session)
			}
		})
		return analyzed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
	}, [interactions, orders])

	const cartBuildingPatterns = useMemo(() => {
		const patternCounts = new Map<string, number>()

		for (const session of sessions) {
			const itemActions = new Map<string, { catalogClicks: number, basketIncreases: number }>()

			for (const interaction of session.interactions) {
				const itemId = interaction.metadata?.productId ?? interaction.metadata?.optionId
				if (itemId == null) { continue }

				if (interaction.type === 'product_select' || interaction.type === 'option_select') {
					const entry = itemActions.get(itemId) ?? { catalogClicks: 0, basketIncreases: 0 }
					entry.catalogClicks++
					itemActions.set(itemId, entry)
				} else if (interaction.type === 'product_increase' || interaction.type === 'option_increase') {
					const entry = itemActions.get(itemId) ?? { catalogClicks: 0, basketIncreases: 0 }
					entry.basketIncreases++
					itemActions.set(itemId, entry)
				}
			}

			for (const { catalogClicks, basketIncreases } of itemActions.values()) {
				const label = `${catalogClicks} katalog, ${basketIncreases} kurv`
				patternCounts.set(label, (patternCounts.get(label) ?? 0) + 1)
			}
		}

		const total = Array.from(patternCounts.values()).reduce((a, b) => a + b, 0)
		return Array.from(patternCounts.entries())
			.map(([label, count]) => ({ label, count, pct: total > 0 ? roundPercent((count / total) * 100) : 0 }))
			.sort((a, b) => b.count - a.count)
	}, [sessions])

	const regretSignals = useMemo(() => {
		let sessionsWithRegret = 0
		let totalRegrets = 0

		for (const session of sessions) {
			const productIds = new Set<string>()
			let regretCount = 0

			for (const interaction of session.interactions) {
				if (interaction.type === 'product_select' || interaction.type === 'product_increase') {
					productIds.add(interaction.metadata?.productId ?? '')
				}
				if (interaction.type === 'product_decrease') {
					const pid = interaction.metadata?.productId ?? ''
					if (productIds.has(pid)) {
						regretCount++
					}
				}
			}

			if (regretCount > 0) {
				sessionsWithRegret++
				totalRegrets += regretCount
			}
		}

		return {
			sessionsWithRegret,
			totalRegrets,
			pct: sessions.length > 0 ? roundPercent((sessionsWithRegret / sessions.length) * 100) : 0
		}
	}, [sessions])

	const checkoutAbandoners = useMemo(() => {
		const abandoners = sessions.filter(s =>
			s.hasCheckoutStart && !s.hasCheckoutComplete && !s.hasTimeout
		)

		const byStage: Record<string, number> = {
			'Valg af betalingsmetode': 0,
			'Under betaling': 0,
			'Ukendt': 0
		}

		for (const session of abandoners) {
			const hasPaymentSelect = session.interactions.some(i =>
				['payment_select_card', 'payment_select_mobilepay', 'payment_select_later'].includes(i.type)
			)
			const hasPaymentCancel = session.interactions.some(i => i.type === 'payment_cancel')
			const hasCheckoutCancel = session.interactions.some(i => i.type === 'checkout_cancel')

			if (hasPaymentCancel) {
				byStage['Under betaling']++
			} else if (hasCheckoutCancel || !hasPaymentSelect) {
				byStage['Valg af betalingsmetode']++
			} else {
				byStage['Ukendt']++
			}
		}

		return {
			total: abandoners.length,
			pct: sessions.length > 0 ? roundPercent((abandoners.length / sessions.length) * 100) : 0,
			byStage
		}
	}, [sessions])

	const navigationBacktracking = useMemo(() => {
		let sessionsWithBacktrack = 0
		let totalBacktracks = 0

		const backtrackTypes = ['nav_to_welcome', 'nav_to_activity', 'nav_to_room']

		for (const session of sessions) {
			let backtrackCount = 0

			for (const interaction of session.interactions) {
				if (backtrackTypes.includes(interaction.type)) {
					backtrackCount++
				}
			}

			if (backtrackCount > 0) {
				sessionsWithBacktrack++
				totalBacktracks += backtrackCount
			}
		}

		return {
			sessionsWithBacktrack,
			totalBacktracks,
			pct: sessions.length > 0 ? roundPercent((sessionsWithBacktrack / sessions.length) * 100) : 0
		}
	}, [sessions])

	const navigationFlows = useMemo(() => {
		const flowMap = new Map<string, FlowEntry>()

		const getViewFromInteraction = (type: string): ViewType | null => {
			if (type === 'nav_to_welcome') { return 'welcome' }
			if (type === 'nav_to_activity' || type === 'nav_auto_to_activity') { return 'activity' }
			if (type === 'nav_to_room' || type === 'nav_auto_to_room') { return 'room' }
			if (type === 'nav_to_order' || type === 'nav_auto_to_order') { return 'order' }
			if (type === 'checkout_start') { return 'checkout' }
			if (type === 'checkout_complete') { return 'confirmation' }
			if (type === 'checkout_cancel' || type === 'payment_cancel' || type === 'checkout_failed') { return 'order' }
			return null
		}

		for (const session of sessions) {
			let currentView: ViewType = 'welcome'

			for (const interaction of session.interactions) {
				const newView = getViewFromInteraction(interaction.type)
				if (newView !== null && newView !== currentView) {
					const isBacktrack = (
						(currentView === 'order' && (newView === 'welcome' || newView === 'activity' || newView === 'room')) ||
						(currentView === 'checkout' && newView !== 'confirmation') ||
						(currentView === 'room' && (newView === 'activity' || newView === 'welcome')) ||
						(currentView === 'activity' && newView === 'welcome')
					)

					if (isBacktrack) {
						const key = `${currentView}→${newView}`
						const existing = flowMap.get(key)
						const outcome = session.hasCheckoutComplete ? 'completed' : session.hasTimeout ? 'timeout' : session.hasCheckoutStart ? 'abandoned' : 'other'

						if (existing) {
							existing.count++
							existing.sessions.push({
								sessionId: session.sessionId,
								kioskId: session.kioskId,
								time: new Date(interaction.timestamp),
								outcome
							})
						} else {
							flowMap.set(key, {
								from: currentView,
								to: newView,
								count: 1,
								sessions: [{
									sessionId: session.sessionId,
									kioskId: session.kioskId,
									time: new Date(interaction.timestamp),
									outcome
								}]
							})
						}
					}
					currentView = newView
				}
			}
		}

		return Array.from(flowMap.values()).sort((a, b) => b.count - a.count)
	}, [sessions])

	const timeoutsPerView = useMemo(() => {
		const counts: Record<ViewType, number> = { welcome: 0, activity: 0, room: 0, order: 0, checkout: 0, confirmation: 0 }

		const getViewFromInteraction = (type: string): ViewType | null => {
			if (type === 'nav_to_welcome') { return 'welcome' }
			if (type === 'nav_to_activity' || type === 'nav_auto_to_activity') { return 'activity' }
			if (type === 'nav_to_room' || type === 'nav_auto_to_room') { return 'room' }
			if (type === 'nav_to_order' || type === 'nav_auto_to_order') { return 'order' }
			if (type === 'checkout_start') { return 'checkout' }
			if (type === 'checkout_complete') { return 'confirmation' }
			if (type === 'checkout_cancel' || type === 'payment_cancel' || type === 'checkout_failed') { return 'order' }
			return null
		}

		for (const session of sessions) {
			if (!session.hasTimeout) { continue }

			let currentView: ViewType = 'welcome'
			for (const interaction of session.interactions) {
				if (interaction.type === 'session_timeout' || interaction.type === 'timeout_restart') {
					counts[currentView]++
					break
				}
				const newView = getViewFromInteraction(interaction.type)
				if (newView !== null) { currentView = newView }
			}
		}

		return counts
	}, [sessions])

	const checkoutCancelFlow = useMemo(() => {
		const cancels: Array<{
			sessionId: string
			kioskId: string
			cancelType: 'checkout_cancel' | 'payment_cancel'
			timeInCheckout: number
			whatNext: 'retry_same_session' | 'left' | 'modified_cart'
			retrySucceeded: boolean
			timeBetween: number | null
		}> = []

		for (const session of sessions) {
			let checkoutStartTime: number | null = null
			let lastCancelType: 'checkout_cancel' | 'payment_cancel' | null = null

			for (let i = 0; i < session.interactions.length; i++) {
				const interaction = session.interactions[i]
				const time = new Date(interaction.timestamp).getTime()

				if (interaction.type === 'checkout_start') {
					checkoutStartTime = time
				}

				if (interaction.type === 'checkout_cancel' || interaction.type === 'payment_cancel') {
					lastCancelType = interaction.type as 'checkout_cancel' | 'payment_cancel'
					const timeInCheckout = checkoutStartTime !== null ? time - checkoutStartTime : 0

					let whatNext: typeof cancels[0]['whatNext'] = 'left'
					let retrySucceeded = false
					let timeBetween: number | null = null

					for (let j = i + 1; j < session.interactions.length; j++) {
						const nextInt = session.interactions[j]
						if (nextInt.type === 'checkout_start') {
							whatNext = 'retry_same_session'
							timeBetween = new Date(nextInt.timestamp).getTime() - time
							break
						}
						if (['product_select', 'product_increase', 'product_decrease', 'option_select', 'option_increase', 'option_decrease', 'cart_clear'].includes(nextInt.type)) {
							whatNext = 'modified_cart'
							break
						}
					}

					if (session.hasCheckoutComplete) {
						retrySucceeded = true
					}

					cancels.push({
						sessionId: session.sessionId,
						kioskId: session.kioskId,
						cancelType: lastCancelType,
						timeInCheckout,
						whatNext,
						retrySucceeded,
						timeBetween
					})
				}
			}
		}

		const byWhatNext = {
			retry_same_session: cancels.filter(c => c.whatNext === 'retry_same_session'),
			modified_cart: cancels.filter(c => c.whatNext === 'modified_cart'),
			left: cancels.filter(c => c.whatNext === 'left')
		}

		return {
			total: cancels.length,
			byWhatNext,
			retriedAndSucceeded: cancels.filter(c => c.retrySucceeded).length,
			avgTimeInCheckoutBeforeCancel: cancels.length > 0
				? cancels.reduce((sum, c) => sum + c.timeInCheckout, 0) / cancels.length
				: 0
		}
	}, [sessions])

	const activityStats = useMemo(() => {
		const activityMap = new Map<string, {
			id: string
			name: string
			sessions: Set<string>
			completed: number
		}>()

		for (const activity of activities) {
			activityMap.set(activity._id, {
				id: activity._id,
				name: activity.name,
				sessions: new Set(),
				completed: 0
			})
		}

		for (const session of sessions) {
			const activityInteraction = session.interactions.find(
				i => (i.type === 'activity_select' || i.type === 'activity_auto_select') && i.metadata?.activityId !== undefined
			)
			const activityId = activityInteraction?.metadata?.activityId
			if (activityId !== undefined) {
				const stats = activityMap.get(activityId)
				if (stats) {
					stats.sessions.add(session.sessionId)
					if (session.hasCheckoutComplete) {
						stats.completed++
					}
				}
			}
		}

		return Array.from(activityMap.values())
			.filter(a => a.sessions.size > 0)
			.sort((a, b) => b.sessions.size - a.sessions.size)
	}, [activities, sessions])

	const roomStats = useMemo(() => {
		const roomMap = new Map<string, {
			id: string
			name: string
			sessions: Set<string>
			completed: number
		}>()

		for (const room of rooms) {
			roomMap.set(room._id, {
				id: room._id,
				name: room.name,
				sessions: new Set(),
				completed: 0
			})
		}

		for (const session of sessions) {
			const roomInteraction = session.interactions.find(
				i => (i.type === 'room_select' || i.type === 'room_auto_select') && i.metadata?.roomId !== undefined
			)
			const roomId = roomInteraction?.metadata?.roomId
			if (roomId !== undefined) {
				const stats = roomMap.get(roomId)
				if (stats) {
					stats.sessions.add(session.sessionId)
					if (session.hasCheckoutComplete) {
						stats.completed++
					}
				}
			}
		}

		return Array.from(roomMap.values())
			.filter(r => r.sessions.size > 0)
			.sort((a, b) => b.sessions.size - a.sessions.size)
	}, [rooms, sessions])

	const productStats = useMemo(() => {
		const productMap = new Map<string, {
			id: string
			name: string
			adds: number
			removes: number
			netAdds: number
		}>()

		for (const product of products) {
			productMap.set(product._id, {
				id: product._id,
				name: product.name,
				adds: 0,
				removes: 0,
				netAdds: 0
			})
		}

		for (const session of sessions) {
			for (const interaction of session.interactions) {
				const productId = interaction.metadata?.productId
				if (productId === undefined) { continue }

				const stats = productMap.get(productId)
				if (stats === undefined) { continue }

				if (interaction.type === 'product_select' || interaction.type === 'product_increase') {
					stats.adds++
					stats.netAdds++
				} else if (interaction.type === 'product_decrease') {
					stats.removes++
					stats.netAdds--
				}
			}
		}

		return Array.from(productMap.values())
			.filter(p => p.adds > 0)
			.sort((a, b) => b.adds - a.adds)
	}, [products, sessions])

	const optionStats = useMemo(() => {
		const optionMap = new Map<string, {
			id: string
			name: string
			adds: number
			removes: number
			netAdds: number
		}>()

		for (const option of options) {
			optionMap.set(option._id, {
				id: option._id,
				name: option.name,
				adds: 0,
				removes: 0,
				netAdds: 0
			})
		}

		for (const session of sessions) {
			for (const interaction of session.interactions) {
				const optionId = interaction.metadata?.optionId
				if (optionId === undefined) { continue }

				const stats = optionMap.get(optionId)
				if (stats === undefined) { continue }

				if (interaction.type === 'option_select' || interaction.type === 'option_increase') {
					stats.adds++
					stats.netAdds++
				} else if (interaction.type === 'option_decrease') {
					stats.removes++
					stats.netAdds--
				}
			}
		}

		return Array.from(optionMap.values())
			.filter(o => o.adds > 0)
			.sort((a, b) => b.adds - a.adds)
	}, [options, sessions])

	return (
		<div className="space-y-6">
			{/* Kurvopbygning & Fortrydelser */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h3 className="font-semibold text-gray-800">{'Kurvopbygning'}</h3>
						<p className="text-xs text-gray-500">{'Hvordan tilføjer brugere mængde per vare? (katalog-klik vs. + i kurven)'}</p>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold text-amber-600">{regretSignals.pct}{'%'}</div>
						<div className="text-xs text-gray-500">
							{regretSignals.sessionsWithRegret}{' af '}{sessions.length}{' fortrydelser'}
						</div>
					</div>
				</div>

				{cartBuildingPatterns.length > 0 ? (
					<div className="space-y-4">
						<div className="space-y-2">
							{cartBuildingPatterns.map((pattern) => {
								const maxPct = cartBuildingPatterns[0].pct
								const barWidth = maxPct > 0 ? (pattern.pct / maxPct) * 100 : 0
								return (
									<div key={pattern.label} className="flex items-center gap-3">
										<div className="w-36 text-sm text-gray-600 shrink-0">{pattern.label}</div>
										<div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
											<div
												className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
												style={{ width: `${barWidth}%` }}
											/>
											<span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
												{pattern.count}{' ('}{pattern.pct}{'%)'}
											</span>
										</div>
									</div>
								)
							})}
						</div>
						<div className="mt-4 pt-4">
							<div className="text-sm font-medium text-amber-700 mb-1">{'Fortrydelser'}</div>
							<div className="text-xs text-gray-500">
								{regretSignals.totalRegrets}{' produkter tilføjet og derefter fjernet'}
							</div>
						</div>
					</div>
				) : (
					<div className="text-gray-400 text-center py-4">{'Ingen data'}</div>
				)}
			</div>

			{/* Navigation & Tilbagenavigation */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h3 className="font-semibold text-gray-800">{'Tilbagenavigation'}</h3>
						<p className="text-xs text-gray-500">{'Sessioner hvor brugere gik tilbage i flowet'}</p>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold text-indigo-600">{navigationBacktracking.pct}{'%'}</div>
						<div className="text-xs text-gray-500">
							{navigationBacktracking.sessionsWithBacktrack}{' af '}{sessions.length}
							{' • '}{navigationBacktracking.totalBacktracks}{' navigationer'}
						</div>
					</div>
				</div>

				{(navigationFlows.length > 0 || Object.values(timeoutsPerView).some(v => v > 0)) && (
					<div className="mt-4 pt-4">
						<div className="text-sm font-medium text-gray-700 mb-3">{'Navigationsflows'}</div>
						<NavigationFlowDiagram flows={navigationFlows} timeoutsPerView={timeoutsPerView} />
					</div>
				)}
			</div>

			{/* Checkout-afbrydelser */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<div className="flex items-start justify-between mb-4">
					<div>
						<h3 className="font-semibold text-gray-800">{'Checkout-afbrydelser'}</h3>
						<p className="text-xs text-gray-500">{'Sessioner der startede checkout men ikke gennemførte'}</p>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold text-red-600">{checkoutAbandoners.pct}{'%'}</div>
						<div className="text-xs text-gray-500">{checkoutAbandoners.total}{' af '}{sessions.length}{' sessions'}</div>
					</div>
				</div>

				{checkoutAbandoners.total > 0 && (
					<>
						<div className="grid grid-cols-3 gap-3 text-center mb-4">
							{Object.entries(checkoutAbandoners.byStage).filter(([, v]) => v > 0).map(([stage, count]) => (
								<div key={stage} className="bg-red-50 rounded-lg p-2">
									<div className="text-lg font-bold text-red-600">{count}</div>
									<div className="text-xs text-gray-600">{stage}</div>
								</div>
							))}
						</div>

						{checkoutCancelFlow.total > 0 && (
							<div className="mt-4 pt-4">
								<div className="text-sm font-medium text-gray-700 mb-3">{'Hvad gjorde de efter afbrydelse?'}</div>
								<div className="grid grid-cols-3 gap-2 text-center">
									<div className="bg-blue-50 rounded p-2">
										<div className="text-lg font-bold text-blue-600">{checkoutCancelFlow.byWhatNext.retry_same_session.length}</div>
										<div className="text-xs text-gray-600">{'Prøvede igen'}</div>
									</div>
									<div className="bg-amber-50 rounded p-2">
										<div className="text-lg font-bold text-amber-600">{checkoutCancelFlow.byWhatNext.modified_cart.length}</div>
										<div className="text-xs text-gray-600">{'Ændrede kurv'}</div>
									</div>
									<div className="bg-gray-100 rounded p-2">
										<div className="text-lg font-bold text-gray-600">{checkoutCancelFlow.byWhatNext.left.length}</div>
										<div className="text-xs text-gray-600">{'Forlod'}</div>
									</div>
								</div>
								<div className="mt-3 text-sm text-gray-600 flex justify-between">
									<span>{'Gns. tid i checkout før afbrydelse: '}{formatDuration(checkoutCancelFlow.avgTimeInCheckoutBeforeCancel)}</span>
									<span className="text-green-600">{checkoutCancelFlow.retriedAndSucceeded}{' endte med køb'}</span>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Aktiviteter'}</h3>
					{activityStats.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-4">{'Ingen aktivitetsdata'}</p>
					) : (
						<div className="overflow-x-auto max-h-48 overflow-y-auto">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-white">
									<tr className="text-left text-gray-500 border-b border-gray-200">
										<th className="pb-2 font-medium">{'Aktivitet'}</th>
										<th className="pb-2 font-medium text-right">{'Sessions'}</th>
										<th className="pb-2 font-medium text-right">{'Konvertering'}</th>
									</tr>
								</thead>
								<tbody>
									{activityStats.map(stat => (
										<tr key={stat.id} className="border-b border-gray-100 last:border-b-0">
											<td className="py-2 text-gray-800">{stat.name}</td>
											<td className="py-2 text-right text-gray-600">{stat.sessions.size}</td>
											<td className="py-2 text-right text-gray-600">
												{stat.sessions.size > 0 ? roundPercent((stat.completed / stat.sessions.size) * 100) : 0}{'%'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Lokaler'}</h3>
					{roomStats.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-4">{'Ingen lokaledata'}</p>
					) : (
						<div className="overflow-x-auto max-h-48 overflow-y-auto">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-white">
									<tr className="text-left text-gray-500 border-b border-gray-200">
										<th className="pb-2 font-medium">{'Lokale'}</th>
										<th className="pb-2 font-medium text-right">{'Sessions'}</th>
										<th className="pb-2 font-medium text-right">{'Konvertering'}</th>
									</tr>
								</thead>
								<tbody>
									{roomStats.map(stat => (
										<tr key={stat.id} className="border-b border-gray-100 last:border-b-0">
											<td className="py-2 text-gray-800">{stat.name}</td>
											<td className="py-2 text-right text-gray-600">{stat.sessions.size}</td>
											<td className="py-2 text-right text-gray-600">
												{stat.sessions.size > 0 ? roundPercent((stat.completed / stat.sessions.size) * 100) : 0}{'%'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Produkter'}</h3>
					{productStats.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-4">{'Ingen produktdata'}</p>
					) : (
						<div className="overflow-x-auto max-h-48 overflow-y-auto">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-white">
									<tr className="text-left text-gray-500 border-b border-gray-200">
										<th className="pb-2 font-medium">{'Produkt'}</th>
										<th className="pb-2 font-medium text-right">{'Tilføjet'}</th>
										<th className="pb-2 font-medium text-right">{'Fjernet'}</th>
										<th className="pb-2 font-medium text-right">{'Netto'}</th>
									</tr>
								</thead>
								<tbody>
									{productStats.map(stat => (
										<tr key={stat.id} className="border-b border-gray-100 last:border-b-0">
											<td className="py-2 text-gray-800">{stat.name}</td>
											<td className="py-2 text-right text-green-600">{stat.adds}</td>
											<td className="py-2 text-right text-red-600">{stat.removes}</td>
											<td className="py-2 text-right text-gray-600">{stat.netAdds}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Tilvalg'}</h3>
					{optionStats.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-4">{'Ingen tilvalgdata'}</p>
					) : (
						<div className="overflow-x-auto max-h-48 overflow-y-auto">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-white">
									<tr className="text-left text-gray-500 border-b border-gray-200">
										<th className="pb-2 font-medium">{'Tilvalg'}</th>
										<th className="pb-2 font-medium text-right">{'Tilføjet'}</th>
										<th className="pb-2 font-medium text-right">{'Fjernet'}</th>
										<th className="pb-2 font-medium text-right">{'Netto'}</th>
									</tr>
								</thead>
								<tbody>
									{optionStats.map(stat => (
										<tr key={stat.id} className="border-b border-gray-100 last:border-b-0">
											<td className="py-2 text-gray-800">{stat.name}</td>
											<td className="py-2 text-right text-green-600">{stat.adds}</td>
											<td className="py-2 text-right text-red-600">{stat.removes}</td>
											<td className="py-2 text-right text-gray-600">{stat.netAdds}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function NavigationFlowDiagram ({ flows, timeoutsPerView }: { flows: FlowEntry[], timeoutsPerView: Record<ViewType, number> }): ReactElement {
	const stages: ViewType[] = ['welcome', 'activity', 'room', 'order']
	const stageLabels: Record<ViewType, string> = {
		welcome: 'Velkomst',
		activity: 'Aktivitet',
		room: 'Lokale',
		order: 'Produkt',
		checkout: 'Checkout',
		confirmation: 'Bekræftelse'
	}
	const stageColors: Record<ViewType, { fill: string, stroke: string, text: string }> = {
		welcome: { fill: '#ecfdf5', stroke: '#6ee7b7', text: '#047857' },
		activity: { fill: '#eff6ff', stroke: '#93c5fd', text: '#1d4ed8' },
		room: { fill: '#faf5ff', stroke: '#c4b5fd', text: '#7c3aed' },
		order: { fill: '#fffbeb', stroke: '#fcd34d', text: '#b45309' },
		checkout: { fill: '#f9fafb', stroke: '#d1d5db', text: '#374151' },
		confirmation: { fill: '#f9fafb', stroke: '#d1d5db', text: '#374151' }
	}

	const maxCount = Math.max(...flows.map(f => f.count), 1)

	const getFlowCount = (from: ViewType, to: ViewType): number => {
		const flow = flows.find(f => f.from === from && f.to === to)
		return flow?.count ?? 0
	}

	const boxWidth = 90
	const boxHeight = 40
	const svgWidth = 520
	const svgHeight = 220
	const boxY = 70
	const spacing = (svgWidth - boxWidth * 4) / 5

	const getBoxX = (index: number): number => spacing + index * (boxWidth + spacing)

	const flowLines: Array<{
		from: ViewType
		to: ViewType
		fromIdx: number
		toIdx: number
		count: number
		color: string
	}> = []

	for (let i = 0; i < stages.length; i++) {
		for (let j = i + 1; j < stages.length; j++) {
			const count = getFlowCount(stages[j], stages[i])
			if (count > 0) {
				flowLines.push({
					from: stages[j],
					to: stages[i],
					fromIdx: j,
					toIdx: i,
					count,
					color: stageColors[stages[j]].stroke
				})
			}
		}
	}

	return (
		<div className="flex flex-col items-center w-full">
			<svg width={svgWidth} height={svgHeight} className="overflow-visible">
				<defs>
					{flowLines.map((line, idx) => {
						const strokeWidth = Math.max(2, (line.count / maxCount) * 8)
						const arrowOffset = 2 + strokeWidth * 0.125
						return (
							<marker
								key={`arrow-${idx}`}
								id={`arrow-${idx}`}
								markerWidth="4"
								markerHeight="4"
								refX={arrowOffset}
								refY="2"
								orient="auto-start-reverse"
								markerUnits="strokeWidth"
							>
								<path d="M0,0 L4,2 L0,4 z" fill={line.color} />
							</marker>
						)
					})}
				</defs>

				{flowLines.map((line, idx) => {
					const fromX = getBoxX(line.fromIdx) + boxWidth / 2
					const toX = getBoxX(line.toIdx) + boxWidth / 2
					const strokeWidth = Math.max(2, (line.count / maxCount) * 8)
					const midX = (fromX + toX) / 2
					const distance = Math.abs(line.toIdx - line.fromIdx)

					const isTop = distance === 1
					const startY = isTop ? boxY - 6 : boxY + boxHeight + 6
					const curveHeight = isTop ? -55 : (50 + distance * 25)

					const path = `M ${toX} ${startY} C ${toX} ${startY + curveHeight} ${fromX} ${startY + curveHeight} ${fromX} ${startY}`

					const textX = midX
					const textY = startY + curveHeight * 0.75

					return (
						<g key={idx} opacity={0.7}>
							<path
								d={path}
								fill="none"
								stroke={line.color}
								strokeWidth={strokeWidth}
								strokeLinecap="round"
								markerStart={`url(#arrow-${idx})`}
							/>
							<text
								x={textX}
								y={textY + (isTop ? 3 : 5)}
								textAnchor="middle"
								fontSize="12"
								fill="#1f2937"
								fontWeight="600"
							>
								{line.count}
							</text>
						</g>
					)
				})}

				{stages.map((stage, idx) => {
					const colors = stageColors[stage]
					const x = getBoxX(idx)
					const timeoutCount = timeoutsPerView[stage] ?? 0
					const centerX = x + boxWidth / 2
					return (
						<g key={stage}>
							<rect
								x={x}
								y={boxY}
								width={boxWidth}
								height={boxHeight}
								rx={8}
								fill={colors.fill}
								stroke={colors.stroke}
								strokeWidth={2}
							/>
							<text
								x={centerX}
								y={boxY + boxHeight / 2 + 5}
								textAnchor="middle"
								fontSize="13"
								fontWeight="600"
								fill={colors.text}
							>
								{stageLabels[stage]}
							</text>
							{timeoutCount > 0 && (
								<text x={centerX} y={boxY - 40} textAnchor="middle" fontSize="10" fill="#eab308" fontWeight="600">
									{'⏰ '}{timeoutCount}
								</text>
							)}
						</g>
					)
				})}
			</svg>
		</div>
	)
}
