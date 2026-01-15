'use client'

import { type ReactElement, useMemo } from 'react'

import type { InteractionType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	calcPercentileStats,
	analyzeSession,
	groupInteractionsBySession,
	formatDuration
} from './analyticsHelpers'

function HourChart ({ data, label }: { data: number[], label: string }): ReactElement {
	const max = Math.max(...data, 1)
	const yTicks = [0, Math.round(max * 0.5), max]
	return (
		<div className="h-full flex flex-col">
			<div className="text-sm text-gray-500 mb-2">{label}</div>
			<div className="flex flex-1">
				<div className="flex flex-col justify-between text-xs text-gray-400 pr-2 py-1">
					{yTicks.slice().reverse().map((tick, i) => (
						<span key={i}>{tick}</span>
					))}
				</div>
				<div className="flex items-end gap-0.5 flex-1">
					{data.map((count, hour) => (
						<div
							key={hour}
							className="flex-1 bg-indigo-400 rounded-t transition-all hover:bg-indigo-500"
							style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
							title={`${hour}:00 - ${count}`}
						/>
					))}
				</div>
			</div>
			<div className="flex justify-between text-xs text-gray-400 mt-1 ml-6">
				<span>{'00'}</span>
				<span>{'12'}</span>
				<span>{'23'}</span>
			</div>
		</div>
	)
}

interface OverviewTabProps {
	interactions: InteractionType[]
	orders: OrderType[]
}

export default function OverviewTab ({
	interactions,
	orders
}: OverviewTabProps): ReactElement {
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

	const stats = useMemo(() => {
		const total = sessions.length
		const completed = sessions.filter(s => s.endReason === 'completed').length
		const timedOut = sessions.filter(s => s.endReason === 'timeout').length
		const abandoned = sessions.filter(s => s.endReason === 'abandoned').length
		const checkoutStarted = sessions.filter(s => s.hasCheckoutStart).length

		const conversionRate = total > 0 ? (completed / total) * 100 : 0
		const timeoutRate = total > 0 ? (timedOut / total) * 100 : 0
		const abandonmentRate = checkoutStarted > 0
			? ((checkoutStarted - completed) / checkoutStarted) * 100
			: 0

		const durations = sessions.map(s => s.duration)
		const durationStats = calcPercentileStats(durations)

		const totalInteractions = sessions.reduce((sum, s) => sum + s.interactionCount, 0)
		const avgInteractionsPerSession = total > 0 ? totalInteractions / total : 0

		return {
			total,
			completed,
			timedOut,
			abandoned,
			conversionRate,
			timeoutRate,
			abandonmentRate,
			avgDuration: durationStats.avg,
			medianDuration: durationStats.median,
			avgInteractionsPerSession
		}
	}, [sessions])

	const funnelData = useMemo(() => {
		const total = sessions.length
		const reachedActivity = sessions.filter(s =>
			s.interactions.some(i => i.type === 'activity_select' || i.type === 'activity_auto_select')
		).length
		const reachedRoom = sessions.filter(s =>
			s.interactions.some(i => i.type === 'room_select' || i.type === 'room_auto_select')
		).length
		const reachedCheckout = sessions.filter(s => s.hasCheckoutStart).length
		const completed = sessions.filter(s => s.hasCheckoutComplete).length

		return [
			{ label: 'Sessioner', value: total, pct: 100 },
			{ label: 'Aktivitet', value: reachedActivity, pct: total > 0 ? (reachedActivity / total) * 100 : 0 },
			{ label: 'Lokale', value: reachedRoom, pct: total > 0 ? (reachedRoom / total) * 100 : 0 },
			{ label: 'Checkout', value: reachedCheckout, pct: total > 0 ? (reachedCheckout / total) * 100 : 0 },
			{ label: 'Gennemført', value: completed, pct: total > 0 ? (completed / total) * 100 : 0 }
		]
	}, [sessions])

	const dropOffByPage = useMemo(() => {
		const counts: Record<string, number> = {
			welcome: 0,
			activity: 0,
			room: 0,
			order: 0,
			checkout: 0,
			feedback: 0,
			unknown: 0
		}
		for (const session of sessions) {
			if (session.endReason !== 'completed') {
				counts[session.lastViewState] = (counts[session.lastViewState] ?? 0) + 1
			}
		}
		return counts
	}, [sessions])

	const durationScatterData = useMemo(() => {
		return sessions.map((session, idx) => ({
			x: idx,
			y: session.duration / 1000,
			endReason: session.endReason
		}))
	}, [sessions])

	const hourlyActivity = useMemo(() => {
		const hours = Array(24).fill(0)
		for (const interaction of interactions) {
			const hour = new Date(interaction.timestamp).getHours()
			hours[hour]++
		}
		return hours
	}, [interactions])

	const topProducts = useMemo(() => {
		const productInteractions = interactions.filter(i =>
			['product_select', 'product_increase', 'product_decrease',
				'option_select', 'option_increase', 'option_decrease'].includes(i.type)
		)
		const selectionCount = productInteractions.filter(i =>
			['product_select', 'product_increase', 'option_select', 'option_increase'].includes(i.type)
		).length
		const deselectionCount = productInteractions.filter(i =>
			['product_decrease', 'option_decrease'].includes(i.type)
		).length
		return { total: productInteractions.length, selectionCount, deselectionCount }
	}, [interactions])

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<StatCard label="Sessioner" value={stats.total.toString()} />
				<StatCard label="Interaktioner" value={interactions.length.toString()} />
				<StatCard label="Gns. interaktioner/session" value={stats.avgInteractionsPerSession.toFixed(1)} />
				<StatCard
					label="Konverteringsrate"
					value={`${stats.conversionRate.toFixed(1)}%`}
					color={stats.conversionRate > 50 ? 'green' : stats.conversionRate > 30 ? 'yellow' : 'red'}
				/>
				<StatCard
					label="Timeout rate"
					value={`${stats.timeoutRate.toFixed(1)}%`}
					color={stats.timeoutRate < 20 ? 'green' : stats.timeoutRate < 40 ? 'yellow' : 'red'}
				/>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard label="Gns. varighed" value={formatDuration(stats.avgDuration)} />
				<StatCard label="Median varighed" value={formatDuration(stats.medianDuration)} />
				<StatCard
					label="Checkout afbrydelse"
					value={`${stats.abandonmentRate.toFixed(1)}%`}
					color={stats.abandonmentRate < 30 ? 'green' : stats.abandonmentRate < 50 ? 'yellow' : 'red'}
				/>
				<StatCard label="Gennemførte" value={stats.completed.toString()} color="green" />
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Konverteringstragt'}</h3>
				<div className="flex flex-col items-center space-y-1">
					{funnelData.map((step, idx) => (
						<div key={step.label} className="w-full flex items-center">
							<div className="w-24 text-sm text-right pr-3">{step.label}</div>
							<div className="flex-1 flex justify-center">
								<div
									className="bg-blue-500 h-10 rounded transition-all flex items-center justify-center text-white text-sm font-medium"
									style={{ width: `${step.pct}%`, minWidth: step.pct > 0 ? '60px' : '0' }}
								>
									{step.value}{' ('}{step.pct.toFixed(0)}{'%)\r'}
								</div>
							</div>
							<div className="w-16 text-xs text-left pl-2 text-red-500">
								{idx > 0 && funnelData[idx - 1].value > 0 && (
									<span>{`-${(100 - (step.value / funnelData[idx - 1].value) * 100).toFixed(0)}%`}</span>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Afslutningsårsag'}</h3>
					<div className="space-y-2">
						<EndReasonBar label="Gennemført" value={stats.completed} total={stats.total} color="bg-green-500" />
						<EndReasonBar label="Timeout" value={stats.timedOut} total={stats.total} color="bg-yellow-500" />
						<EndReasonBar label="Afbrudt betaling" value={stats.abandoned} total={stats.total} color="bg-red-500" />
						<EndReasonBar
							label="Manuel afslutning"
							value={stats.total - stats.completed - stats.timedOut - stats.abandoned}
							total={stats.total}
							color="bg-gray-400"
						/>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Frafald per side'}</h3>
					<div className="space-y-2">
						{Object.entries(dropOffByPage).filter(([, v]) => v > 0).map(([page, count]) => (
							<div key={page} className="flex justify-between text-sm">
								<span className="capitalize">{page}</span>
								<span className="font-medium">{count}</span>
							</div>
						))}
						{Object.values(dropOffByPage).every(v => v === 0) && (
							<div className="text-gray-400 text-sm">{'Ingen frafald'}</div>
						)}
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Produktinteraktioner'}</h3>
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span>{'Tilføjelser til kurv'}</span>
							<span className="text-green-600 font-medium">{topProducts.selectionCount}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>{'Fjernelser fra kurv'}</span>
							<span className="text-red-600 font-medium">{topProducts.deselectionCount}</span>
						</div>
						<div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
							<span>{'Netto tilføjelser'}</span>
							<span className={topProducts.selectionCount - topProducts.deselectionCount >= 0 ? 'text-green-600' : 'text-red-600'}>
								{topProducts.selectionCount - topProducts.deselectionCount}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
					<h3 className="font-semibold text-gray-800 mb-4">{'Session varighed'}</h3>
					<div className="flex-1 min-h-48">
						{durationScatterData.length > 0 ? (() => {
							const maxY = Math.max(...durationScatterData.map(p => p.y), 60)
							const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), Math.round(maxY)]
							return (
								<svg viewBox="0 0 420 200" className="w-full h-full" preserveAspectRatio="none">
									{/* Grid lines */}
									{yTicks.map((tick, i) => {
										const y = 180 - (tick / maxY) * 160
										return (
											<line key={i} x1={45} y1={y} x2={415} y2={y} stroke="#f3f4f6" strokeWidth={1} />
										)
									})}

									{/* Y axis */}
									<line x1={45} y1={20} x2={45} y2={180} stroke="#d1d5db" strokeWidth={1} />
									{/* X axis */}
									<line x1={45} y1={180} x2={415} y2={180} stroke="#d1d5db" strokeWidth={1} />

									{/* Y axis ticks and labels */}
									{yTicks.map((tick, i) => {
										const y = 180 - (tick / maxY) * 160
										return (
											<g key={i}>
												<line x1={40} y1={y} x2={45} y2={y} stroke="#9ca3af" strokeWidth={1} />
												<text x={38} y={y + 3} fontSize={9} fill="#6b7280" textAnchor="end">{tick}{'s'}</text>
											</g>
										)
									})}

									{/* Data points */}
									{durationScatterData.map((point, idx) => {
										const x = 50 + (point.x / Math.max(durationScatterData.length - 1, 1)) * 360
										const y = 180 - (point.y / maxY) * 160
										const color = point.endReason === 'completed' ? '#22c55e' :
											point.endReason === 'timeout' ? '#eab308' :
												point.endReason === 'abandoned' ? '#ef4444' : '#9ca3af'
										return (
											<circle
												key={idx}
												cx={x}
												cy={y}
												r={4}
												fill={color}
												opacity={0.7}
											/>
										)
									})}
								</svg>
							)
						})() : (
							<div className="flex items-center justify-center h-full text-gray-400">{'Ingen data'}</div>
						)}
					</div>
					<div className="flex justify-center gap-4 mt-3 text-xs text-gray-600">
						<span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />{'Gennemført'}</span>
						<span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5" />{'Timeout'}</span>
						<span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />{'Afbrudt'}</span>
						<span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-1.5" />{'Manuel'}</span>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
					<div className="flex-1 min-h-48">
						<HourChart data={hourlyActivity} label="Aktivitet per time" />
					</div>
				</div>
			</div>
		</div>
	)
}

function StatCard ({
	label,
	value,
	color
}: {
	label: string
	value: string
	color?: 'green' | 'yellow' | 'red'
}): ReactElement {
	const colorClass = color === 'green'
		? 'text-green-600'
		: color === 'yellow'
			? 'text-yellow-600'
			: color === 'red'
				? 'text-red-600'
				: 'text-gray-900'

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
			<div className="text-xs text-gray-500 mb-1">{label}</div>
			<div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
		</div>
	)
}

function EndReasonBar ({
	label,
	value,
	total,
	color
}: {
	label: string
	value: number
	total: number
	color: string
}): ReactElement {
	const pct = total > 0 ? (value / total) * 100 : 0
	return (
		<div className="flex items-center gap-3">
			<div className="w-32 text-sm text-gray-700 shrink-0">{label}</div>
			<div className="flex-1 bg-gray-100 rounded-full h-3 min-w-24">
				<div className={`${color} rounded-full h-3`} style={{ width: `${pct}%` }} />
			</div>
			<div className="w-20 text-right text-sm text-gray-600 shrink-0">{value}{' ('}{pct.toFixed(0)}{'%)'}</div>
		</div>
	)
}
