'use client'

import { type ReactElement, useMemo } from 'react'

import type { InteractionType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	analyzeSession,
	groupInteractionsBySession,
	roundPercent,
	isAutoInteraction
} from './analyticsHelpers'

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
		const conversionRate = total > 0 ? roundPercent((completed / total) * 100) : 0

		return { total, completed, conversionRate }
	}, [sessions])

	const funnelData = useMemo(() => {
		const total = sessions.length
		const reachedOrder = sessions.filter(s =>
			s.interactions.some(i =>
				i.type === 'product_select' || i.type === 'product_increase' ||
				i.type === 'option_select' || i.type === 'option_increase'
			)
		).length
		const reachedCheckout = sessions.filter(s => s.hasCheckoutStart).length
		const completed = sessions.filter(s => s.hasCheckoutComplete).length

		return [
			{ label: 'Sessioner', value: total, pct: 100 },
			{ label: 'Produktvalg', value: reachedOrder, pct: total > 0 ? roundPercent((reachedOrder / total) * 100) : 0 },
			{ label: 'Checkout', value: reachedCheckout, pct: total > 0 ? roundPercent((reachedCheckout / total) * 100) : 0 },
			{ label: 'Gennemført', value: completed, pct: total > 0 ? roundPercent((completed / total) * 100) : 0 }
		]
	}, [sessions])

	const endReasons = useMemo(() => {
		const completed = sessions.filter(s => s.endReason === 'completed').length
		const timedOut = sessions.filter(s => s.endReason === 'timeout').length
		const abandoned = sessions.filter(s => s.endReason === 'abandoned').length
		const manual = sessions.length - completed - timedOut - abandoned

		return { completed, timedOut, abandoned, manual, total: sessions.length }
	}, [sessions])

	const durationScatterData = useMemo(() => {
		return sessions.map((session) => ({
			date: session.startTime,
			y: session.duration / 1000,
			endReason: session.endReason
		}))
	}, [sessions])

	const hourlyActivity = useMemo(() => {
		const hours = Array(24).fill(0)
		for (const interaction of interactions) {
			if (isAutoInteraction(interaction.type) === false) {
				const hour = new Date(interaction.timestamp).getHours()
				hours[hour]++
			}
		}
		return hours
	}, [interactions])

	return (
		<div className="space-y-6">
			{/* Key Stats */}
			<div className="grid grid-cols-3 gap-4">
				<StatCard label="Sessioner" value={stats.total.toString()} />
				<StatCard label="Gennemførte" value={stats.completed.toString()} color="green" />
				<StatCard
					label="Konverteringsrate"
					value={`${stats.conversionRate}%`}
					color={stats.conversionRate > 50 ? 'green' : stats.conversionRate > 30 ? 'yellow' : 'red'}
				/>
			</div>

			{/* Funnel and End Reasons */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Conversion Funnel */}
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
										{step.value}{' ('}{step.pct}{'%)'}
									</div>
								</div>
								<div className="w-16 text-xs text-left pl-2 text-red-500">
									{idx > 0 && funnelData[idx - 1].value > 0 && (
										<span>{`-${roundPercent(100 - (step.value / funnelData[idx - 1].value) * 100)}%`}</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* End Reasons */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-4">{'Afslutningsårsag'}</h3>
					<div className="space-y-2">
						<EndReasonBar label="Gennemført" value={endReasons.completed} total={endReasons.total} color="bg-green-500" />
						<EndReasonBar label="Timeout" value={endReasons.timedOut} total={endReasons.total} color="bg-yellow-500" />
						<EndReasonBar label="Afbrudt betaling" value={endReasons.abandoned} total={endReasons.total} color="bg-red-500" />
						<EndReasonBar label="Manuel afslutning" value={endReasons.manual} total={endReasons.total} color="bg-gray-400" />
					</div>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Duration Scatter */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
					<h3 className="font-semibold text-gray-800 mb-4">{'Session varighed'}</h3>
					<div className="flex-1 min-h-48">
						{durationScatterData.length > 0 ? <DurationScatter data={durationScatterData} /> : (
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

				{/* Hourly Activity */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
					<div className="flex-1 min-h-48">
						<HourChart data={hourlyActivity} label="Aktivitet per time (manuelle handlinger)" />
					</div>
				</div>
			</div>
		</div>
	)
}

function DurationScatter ({ data }: { data: Array<{ date: Date, y: number, endReason: string }> }): ReactElement {
	const maxY = Math.max(...data.map(p => p.y), 60)
	const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), Math.round(maxY)]

	const minTime = Math.min(...data.map(p => p.date.getTime()))
	const maxTime = Math.max(...data.map(p => p.date.getTime()))
	const timeRange = maxTime - minTime || 1

	const xTickCount = 5
	const xTicks = Array.from({ length: xTickCount }, (_, i) => {
		const t = minTime + (timeRange * i) / (xTickCount - 1)
		return new Date(t)
	})

	const formatDate = (d: Date): string => {
		const day = d.getDate()
		const month = d.toLocaleString('da-DK', { month: 'short' })
		if (timeRange < 86400000) {
			return `${day}. ${month} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
		}
		return `${day}. ${month}`
	}

	return (
		<svg viewBox="0 0 420 210" className="w-full h-full" preserveAspectRatio="none">
			{yTicks.map((tick, i) => {
				const y = 180 - (tick / maxY) * 160
				return <line key={i} x1={45} y1={y} x2={415} y2={y} stroke="#f3f4f6" strokeWidth={1} />
			})}
			<line x1={45} y1={20} x2={45} y2={180} stroke="#d1d5db" strokeWidth={1} />
			<line x1={45} y1={180} x2={415} y2={180} stroke="#d1d5db" strokeWidth={1} />
			{yTicks.map((tick, i) => {
				const y = 180 - (tick / maxY) * 160
				return (
					<g key={i}>
						<line x1={40} y1={y} x2={45} y2={y} stroke="#9ca3af" strokeWidth={1} />
						<text x={38} y={y + 3} fontSize={9} fill="#6b7280" textAnchor="end">{tick}{'s'}</text>
					</g>
				)
			})}
			{xTicks.map((tick, i) => {
				const x = 50 + ((tick.getTime() - minTime) / timeRange) * 360
				return (
					<g key={i}>
						<line x1={x} y1={180} x2={x} y2={184} stroke="#9ca3af" strokeWidth={1} />
						<text x={x} y={196} fontSize={7} fill="#6b7280" textAnchor="middle">{formatDate(tick)}</text>
					</g>
				)
			})}
			{data.map((point, idx) => {
				const x = 50 + ((point.date.getTime() - minTime) / timeRange) * 360
				const y = 180 - (point.y / maxY) * 160
				const color = point.endReason === 'completed' ? '#22c55e' :
					point.endReason === 'timeout' ? '#eab308' :
						point.endReason === 'abandoned' ? '#ef4444' : '#9ca3af'
				return <circle key={idx} cx={x} cy={y} r={4} fill={color} opacity={0.7} />
			})}
		</svg>
	)
}

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

function StatCard ({ label, value, color }: { label: string, value: string, color?: 'green' | 'yellow' | 'red' }): ReactElement {
	const colorClass = color === 'green' ? 'text-green-600' : color === 'yellow' ? 'text-yellow-600' : color === 'red' ? 'text-red-600' : 'text-gray-900'

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
			<div className="text-xs text-gray-500 mb-1">{label}</div>
			<div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
		</div>
	)
}

function EndReasonBar ({ label, value, total, color }: { label: string, value: number, total: number, color: string }): ReactElement {
	const pct = total > 0 ? (value / total) * 100 : 0

	return (
		<div className="flex items-center gap-3">
			<div className="w-32 text-sm text-gray-700 shrink-0">{label}</div>
			<div className="flex-1 bg-gray-100 rounded-full h-3 min-w-24">
				<div className={`${color} rounded-full h-3`} style={{ width: `${pct}%` }} />
			</div>
			<div className="w-20 text-right text-sm text-gray-600 shrink-0">{value}{' ('}{roundPercent(pct)}{'%)'}</div>
		</div>
	)
}
