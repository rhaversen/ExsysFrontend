'use client'

import { type ReactElement, useMemo, useState } from 'react'

import type { InteractionType, KioskType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	formatDuration,
	getKioskName,
	getInteractionIcon,
	getInteractionLabel,
	analyzeSession,
	groupInteractionsBySession
} from './analyticsHelpers'

interface SessionsTabProps {
	interactions: InteractionType[]
	kiosks: KioskType[]
	orders: OrderType[]
}

export default function SessionsTab ({
	interactions,
	kiosks,
	orders
}: SessionsTabProps): ReactElement {
	const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

	const sessions = useMemo(() => {
		const grouped = groupInteractionsBySession(interactions)
		const analyzed: SessionAnalysis[] = []
		grouped.forEach((sessionInteractions) => {
			const session = analyzeSession(sessionInteractions, orders)
			if (!session.isFeedbackOnly) {
				analyzed.push(session)
			}
		})
		return analyzed.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
	}, [interactions, orders])

	const toggleSession = (sessionId: string) => {
		setExpandedSessions(prev => {
			const next = new Set(prev)
			if (next.has(sessionId)) {
				next.delete(sessionId)
			} else {
				next.add(sessionId)
			}
			return next
		})
	}

	return (
		<div className="space-y-4">
			{sessions.length > 0 ? sessions.map((session) => (
				<SessionCard
					key={session.sessionId}
					session={session}
					kiosks={kiosks}
					orders={orders}
					isExpanded={expandedSessions.has(session.sessionId)}
					onToggle={() => toggleSession(session.sessionId)}
				/>
			)) : (
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
					{'Ingen sessioner fundet'}
				</div>
			)}
		</div>
	)
}

function SessionCard ({
	session,
	kiosks,
	orders,
	isExpanded,
	onToggle
}: {
	session: SessionAnalysis
	kiosks: KioskType[]
	orders: OrderType[]
	isExpanded: boolean
	onToggle: () => void
}): ReactElement {
	const order = orders.find(o => o._id === session.orderId)

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
			<button
				onClick={onToggle}
				className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-center space-x-4">
					<div className="text-left">
						<div className="font-medium">
							{session.startTime.toLocaleDateString('da-DK', {
								weekday: 'short',
								day: 'numeric',
								month: 'short',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</div>
						<div className="text-sm text-gray-500">
							{getKioskName(session.kioskId, kiosks)}
							{' • '}
							{formatDuration(session.duration)}
							{' • '}
							{session.interactionCount} {'interaktioner\r'}
						</div>
					</div>
				</div>
				<div className="flex items-center space-x-3">
					<EndReasonBadge reason={session.endReason} />
					<span className="text-gray-400">
						{isExpanded ? '▲' : '▼'}
					</span>
				</div>
			</button>

			{isExpanded && (
				<div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
					{order && (
						<div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
							<div className="text-sm font-medium">{'Ordre'}</div>
							<div className="text-xs text-gray-500 mt-1">
								{'ID: '}{order._id.slice(-8)}
								{' • Status: '}{order.status}
								{' • Betaling: '}{order.paymentStatus}
							</div>
						</div>
					)}

					<div className="text-sm font-medium mb-2">{'Tidslinje'}</div>
					<div className="space-y-1 max-h-96 overflow-y-auto">
						{session.interactions.map((interaction, idx) => (
							<div
								key={`${interaction._id}-${idx}`}
								className="flex items-center space-x-3 py-1 text-sm"
							>
								<span className="text-gray-400 w-12 text-xs">
									{new Date(interaction.timestamp).toLocaleTimeString('da-DK', {
										hour: '2-digit',
										minute: '2-digit',
										second: '2-digit'
									})}
								</span>
								<span className="text-lg">{getInteractionIcon(interaction.type)}</span>
								<span>{getInteractionLabel(interaction.type)}</span>
							</div>
						))}
					</div>
				</div>
			)}
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
		completed: '✓ Køb gennemført',
		timeout: '⏰ Session timeout',
		abandoned: '✕ Afbrudt betaling',
		manual_end: 'Manuel afslutning'
	}
	return (
		<span className={`px-2 py-1 text-xs rounded font-medium ${colors[reason]}`}>
			{labels[reason]}
		</span>
	)
}
