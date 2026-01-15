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

interface KiosksTabProps {
	interactions: InteractionType[]
	kiosks: KioskType[]
	orders: OrderType[]
}

interface KioskStats {
	kioskId: string
	name: string
	totalSessions: number
	completed: number
	timedOut: number
	abandoned: number
	conversionRate: number
	avgDuration: number
	avgCartMods: number
}

export default function KiosksTab ({
	interactions,
	kiosks,
	orders
}: KiosksTabProps): ReactElement {
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

	const kioskStats = useMemo(() => {
		const statsByKiosk = new Map<string, SessionAnalysis[]>()

		for (const session of sessions) {
			const existing = statsByKiosk.get(session.kioskId) ?? []
			existing.push(session)
			statsByKiosk.set(session.kioskId, existing)
		}

		const stats: KioskStats[] = []

		statsByKiosk.forEach((kioskSessions, kioskId) => {
			const total = kioskSessions.length
			const completed = kioskSessions.filter(s => s.endReason === 'completed').length
			const timedOut = kioskSessions.filter(s => s.endReason === 'timeout').length
			const abandoned = kioskSessions.filter(s => s.endReason === 'abandoned').length
			const conversionRate = total > 0 ? (completed / total) * 100 : 0
			const avgDuration = kioskSessions.reduce((sum, s) => sum + s.duration, 0) / total || 0
			const avgCartMods = kioskSessions.reduce((sum, s) => sum + s.cartModifications, 0) / total || 0

			stats.push({
				kioskId,
				name: getKioskName(kioskId, kiosks),
				totalSessions: total,
				completed,
				timedOut,
				abandoned,
				conversionRate,
				avgDuration,
				avgCartMods
			})
		})

		return stats.sort((a, b) => b.totalSessions - a.totalSessions)
	}, [sessions, kiosks])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left font-medium text-gray-500">{'Kiosk'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Sessioner'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Gennemført'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Timeout'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Afbrudt'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Konvertering'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Gns. varighed'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Gns. kurvændringer'}</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{kioskStats.length > 0 ? kioskStats.map((kiosk) => (
								<tr key={kiosk.kioskId} className="hover:bg-gray-50">
									<td className="px-4 py-3 font-medium">{kiosk.name}</td>
									<td className="px-4 py-3 text-right">{kiosk.totalSessions}</td>
									<td className="px-4 py-3 text-right text-green-600">{kiosk.completed}</td>
									<td className="px-4 py-3 text-right text-yellow-600">{kiosk.timedOut}</td>
									<td className="px-4 py-3 text-right text-red-600">{kiosk.abandoned}</td>
									<td className="px-4 py-3 text-right">
										<span className={
											kiosk.conversionRate > 50
												? 'text-green-600'
												: kiosk.conversionRate > 30
													? 'text-yellow-600'
													: 'text-red-600'
										}>
											{kiosk.conversionRate.toFixed(1)}{'%\r'}
										</span>
									</td>
									<td className="px-4 py-3 text-right">{formatDuration(kiosk.avgDuration)}</td>
									<td className="px-4 py-3 text-right">{kiosk.avgCartMods.toFixed(1)}</td>
								</tr>
							)) : (
								<tr>
									<td colSpan={8} className="px-4 py-8 text-center text-gray-400">
										{'Ingen kiosk data'}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{kioskStats.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
						<h3 className="font-semibold text-gray-800 mb-4">{'Bedst performende kiosker'}</h3>
						<div className="space-y-2">
							{[...kioskStats]
								.sort((a, b) => b.conversionRate - a.conversionRate)
								.slice(0, 5)
								.map((kiosk, idx) => (
									<div key={kiosk.kioskId} className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span>
											<span>{kiosk.name}</span>
										</div>
										<span className="text-green-600 font-medium">
											{kiosk.conversionRate.toFixed(1)}{'%\r'}
										</span>
									</div>
								))}
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
						<h3 className="font-semibold text-gray-800 mb-4">{'Kiosker der kræver opmærksomhed'}</h3>
						<div className="space-y-2">
							{[...kioskStats]
								.filter(k => k.conversionRate < 30 || k.timedOut > k.totalSessions * 0.3)
								.slice(0, 5)
								.map((kiosk) => (
									<div key={kiosk.kioskId} className="flex items-center justify-between">
										<span>{kiosk.name}</span>
										<div className="flex space-x-2 text-sm">
											{kiosk.conversionRate < 30 && (
												<span className="text-red-600">
													{'Lav konvertering'}
												</span>
											)}
											{kiosk.timedOut > kiosk.totalSessions * 0.3 && (
												<span className="text-yellow-600">
													{'Mange timeouts'}
												</span>
											)}
										</div>
									</div>
								))}
							{kioskStats.filter(k => k.conversionRate < 30 || k.timedOut > k.totalSessions * 0.3).length === 0 && (
								<div className="text-green-600 text-center py-4">
									{'✓ Alle kiosker performer godt'}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
