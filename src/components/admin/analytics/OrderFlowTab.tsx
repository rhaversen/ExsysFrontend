import { type ReactElement, useMemo } from 'react'

import { isTimeInOrderWindow } from '@/lib/timeUtils'
import type { KioskType, OrderType, ProductType } from '@/types/backendDataTypes'

import { formatDuration, getKioskName } from './analyticsHelpers'

const QUEUE_GAP_THRESHOLD_MS = 10_000

interface QueuePeriod {
	start: Date
	end: Date
	orderCount: number
	gaps: number[]
	kioskIds: Set<string>
}

function detectQueues (orders: OrderType[]): QueuePeriod[] {
	if (orders.length < 2) { return [] }

	const sorted = [...orders].sort((a, b) =>
		new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	)

	const queues: QueuePeriod[] = []
	let currentQueue: QueuePeriod | null = null

	for (let i = 1; i < sorted.length; i++) {
		const prev = new Date(sorted[i - 1].createdAt)
		const curr = new Date(sorted[i].createdAt)
		const gap = curr.getTime() - prev.getTime()

		if (gap <= QUEUE_GAP_THRESHOLD_MS) {
			if (currentQueue === null) {
				currentQueue = {
					start: prev,
					end: curr,
					orderCount: 2,
					gaps: [gap],
					kioskIds: new Set([sorted[i - 1].kioskId ?? 'unknown', sorted[i].kioskId ?? 'unknown'])
				}
			} else {
				currentQueue.end = curr
				currentQueue.orderCount++
				currentQueue.gaps.push(gap)
				if (sorted[i].kioskId != null) { currentQueue.kioskIds.add(sorted[i].kioskId!) }
			}
		} else {
			if (currentQueue !== null) {
				queues.push(currentQueue)
				currentQueue = null
			}
		}
	}

	if (currentQueue !== null) {
		queues.push(currentQueue)
	}

	return queues
}

function getHourlyOrderCounts (orders: OrderType[]): number[] {
	const counts = new Array(24).fill(0) as number[]
	for (const order of orders) {
		const hour = new Date(order.createdAt).getHours()
		counts[hour]++
	}
	return counts
}

function getDayOfWeekCounts (orders: OrderType[]): number[] {
	const counts = new Array(7).fill(0) as number[]
	for (const order of orders) {
		const day = new Date(order.createdAt).getDay()
		counts[day]++
	}
	return counts
}

const DAY_LABELS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

function computeGapDistribution (orders: OrderType[], products: ProductType[]): Array<{ label: string, count: number }> {
	if (orders.length < 2) { return [] }

	const sorted = [...orders].sort((a, b) =>
		new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	)

	const buckets = [
		{ label: '<5s', max: 5_000, count: 0 },
		{ label: '5-10s', max: 10_000, count: 0 },
		{ label: '10-30s', max: 30_000, count: 0 },
		{ label: '30s-1m', max: 60_000, count: 0 },
		{ label: '1-5m', max: 300_000, count: 0 },
		{ label: '5-15m', max: 900_000, count: 0 },
		{ label: '15m+', max: Infinity, count: 0 }
	]

	for (let i = 1; i < sorted.length; i++) {
		const prev = new Date(sorted[i - 1].createdAt)
		const curr = new Date(sorted[i].createdAt)
		if (!isGapDuringOpenHours(prev, curr, products)) { continue }
		const gap = curr.getTime() - prev.getTime()
		const bucket = buckets.find(b => gap < b.max)
		if (bucket != null) { bucket.count++ }
	}

	return buckets
}

function formatTime (date: Date): string {
	return date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

function formatDate (date: Date): string {
	return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

function isGapDuringOpenHours (gapStart: Date, gapEnd: Date, products: ProductType[]): boolean {
	if (products.length === 0) { return true }

	const startDay = new Date(gapStart)
	startDay.setHours(0, 0, 0, 0)
	const endDay = new Date(gapEnd)
	endDay.setHours(0, 0, 0, 0)
	if (startDay.getTime() !== endDay.getTime()) { return false }

	return products.some(p =>
		p.isActive &&
		isTimeInOrderWindow(gapStart.getHours(), gapStart.getMinutes(), p.orderWindow) &&
		isTimeInOrderWindow(gapEnd.getHours(), gapEnd.getMinutes(), p.orderWindow)
	)
}

export default function OrderFlowTab ({ orders, kiosks, products }: { orders: OrderType[], kiosks: KioskType[], products: ProductType[] }): ReactElement {
	const queues = useMemo(() => detectQueues(orders), [orders])
	const hourlyCounts = useMemo(() => getHourlyOrderCounts(orders), [orders])
	const dayOfWeekCounts = useMemo(() => getDayOfWeekCounts(orders), [orders])
	const gapDistribution = useMemo(() => computeGapDistribution(orders, products), [orders, products])

	const sortedQueues = useMemo(() =>
		[...queues].sort((a, b) => b.orderCount - a.orderCount),
	[queues]
	)

	const totalQueueTime = useMemo(() =>
		queues.reduce((sum, q) => sum + (q.end.getTime() - q.start.getTime()), 0),
	[queues]
	)

	const avgGap = useMemo(() => {
		if (orders.length < 2) { return 0 }
		const sorted = [...orders].sort((a, b) =>
			new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		)
		let total = 0
		let count = 0
		for (let i = 1; i < sorted.length; i++) {
			const prev = new Date(sorted[i - 1].createdAt)
			const curr = new Date(sorted[i].createdAt)
			if (!isGapDuringOpenHours(prev, curr, products)) { continue }
			total += curr.getTime() - prev.getTime()
			count++
		}
		return count > 0 ? total / count : 0
	}, [orders, products])

	const medianGap = useMemo(() => {
		if (orders.length < 2) { return 0 }
		const sorted = [...orders].sort((a, b) =>
			new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		)
		const gaps: number[] = []
		for (let i = 1; i < sorted.length; i++) {
			const prev = new Date(sorted[i - 1].createdAt)
			const curr = new Date(sorted[i].createdAt)
			if (!isGapDuringOpenHours(prev, curr, products)) { continue }
			gaps.push(curr.getTime() - prev.getTime())
		}
		if (gaps.length === 0) { return 0 }
		gaps.sort((a, b) => a - b)
		const mid = Math.floor(gaps.length / 2)
		return gaps.length % 2 === 0 ? (gaps[mid - 1] + gaps[mid]) / 2 : gaps[mid]
	}, [orders, products])

	const hourlyMax = Math.max(...hourlyCounts, 1)
	const dayMax = Math.max(...dayOfWeekCounts, 1)
	const gapMax = Math.max(...gapDistribution.map(b => b.count), 1)

	return (
		<div className="space-y-6">
			{/* Summary stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard label="Ordrer i alt" value={orders.length.toString()} />
				<StatCard label="Køer registreret" value={queues.length.toString()} color="text-orange-600" />
				<StatCard label="Total kø-tid" value={formatDuration(totalQueueTime)} color="text-red-600" />
				<StatCard
					label="Gns. tid mellem ordrer"
					value={orders.length >= 2 ? formatDuration(avgGap) : '–'}
				/>
			</div>

			{/* Gap distribution */}
			<div className="bg-white rounded-xl border border-gray-200 p-5">
				<h3 className="text-sm font-semibold text-gray-700 mb-4">{'Fordeling af tid mellem ordrer'}</h3>
				<div className="flex items-stretch gap-2 h-36">
					{gapDistribution.map(bucket => (
						<div key={bucket.label} className="flex-1 flex flex-col items-center">
							<span className="text-xs font-medium text-gray-700 mb-1">{bucket.count}</span>
							<div className="flex-1 w-full flex items-end">
								<div
									className="w-full bg-indigo-400 rounded-t transition-all hover:bg-indigo-500"
									style={{ height: `${Math.max((bucket.count / gapMax) * 100, bucket.count > 0 ? 4 : 0)}%` }}
								/>
							</div>
							<span className="text-xs text-gray-500 mt-1">{bucket.label}</span>
						</div>
					))}
				</div>
				<div className="mt-3 flex gap-6 text-xs text-gray-500">
					<span>{'Median: '}{formatDuration(medianGap)}</span>
					<span>{'Gennemsnit: '}{formatDuration(avgGap)}</span>
				</div>
			</div>

			{/* Hourly distribution */}
			<div className="bg-white rounded-xl border border-gray-200 p-5">
				<h3 className="text-sm font-semibold text-gray-700 mb-4">{'Ordrer per time (rush-tider)'}</h3>
				<div className="flex items-stretch gap-0.5 h-36">
					{hourlyCounts.map((count, hour) => (
						<div key={hour} className="flex-1 flex flex-col items-center">
							<div className="flex-1 w-full flex items-end">
								<div
									className={`w-full rounded-t transition-all ${
										count / hourlyMax > 0.75
											? 'bg-red-400 hover:bg-red-500'
											: count / hourlyMax > 0.5
												? 'bg-orange-400 hover:bg-orange-500'
												: 'bg-blue-400 hover:bg-blue-500'
									}`}
									style={{ height: `${Math.max((count / hourlyMax) * 100, count > 0 ? 4 : 0)}%` }}
									title={`${hour}:00 — ${count} ordrer`}
								/>
							</div>
							{hour % 2 === 0 && (
								<span className="text-[10px] text-gray-400 mt-1">{hour}</span>
							)}
						</div>
					))}
				</div>
				<div className="flex gap-4 mt-3 text-xs text-gray-400">
					<span className="flex items-center gap-1">
						<span className="w-3 h-3 rounded bg-red-400" />
						{'Høj'}
					</span>
					<span className="flex items-center gap-1">
						<span className="w-3 h-3 rounded bg-orange-400" />
						{'Medium'}
					</span>
					<span className="flex items-center gap-1">
						<span className="w-3 h-3 rounded bg-blue-400" />
						{'Normal'}
					</span>
				</div>
			</div>

			{/* Day of week distribution */}
			<div className="bg-white rounded-xl border border-gray-200 p-5">
				<h3 className="text-sm font-semibold text-gray-700 mb-4">{'Ordrer per ugedag'}</h3>
				<div className="flex items-stretch gap-2 h-32">
					{dayOfWeekCounts.map((count, day) => (
						<div key={day} className="flex-1 flex flex-col items-center">
							<span className="text-xs font-medium text-gray-700 mb-1">{count}</span>
							<div className="flex-1 w-full flex items-end">
								<div
									className="w-full bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
									style={{ height: `${Math.max((count / dayMax) * 100, count > 0 ? 4 : 0)}%` }}
								/>
							</div>
							<span className="text-xs text-gray-500 mt-1">{DAY_LABELS[day]}</span>
						</div>
					))}
				</div>
			</div>

			{/* Queue list */}
			<div className="bg-white rounded-xl border border-gray-200 p-5">
				<h3 className="text-sm font-semibold text-gray-700 mb-1">{'Registrerede køer'}</h3>
				<p className="text-xs text-gray-400 mb-4">{'Perioder med ≤10 sekunder mellem ordrer'}</p>

				{sortedQueues.length === 0
					? (
						<p className="text-sm text-gray-400 py-6 text-center">{'Ingen køer registreret i denne periode'}</p>
					)
					: (
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{sortedQueues.map((queue, i) => {
								const duration = queue.end.getTime() - queue.start.getTime()
								const avgQueueGap = queue.gaps.reduce((s, g) => s + g, 0) / queue.gaps.length

								return (
									<div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
										<div className="flex flex-col items-center shrink-0">
											<span className="text-lg font-bold text-orange-600">{queue.orderCount}</span>
											<span className="text-[10px] text-gray-400">{'ordrer'}</span>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 text-sm">
												<span className="font-medium text-gray-800">
													{formatDate(queue.start)}{' · '}{formatTime(queue.start)}{' – '}{formatTime(queue.end)}
												</span>
											</div>
											<div className="flex gap-3 text-xs text-gray-500 mt-0.5">
												<span>{'Varighed: '}{formatDuration(duration)}</span>
												<span>{'Gns. mellemrum: '}{formatDuration(avgQueueGap)}</span>
												{queue.kioskIds.size > 0 && (
													<span>
														{'Kiosker: '}
														{[...queue.kioskIds]
															.filter(id => id !== 'unknown')
															.map(id => getKioskName(id, kiosks))
															.join(', ') || '–'}
													</span>
												)}
											</div>
										</div>
										<div className="shrink-0">
											<div className="bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 text-xs font-medium">
												{formatDuration(duration)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}
			</div>
		</div>
	)
}

function StatCard ({ label, value, color = 'text-gray-900' }: {
	label: string
	value: string
	color?: string
}): ReactElement {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-4">
			<div className="text-xs text-gray-500 mb-1">{label}</div>
			<div className={`text-xl font-bold ${color}`}>{value}</div>
		</div>
	)
}
