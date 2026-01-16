'use client'

import { type ReactElement, useMemo } from 'react'

import type { ActivityType, InteractionType, KioskType, OrderType, RoomType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	formatDuration,
	getKioskName,
	analyzeSession,
	groupInteractionsBySession,
	roundPercent,
	isAutoInteraction
} from './analyticsHelpers'

interface ProblemsTabProps {
	interactions: InteractionType[]
	kiosks: KioskType[]
	orders: OrderType[]
	activities: ActivityType[]
	rooms: RoomType[]
}

type ViewType = 'welcome' | 'activity' | 'room' | 'order' | 'checkout'

interface LongPause {
	view: ViewType
	duration: number
	sessionId: string
	kioskId: string
	activityId?: string
	roomId?: string
}

export default function ProblemsTab ({
	interactions,
	kiosks,
	orders,
	activities,
	rooms
}: ProblemsTabProps): ReactElement {
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

	const rates = useMemo(() => {
		const total = sessions.length
		const timedOut = sessions.filter(s => s.endReason === 'timeout').length
		const checkoutStarted = sessions.filter(s => s.hasCheckoutStart).length
		const completed = sessions.filter(s => s.hasCheckoutComplete).length
		const paymentFailed = sessions.filter(s => s.hasPaymentFailure === true).length

		return {
			timeoutRate: total > 0 ? roundPercent((timedOut / total) * 100) : 0,
			abandonmentRate: checkoutStarted > 0 ? roundPercent(((checkoutStarted - completed) / checkoutStarted) * 100) : 0,
			paymentFailedRate: checkoutStarted > 0 ? roundPercent((paymentFailed / checkoutStarted) * 100) : 0,
			timedOut,
			abandoned: checkoutStarted - completed,
			paymentFailed,
			total,
			checkoutStarted
		}
	}, [sessions])

	const outlierSessions = useMemo(() => {
		const outliers: Array<{
			session: SessionAnalysis
			reasons: string[]
		}> = []

		const durations = sessions.map(s => s.duration)
		const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length || 0

		for (const session of sessions) {
			const reasons: string[] = []

			if (session.duration > avgDuration * 3 && session.duration > 60000) {
				reasons.push(`Usædvanlig lang (${formatDuration(session.duration)})`)
			}

			if (session.maxIdleGap > 45000) {
				reasons.push(`Lang pause (${formatDuration(session.maxIdleGap)})`)
			}

			if (session.hasCheckoutStart && !session.hasCheckoutComplete && !session.hasTimeout && session.hasPaymentFailure === false && session.hasPaymentCancelled === false) {
				reasons.push('Checkout afbrudt manuelt')
			}

			if (session.cartModifications > 8) {
				reasons.push(`Mange kurvændringer (${session.cartModifications})`)
			}

			if (reasons.length > 0) {
				outliers.push({ session, reasons })
			}
		}

		return outliers
			.sort((a, b) => b.reasons.length - a.reasons.length)
			.slice(0, 15)
	}, [sessions])

	const longestPauses = useMemo(() => {
		const pauses: LongPause[] = []
		const PAUSE_THRESHOLD = 10000

		for (const session of sessions) {
			let currentView: ViewType = 'welcome'
			let lastActivityId: string | undefined
			let lastRoomId: string | undefined

			for (let i = 1; i < session.interactions.length; i++) {
				const prev = session.interactions[i - 1]
				const curr = session.interactions[i]

				if (prev.type === 'activity_select' || prev.type === 'activity_auto_select') {
					lastActivityId = prev.metadata?.activityId
				}
				if (prev.type === 'room_select' || prev.type === 'room_auto_select') {
					lastRoomId = prev.metadata?.roomId
				}

				if (prev.type === 'nav_to_welcome' || prev.type === 'timeout_restart' || prev.type === 'session_start') {
					currentView = 'welcome'
				} else if (prev.type === 'nav_to_activity' || prev.type === 'nav_auto_to_activity') {
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
					pauses.push({
						view: currentView,
						duration: gap,
						sessionId: session.sessionId,
						kioskId: session.kioskId,
						activityId: lastActivityId,
						roomId: lastRoomId
					})
				}
			}
		}

		const viewLabels: Record<ViewType, string> = {
			welcome: 'Velkomst',
			activity: 'Aktivitetsvalg',
			room: 'Lokalevalg',
			order: 'Produktvalg',
			checkout: 'Checkout'
		}

		return pauses
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10)
			.map(p => ({
				...p,
				viewLabel: viewLabels[p.view],
				kioskName: getKioskName(p.kioskId, kiosks),
				activityName: p.activityId !== undefined ? activities.find(a => a._id === p.activityId)?.name : undefined,
				roomName: p.roomId !== undefined ? rooms.find(r => r._id === p.roomId)?.name : undefined
			}))
	}, [sessions, kiosks, activities, rooms])

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-3 gap-4">
				<RateCard
					label="Timeout rate"
					value={rates.timeoutRate}
					count={rates.timedOut}
					total={rates.total}
					threshold={20}
				/>
				<RateCard
					label="Checkout afbrydelse"
					value={rates.abandonmentRate}
					count={rates.abandoned}
					total={rates.checkoutStarted}
					threshold={30}
				/>
				<RateCard
					label="Betaling mislykket"
					value={rates.paymentFailedRate}
					count={rates.paymentFailed}
					total={rates.checkoutStarted}
					threshold={15}
					color="yellow"
				/>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Usædvanlige sessioner'}</h3>
				{outlierSessions.length > 0 ? (
					<div className="space-y-3 max-h-96 overflow-y-auto">
						{outlierSessions.map(({ session, reasons }) => (
							<div key={session.sessionId} className="border border-gray-200 rounded-lg p-3">
								<div className="flex justify-between items-start mb-2">
									<div>
										<div className="font-medium text-sm">
											{session.startTime.toLocaleDateString('da-DK', {
												weekday: 'short',
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</div>
										<div className="text-xs text-gray-500">
											{getKioskName(session.kioskId, kiosks)}
											{' • '}
											{formatDuration(session.duration)}
										</div>
									</div>
									<EndReasonBadge reason={session.endReason} />
								</div>
								<div className="flex flex-wrap gap-1">
									{reasons.map((reason, idx) => (
										<span
											key={idx}
											className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded"
										>
											{reason}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-gray-400 text-center py-8">
						{'Ingen usædvanlige sessioner fundet'}
					</div>
				)}
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Længste pauser'}</h3>
				<p className="text-xs text-gray-500 mb-4">{'Pauser over 10 sekunder - potentielle problempunkter'}</p>
				{longestPauses.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-gray-500 border-b border-gray-200">
									<th className="pb-2 font-medium">{'Varighed'}</th>
									<th className="pb-2 font-medium">{'Visning'}</th>
									<th className="pb-2 font-medium">{'Aktivitet'}</th>
									<th className="pb-2 font-medium">{'Lokale'}</th>
									<th className="pb-2 font-medium">{'Kiosk'}</th>
								</tr>
							</thead>
							<tbody>
								{longestPauses.map((pause, idx) => (
									<tr key={`${pause.sessionId}-${idx}`} className="border-b border-gray-100 last:border-b-0">
										<td className="py-2 font-medium text-amber-600">{formatDuration(pause.duration)}</td>
										<td className="py-2 text-gray-600">{pause.viewLabel}</td>
										<td className="py-2 text-gray-600">{pause.activityName ?? '-'}</td>
										<td className="py-2 text-gray-600">{pause.roomName ?? '-'}</td>
										<td className="py-2 text-gray-600">{pause.kioskName}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-gray-400 text-center py-4">{'Ingen lange pauser fundet'}</div>
				)}
			</div>
		</div>
	)
}

function RateCard ({
	label,
	value,
	count,
	total,
	threshold,
	color
}: {
	label: string
	value: number
	count: number
	total: number
	threshold: number
	color?: 'yellow'
}): ReactElement {
	const isWarning = color !== 'yellow' && value > threshold
	const bgColor = color === 'yellow'
		? 'bg-yellow-50 border-yellow-200'
		: isWarning
			? 'bg-red-50 border-red-200'
			: 'bg-white border-gray-100'
	const textColor = color === 'yellow'
		? 'text-yellow-700'
		: isWarning
			? 'text-red-600'
			: 'text-gray-900'

	return (
		<div className={`rounded-xl shadow-sm p-4 border ${bgColor}`}>
			<div className="text-xs text-gray-500">{label}</div>
			<div className={`text-2xl font-bold ${textColor}`}>
				{value}{'%'}
			</div>
			<div className="text-xs text-gray-400">{count}{' af '}{total}</div>
		</div>
	)
}

function EndReasonBadge ({ reason }: { reason: SessionAnalysis['endReason'] }): ReactElement {
	const colors = {
		completed: 'bg-green-100 text-green-800',
		timeout: 'bg-yellow-100 text-yellow-800',
		abandoned: 'bg-red-100 text-red-800',
		manual_end: 'bg-gray-100 text-gray-800'
	}
	const labels = {
		completed: '✓ Gennemført',
		timeout: '⏰ Timeout',
		abandoned: '✕ Afbrudt',
		manual_end: 'Manuel'
	}

	return (
		<span className={`px-2 py-0.5 text-xs rounded ${colors[reason]}`}>
			{labels[reason]}
		</span>
	)
}
