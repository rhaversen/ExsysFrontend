'use client'

import { type ReactElement, useMemo } from 'react'

import type { InteractionType, KioskType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	formatDuration,
	getKioskName,
	analyzeSession,
	groupInteractionsBySession
} from './analyticsHelpers'

interface ProblemsTabProps {
	interactions: InteractionType[]
	kiosks: KioskType[]
	orders: OrderType[]
}

export default function ProblemsTab ({
	interactions,
	kiosks,
	orders
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
		const failed = sessions.filter(s =>
			s.interactions.some(i => i.type === 'checkout_failed')
		).length
		const highIndecision = sessions.filter(s => s.cartModifications > 5).length

		return {
			timeoutRate: total > 0 ? (timedOut / total) * 100 : 0,
			abandonmentRate: checkoutStarted > 0 ? ((checkoutStarted - completed) / checkoutStarted) * 100 : 0,
			errorRate: total > 0 ? (failed / total) * 100 : 0,
			highIndecisionRate: total > 0 ? (highIndecision / total) * 100 : 0,
			timedOut,
			abandoned: checkoutStarted - completed,
			failed,
			highIndecision,
			total
		}
	}, [sessions])

	const outlierSessions = useMemo(() => {
		const outliers: Array<{
			session: SessionAnalysis
			reasons: string[]
		}> = []

		const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length || 0
		const avgCartMods = sessions.reduce((sum, s) => sum + s.cartModifications, 0) / sessions.length || 0

		for (const session of sessions) {
			const reasons: string[] = []

			if (session.duration > avgDuration * 3) {
				reasons.push(`Usædvanlig lang varighed (${formatDuration(session.duration)})`)
			}
			if (session.duration < 5000 && session.interactionCount > 1) {
				reasons.push(`Meget kort session (${formatDuration(session.duration)})`)
			}
			if (session.maxIdleGap > 60000) {
				reasons.push(`Lang pause (${formatDuration(session.maxIdleGap)})`)
			}
			if (session.cartModifications > avgCartMods * 3 && session.cartModifications > 5) {
				reasons.push(`Mange kurvændringer (${session.cartModifications})`)
			}
			if (session.hasCheckoutStart && !session.hasCheckoutComplete && !session.hasTimeout) {
				reasons.push('Checkout afbrudt uden timeout')
			}
			if (session.interactions.some(i => i.type === 'checkout_failed')) {
				reasons.push('Checkout fejl')
			}

			if (reasons.length > 0) {
				outliers.push({ session, reasons })
			}
		}

		return outliers.slice(0, 20)
	}, [sessions])

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<RateCard
					label="Timeout rate"
					value={rates.timeoutRate}
					count={rates.timedOut}
					threshold={20}
					unit="%"
				/>
				<RateCard
					label="Checkout afbrydelse"
					value={rates.abandonmentRate}
					count={rates.abandoned}
					threshold={30}
					unit="%"
				/>
				<RateCard
					label="Fejlrate"
					value={rates.errorRate}
					count={rates.failed}
					threshold={5}
					unit="%"
				/>
				<RateCard
					label="Høj ubeslutsom"
					value={rates.highIndecisionRate}
					count={rates.highIndecision}
					threshold={20}
					unit="%"
				/>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Problematiske sessioner'}</h3>
				{outlierSessions.length > 0 ? (
					<div className="space-y-4">
						{outlierSessions.map(({ session, reasons }) => (
							<div key={session.sessionId} className="border border-gray-200 rounded-lg p-3">
								<div className="flex justify-between items-start mb-2">
									<div>
										<div className="font-medium text-sm">
											{session.startTime.toLocaleString('da-DK')}
										</div>
										<div className="text-xs text-gray-500">
											{getKioskName(session.kioskId, kiosks)}
											{' • '}
											{formatDuration(session.duration)}
											{' • '}
											{session.interactionCount} {'interaktioner\r'}
										</div>
									</div>
									<EndReasonBadge reason={session.endReason} />
								</div>
								<div className="flex flex-wrap gap-2">
									{reasons.map((reason, idx) => (
										<span
											key={idx}
											className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
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
						{'Ingen problematiske sessioner fundet'}
					</div>
				)}
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Anbefalinger'}</h3>
				<div className="space-y-3">
					{rates.timeoutRate > 20 && (
						<Recommendation
							type="warning"
							title="Høj timeout rate"
							description="Overvej at øge timeout-varigheden eller forenkle brugerflowet."
						/>
					)}
					{rates.abandonmentRate > 30 && (
						<Recommendation
							type="warning"
							title="Høj checkout afbrydelse"
							description="Undersøg checkout-flowet for problemer eller forvirrende elementer."
						/>
					)}
					{rates.errorRate > 5 && (
						<Recommendation
							type="error"
							title="Høj fejlrate"
							description="Check betalingsintegration og systemlogge for fejl."
						/>
					)}
					{rates.highIndecisionRate > 20 && (
						<Recommendation
							type="info"
							title="Mange ubeslutsomme brugere"
							description="Overvej at forenkle produktudvalget eller tilføje anbefalinger."
						/>
					)}
					{rates.timeoutRate <= 20 && rates.abandonmentRate <= 30 && rates.errorRate <= 5 && rates.highIndecisionRate <= 20 && (
						<div className="text-green-600 text-center py-4">
							{'✓ Ingen problemer detekteret'}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function RateCard ({
	label,
	value,
	count,
	threshold,
	unit
}: {
	label: string
	value: number
	count: number
	threshold: number
	unit: string
}): ReactElement {
	const isWarning = value > threshold
	return (
		<div className={`rounded-xl shadow-sm p-4 ${isWarning ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100'}`}>
			<div className="text-xs text-gray-500">{label}</div>
			<div className={`text-2xl font-bold ${isWarning ? 'text-red-600' : 'text-gray-900'}`}>
				{value.toFixed(1)}{unit}
			</div>
			<div className="text-xs text-gray-400">{count}{' af total'}</div>
			{isWarning && (
				<div className="text-xs text-red-600 mt-1">{'⚠️ Over grænse'}</div>
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
		<span className={`px-2 py-1 text-xs rounded ${colors[reason]}`}>
			{labels[reason]}
		</span>
	)
}

function Recommendation ({
	type,
	title,
	description
}: {
	type: 'warning' | 'error' | 'info'
	title: string
	description: string
}): ReactElement {
	const colors = {
		warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
		error: 'bg-red-50 border-red-200 text-red-800',
		info: 'bg-blue-50 border-blue-200 text-blue-800'
	}
	const icons = {
		warning: '⚠️',
		error: '❌',
		info: 'ℹ️'
	}
	return (
		<div className={`p-3 border rounded-lg ${colors[type]}`}>
			<div className="font-medium">{icons[type]} {title}</div>
			<div className="text-sm mt-1">{description}</div>
		</div>
	)
}
