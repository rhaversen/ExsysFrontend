'use client'

import { type ReactElement, useMemo } from 'react'

import type { InteractionType, KioskType } from '@/types/backendDataTypes'

import { analyzeSession, formatDuration, getKioskName, groupInteractionsBySession } from './analyticsHelpers'

interface FeedbackTabProps {
	interactions: InteractionType[]
	kiosks: KioskType[]
}

interface OpinionFlowStats {
	startedPositive: number
	startedNegative: number
	endedPositive: number
	endedNegative: number
	keptFirst: number
	switchedOnce: number
	switchedBack: number
}

function classifyOpinionFlow (types: string[]): { first: 'positive' | 'negative', last: 'positive' | 'negative', switches: number } {
	const first = types[0].includes('positive') ? 'positive' as const : 'negative' as const
	const last = types[types.length - 1].includes('positive') ? 'positive' as const : 'negative' as const
	let switches = 0
	for (let i = 1; i < types.length; i++) {
		if (types[i] !== types[i - 1]) { switches++ }
	}
	return { first, last, switches }
}

function analyzeOpinionFlows (sessions: Array<{ feedbackTypes: string[] }>): OpinionFlowStats {
	const stats: OpinionFlowStats = {
		startedPositive: 0, startedNegative: 0,
		endedPositive: 0, endedNegative: 0,
		keptFirst: 0, switchedOnce: 0, switchedBack: 0
	}
	for (const { feedbackTypes } of sessions) {
		if (feedbackTypes.length === 0) { continue }
		const flow = classifyOpinionFlow(feedbackTypes)
		if (flow.first === 'positive') { stats.startedPositive++ } else { stats.startedNegative++ }
		if (flow.last === 'positive') { stats.endedPositive++ } else { stats.endedNegative++ }
		if (flow.switches === 0) { stats.keptFirst++ } else if (flow.switches === 1) { stats.switchedOnce++ } else { stats.switchedBack++ }
	}
	return stats
}

function StatCard ({ label, value, subtext }: { label: string, value: string | number, subtext?: string }): ReactElement {
	return (
		<div className="rounded-xl shadow-sm border border-gray-100 p-5">
			<div className="text-sm text-gray-500">{label}</div>
			<div className="text-2xl font-semibold mt-1">{value}</div>
			{subtext !== undefined && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
		</div>
	)
}

function HourChart ({ data, label, fullHeight = false }: { data: number[], label: string, fullHeight?: boolean }): ReactElement {
	const max = Math.max(...data, 1)
	return (
		<div className={fullHeight ? 'h-full flex flex-col' : ''}>
			<div className="text-sm text-gray-500 mb-2">{label}</div>
			<div className={`flex items-end gap-0.5 ${fullHeight ? 'flex-1' : 'h-16'}`}>
				{data.map((count, hour) => (
					<div
						key={hour}
						className="flex-1 bg-blue-400 rounded-t transition-all hover:bg-blue-500"
						style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
						title={`${hour}:00 - ${count}`}
					/>
				))}
			</div>
			<div className="flex justify-between text-xs text-gray-400 mt-1">
				<span>{'00'}</span>
				<span>{'12'}</span>
				<span>{'23'}</span>
			</div>
		</div>
	)
}

function OpinionFlowPanel ({ flow, total }: { flow: OpinionFlowStats, total: number }): ReactElement | null {
	if (total === 0) { return null }
	const pct = (n: number): string => total > 0 ? `${((n / total) * 100).toFixed(0)}%` : '0%'
	const bar = (n: number, color: string): ReactElement => (
		<div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
			<div className={`h-full ${color} rounded-full`} style={{ width: pct(n) }} />
		</div>
	)

	return (
		<div className="rounded-xl shadow-sm border border-gray-100 p-5">
			<div className="text-sm text-gray-500 mb-4">{'Meningsskift'}</div>
			<div className="space-y-5">
				<div>
					<div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{'Første klik'}</div>
					<div className="space-y-1.5">
						<div className="flex items-center gap-3">
							<span className="w-8 text-center">{'👍'}</span>
							{bar(flow.startedPositive, 'bg-green-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.startedPositive} (${pct(flow.startedPositive)})`}</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="w-8 text-center">{'👎'}</span>
							{bar(flow.startedNegative, 'bg-red-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.startedNegative} (${pct(flow.startedNegative)})`}</span>
						</div>
					</div>
				</div>
				<div>
					<div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{'Endeligt valg'}</div>
					<div className="space-y-1.5">
						<div className="flex items-center gap-3">
							<span className="w-8 text-center">{'👍'}</span>
							{bar(flow.endedPositive, 'bg-green-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.endedPositive} (${pct(flow.endedPositive)})`}</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="w-8 text-center">{'👎'}</span>
							{bar(flow.endedNegative, 'bg-red-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.endedNegative} (${pct(flow.endedNegative)})`}</span>
						</div>
					</div>
				</div>
				<div>
					<div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{'Adfærd'}</div>
					<div className="space-y-1.5">
						<div className="flex items-center gap-3">
							<span className="w-8 text-xs text-center text-gray-400">{'—'}</span>
							{bar(flow.keptFirst, 'bg-blue-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.keptFirst} holdt`}</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="w-8 text-xs text-center text-gray-400">{'↔'}</span>
							{bar(flow.switchedOnce, 'bg-amber-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.switchedOnce} skiftet`}</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="w-8 text-xs text-center text-gray-400">{'↔↔'}</span>
							{bar(flow.switchedBack, 'bg-orange-400')}
							<span className="text-xs text-gray-500 w-16 text-right">{`${flow.switchedBack} frem/tilbage`}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function FeedbackTab ({
	interactions,
	kiosks
}: FeedbackTabProps): ReactElement {
	const confirmationBehavior = useMemo(() => {
		const grouped = groupInteractionsBySession(interactions)
		const sessions = Array.from(grouped.values()).map(s => analyzeSession(s, []))

		const sessionsWithCheckout = sessions.filter(s => s.hasCheckoutComplete)
		const sessionsWithFeedback = sessionsWithCheckout.filter(s =>
			s.interactions.some(i => i.type === 'confirmation_feedback_positive' || i.type === 'confirmation_feedback_negative')
		)

		const responseTimes: number[] = []
		const exitBehavior = { feedback: 0, close: 0, timeout: 0 }
		let changedOpinionCount = 0
		const feedbackSessions: Array<{ feedbackTypes: string[] }> = []

		sessionsWithCheckout.forEach(session => {
			const checkoutComplete = session.interactions.find(i => i.type === 'checkout_complete')
			const feedbackInteractions = session.interactions.filter(i =>
				i.type === 'confirmation_feedback_positive' || i.type === 'confirmation_feedback_negative'
			)
			const firstFeedback = feedbackInteractions[0]
			const lastFeedback = feedbackInteractions[feedbackInteractions.length - 1]
			const close = session.interactions.find(i => i.type === 'confirmation_close')
			const timeout = session.interactions.find(i => i.type === 'confirmation_timeout')

			if (feedbackInteractions.length > 0) {
				feedbackSessions.push({ feedbackTypes: feedbackInteractions.map(fi => fi.type) })
			}

			if (feedbackInteractions.length > 1) {
				const hasChange = feedbackInteractions.some((fi, idx) =>
					idx > 0 && fi.type !== feedbackInteractions[idx - 1].type
				)
				if (hasChange) { changedOpinionCount++ }
			}

			if (lastFeedback !== undefined && checkoutComplete !== undefined) {
				const responseTime = new Date(firstFeedback.timestamp).getTime() - new Date(checkoutComplete.timestamp).getTime()
				if (responseTime > 0 && responseTime < 60000) {
					responseTimes.push(responseTime)
				}
				exitBehavior.feedback++
			} else if (close !== undefined) {
				exitBehavior.close++
			} else if (timeout !== undefined) {
				exitBehavior.timeout++
			}
		})

		const avgResponseTime = responseTimes.length > 0
			? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
			: 0

		const feedbackByCartSize = new Map<string, { total: number, withFeedback: number }>()
		sessionsWithCheckout.forEach(session => {
			const cartActions = session.interactions.filter(i =>
				i.type === 'product_select' || i.type === 'product_increase'
			).length
			const sizeCategory = cartActions === 0 ? '0' : cartActions <= 2 ? '1-2' : cartActions <= 5 ? '3-5' : '6+'
			const existing = feedbackByCartSize.get(sizeCategory) ?? { total: 0, withFeedback: 0 }
			existing.total++
			if (session.interactions.some(i => i.type === 'confirmation_feedback_positive' || i.type === 'confirmation_feedback_negative')) {
				existing.withFeedback++
			}
			feedbackByCartSize.set(sizeCategory, existing)
		})

		const byKiosk = new Map<string, { total: number, withFeedback: number }>()
		sessionsWithCheckout.forEach(session => {
			const kioskId = session.kioskId
			if (kioskId === '') { return }
			const existing = byKiosk.get(kioskId) ?? { total: 0, withFeedback: 0 }
			existing.total++
			if (session.interactions.some(i => i.type === 'confirmation_feedback_positive' || i.type === 'confirmation_feedback_negative')) {
				existing.withFeedback++
			}
			byKiosk.set(kioskId, existing)
		})

		const kioskEngagement = Array.from(byKiosk.entries())
			.map(([kioskId, stats]) => ({
				kioskId,
				name: getKioskName(kioskId, kiosks),
				...stats,
				rate: stats.total > 0 ? (stats.withFeedback / stats.total) * 100 : 0
			}))
			.filter(k => k.total >= 3)
			.sort((a, b) => b.rate - a.rate)

		const opinionFlow = analyzeOpinionFlows(feedbackSessions)

		return {
			totalCheckouts: sessionsWithCheckout.length,
			totalWithFeedback: sessionsWithFeedback.length,
			responseRate: sessionsWithCheckout.length > 0
				? (sessionsWithFeedback.length / sessionsWithCheckout.length) * 100
				: 0,
			avgResponseTime,
			exitBehavior,
			changedOpinionCount,
			changedOpinionRate: sessionsWithFeedback.length > 0
				? (changedOpinionCount / sessionsWithFeedback.length) * 100
				: 0,
			opinionFlow,
			feedbackByCartSize: Array.from(feedbackByCartSize.entries())
				.map(([size, stats]) => ({ size, ...stats, rate: stats.total > 0 ? (stats.withFeedback / stats.total) * 100 : 0 }))
				.sort((a, b) => {
					const order = ['0', '1-2', '3-5', '6+']
					return order.indexOf(a.size) - order.indexOf(b.size)
				}),
			kioskEngagement
		}
	}, [interactions, kiosks])

	const risRosBehavior = useMemo(() => {
		const grouped = groupInteractionsBySession(interactions)
		const groupedEntries = Array.from(grouped.entries())

		const sessionsWithBannerClick = groupedEntries.filter(([, ints]) =>
			ints.some(i => i.type === 'feedback_banner_click')
		)

		const completedFeedback = sessionsWithBannerClick.filter(([, ints]) =>
			ints.some(i => i.type === 'feedback_positive' || i.type === 'feedback_negative')
		)

		const abandoned = sessionsWithBannerClick.filter(([, ints]) =>
			!ints.some(i => i.type === 'feedback_positive' || i.type === 'feedback_negative')
		)

		let changedOpinionCount = 0
		const feedbackSessions: Array<{ feedbackTypes: string[] }> = []
		completedFeedback.forEach(([, ints]) => {
			const feedbackInteractions = ints.filter(i =>
				i.type === 'feedback_positive' || i.type === 'feedback_negative'
			)
			feedbackSessions.push({ feedbackTypes: feedbackInteractions.map(fi => fi.type) })
			if (feedbackInteractions.length > 1) {
				const hasChange = feedbackInteractions.some((fi, idx) =>
					idx > 0 && fi.type !== feedbackInteractions[idx - 1].type
				)
				if (hasChange) { changedOpinionCount++ }
			}
		})

		const abandonReasons = { back: 0, autoBack: 0, other: 0 }
		abandoned.forEach(([, ints]) => {
			if (ints.some(i => i.type === 'feedback_back')) {
				abandonReasons.back++
			} else if (ints.some(i => i.type === 'feedback_auto_back')) {
				abandonReasons.autoBack++
			} else {
				abandonReasons.other++
			}
		})

		const timeOnFeedbackPage: number[] = []
		sessionsWithBannerClick.forEach(([, ints]) => {
			const bannerClick = ints.find(i => i.type === 'feedback_banner_click')
			const exit = [...ints].reverse().find(i =>
				i.type === 'feedback_back' || i.type === 'feedback_auto_back'
			)
			if (bannerClick !== undefined && exit !== undefined) {
				const time = new Date(exit.timestamp).getTime() - new Date(bannerClick.timestamp).getTime()
				if (time > 0 && time < 120000) {
					timeOnFeedbackPage.push(time)
				}
			}
		})

		const avgTimeOnPage = timeOnFeedbackPage.length > 0
			? timeOnFeedbackPage.reduce((a, b) => a + b, 0) / timeOnFeedbackPage.length
			: 0

		const feedbackTiming = { beforeOrder: 0, afterOrder: 0, noOrder: 0 }
		sessionsWithBannerClick.forEach(([, ints]) => {
			const bannerClick = ints.find(i => i.type === 'feedback_banner_click')
			const checkout = ints.find(i => i.type === 'checkout_complete')

			if (bannerClick === undefined) { return }

			if (checkout === undefined) {
				feedbackTiming.noOrder++
			} else {
				const bannerTime = new Date(bannerClick.timestamp).getTime()
				const checkoutTime = new Date(checkout.timestamp).getTime()
				if (bannerTime < checkoutTime) {
					feedbackTiming.beforeOrder++
				} else {
					feedbackTiming.afterOrder++
				}
			}
		})

		const bannerClicksByHour = new Array(24).fill(0) as number[]
		interactions.filter(i => i.type === 'feedback_banner_click').forEach(i => {
			bannerClicksByHour[new Date(i.timestamp).getHours()]++
		})

		const opinionFlow = analyzeOpinionFlows(feedbackSessions)

		return {
			totalBannerClicks: sessionsWithBannerClick.length,
			completedCount: completedFeedback.length,
			abandonedCount: abandoned.length,
			completionRate: sessionsWithBannerClick.length > 0
				? (completedFeedback.length / sessionsWithBannerClick.length) * 100
				: 0,
			changedOpinionCount,
			changedOpinionRate: completedFeedback.length > 0
				? (changedOpinionCount / completedFeedback.length) * 100
				: 0,
			opinionFlow,
			abandonReasons,
			avgTimeOnPage,
			feedbackTiming,
			bannerClicksByHour
		}
	}, [interactions])

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-lg font-semibold text-gray-800 mb-2">{'Bekræftelsesskærm Adfærd'}</h2>
				<p className="text-sm text-gray-500 mb-4">{'Hvordan brugere interagerer med feedback efter ordre'}</p>

				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
					<StatCard
						label="Interaktionsrate"
						value={`${confirmationBehavior.responseRate.toFixed(0)}%`}
						subtext={`${confirmationBehavior.totalWithFeedback} af ${confirmationBehavior.totalCheckouts} ordrer`}
					/>
					<StatCard
						label="Gns. responstid"
						value={confirmationBehavior.avgResponseTime > 0 ? formatDuration(confirmationBehavior.avgResponseTime) : '-'}
						subtext="Fra ordre til klik"
					/>
					<StatCard
						label="Skiftede mening"
						value={confirmationBehavior.changedOpinionCount}
						subtext={`${confirmationBehavior.changedOpinionRate.toFixed(0)}% af feedback`}
					/>
					<StatCard
						label="Lukket manuelt"
						value={confirmationBehavior.exitBehavior.close}
						subtext="Uden feedback"
					/>
					<StatCard
						label="Timeout"
						value={confirmationBehavior.exitBehavior.timeout}
						subtext="Ingen interaktion"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="rounded-xl shadow-sm border border-gray-100 p-5">
						<div className="text-sm text-gray-500 mb-3">{'Feedback rate efter kurvstørrelse'}</div>
						<div className="space-y-3">
							{confirmationBehavior.feedbackByCartSize.map(item => (
								<div key={item.size} className="flex items-center gap-3">
									<div className="w-12 text-sm text-gray-600">{`${item.size} varer`}</div>
									<div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-blue-400"
											style={{ width: `${item.rate}%` }}
										/>
									</div>
									<div className="text-xs text-gray-500 w-20 text-right">
										{`${item.rate.toFixed(0)}% (${item.withFeedback}/${item.total})`}
									</div>
								</div>
							))}
						</div>
					</div>

					{confirmationBehavior.kioskEngagement.length > 0 && (
						<div className="rounded-xl shadow-sm border border-gray-100 p-5">
							<div className="text-sm text-gray-500 mb-3">{'Engagement per kiosk'}</div>
							<div className="space-y-2">
								{confirmationBehavior.kioskEngagement.slice(0, 5).map(kiosk => (
									<div key={kiosk.kioskId} className="flex items-center gap-3">
										<div className="w-24 text-sm truncate">{kiosk.name}</div>
										<div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="h-full bg-blue-400"
												style={{ width: `${kiosk.rate}%` }}
											/>
										</div>
										<div className="text-xs text-gray-500 w-20 text-right">
											{`${kiosk.rate.toFixed(0)}% (${kiosk.withFeedback}/${kiosk.total})`}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					<OpinionFlowPanel flow={confirmationBehavior.opinionFlow} total={confirmationBehavior.totalWithFeedback} />
				</div>
			</div>

			<div className="border-t border-gray-200 pt-8">
				<h2 className="text-lg font-semibold text-gray-800 mb-2">{'Ris og Ros Adfærd'}</h2>
				<p className="text-sm text-gray-500 mb-4">{'Brugerflow fra banner til feedback'}</p>

				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
					<StatCard
						label="Banner klik"
						value={risRosBehavior.totalBannerClicks}
						subtext="Sessioner med klik"
					/>
					<StatCard
						label="Fuldført"
						value={risRosBehavior.completedCount}
						subtext={`${risRosBehavior.completionRate.toFixed(0)}% gennemførsel`}
					/>
					<StatCard
						label="Skiftede mening"
						value={risRosBehavior.changedOpinionCount}
						subtext={`${risRosBehavior.changedOpinionRate.toFixed(0)}% af feedback`}
					/>
					<StatCard
						label="Afbrudt"
						value={risRosBehavior.abandonedCount}
						subtext={`${risRosBehavior.abandonReasons.back} manuel, ${risRosBehavior.abandonReasons.autoBack} timeout`}
					/>
					<StatCard
						label="Tid på side"
						value={risRosBehavior.avgTimeOnPage > 0 ? formatDuration(risRosBehavior.avgTimeOnPage) : '-'}
						subtext="Gennemsnit"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="rounded-xl shadow-sm border border-gray-100 p-5">
						<HourChart data={risRosBehavior.bannerClicksByHour} label="Banner klik fordelt på tidspunkt" fullHeight />
					</div>
					<OpinionFlowPanel flow={risRosBehavior.opinionFlow} total={risRosBehavior.completedCount} />

					<div className="rounded-xl shadow-sm border border-gray-100 p-5">
						<div className="text-sm text-gray-500 mb-3">{'Feedback timing i forhold til ordre'}</div>
						<div className="space-y-4">
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span className="text-gray-600">{'Før ordre'}</span>
									<span className="text-gray-500">{risRosBehavior.feedbackTiming.beforeOrder}</span>
								</div>
								<div className="h-3 bg-gray-100 rounded-full overflow-hidden">
									<div
										className="h-full bg-amber-400"
										style={{
											width: risRosBehavior.totalBannerClicks > 0
												? `${(risRosBehavior.feedbackTiming.beforeOrder / risRosBehavior.totalBannerClicks) * 100}%`
												: '0%'
										}}
									/>
								</div>
							</div>
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span className="text-gray-600">{'Efter ordre'}</span>
									<span className="text-gray-500">{risRosBehavior.feedbackTiming.afterOrder}</span>
								</div>
								<div className="h-3 bg-gray-100 rounded-full overflow-hidden">
									<div
										className="h-full bg-green-400"
										style={{
											width: risRosBehavior.totalBannerClicks > 0
												? `${(risRosBehavior.feedbackTiming.afterOrder / risRosBehavior.totalBannerClicks) * 100}%`
												: '0%'
										}}
									/>
								</div>
							</div>
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span className="text-gray-600">{'Uden ordre'}</span>
									<span className="text-gray-500">{risRosBehavior.feedbackTiming.noOrder}</span>
								</div>
								<div className="h-3 bg-gray-100 rounded-full overflow-hidden">
									<div
										className="h-full bg-gray-400"
										style={{
											width: risRosBehavior.totalBannerClicks > 0
												? `${(risRosBehavior.feedbackTiming.noOrder / risRosBehavior.totalBannerClicks) * 100}%`
												: '0%'
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
