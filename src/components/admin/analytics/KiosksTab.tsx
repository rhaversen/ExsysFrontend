'use client'

import { type ReactElement, useMemo } from 'react'

import type { InteractionType, KioskType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	formatDuration,
	getKioskName,
	analyzeSession,
	groupInteractionsBySession,
	roundPercent
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
	conversionRate: number
	avgDuration: number
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
			const conversionRate = total > 0 ? roundPercent((completed / total) * 100) : 0
			const avgDuration = kioskSessions.reduce((sum, s) => sum + s.duration, 0) / total || 0

			stats.push({
				kioskId,
				name: getKioskName(kioskId, kiosks),
				totalSessions: total,
				completed,
				conversionRate,
				avgDuration
			})
		})

		return stats.sort((a, b) => b.totalSessions - a.totalSessions)
	}, [sessions, kiosks])

	const avgConversion = useMemo(() => {
		if (kioskStats.length === 0) { return 0 }
		return kioskStats.reduce((sum, k) => sum + k.conversionRate, 0) / kioskStats.length
	}, [kioskStats])

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
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Konvertering'}</th>
								<th className="px-4 py-3 text-right font-medium text-gray-500">{'Gns. varighed'}</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{kioskStats.length > 0 ? kioskStats.map((kiosk) => {
								const isOutlier = Math.abs(kiosk.conversionRate - avgConversion) > 15

								return (
									<tr key={kiosk.kioskId} className={`hover:bg-gray-50 ${isOutlier ? 'bg-amber-50' : ''}`}>
										<td className="px-4 py-3 font-medium">{kiosk.name}</td>
										<td className="px-4 py-3 text-right">{kiosk.totalSessions}</td>
										<td className="px-4 py-3 text-right text-green-600">{kiosk.completed}</td>
										<td className="px-4 py-3 text-right">
											<span className={
												kiosk.conversionRate > 50
													? 'text-green-600'
													: kiosk.conversionRate > 30
														? 'text-yellow-600'
														: 'text-red-600'
											}>
												{kiosk.conversionRate}{'%'}
											</span>
										</td>
										<td className="px-4 py-3 text-right">{formatDuration(kiosk.avgDuration)}</td>
									</tr>
								)
							}) : (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-gray-400">
										{'Ingen kiosk data'}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{kioskStats.length > 0 && (
				<div className="text-xs text-gray-500 text-center">
					{'Kiosker med konverteringsrate > 15% fra gennemsnit ('}{roundPercent(avgConversion)}{'%) er markeret'}
				</div>
			)}
		</div>
	)
}
