'use client'

import { type ReactElement, useState, useEffect, useRef, useCallback } from 'react'

import { getColorsForNames } from '@/lib/colorUtils'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const POLL_INTERVAL = 60_000 * 5 // 5 minutes

interface ActivityStat {
	name: string
	count: number
}

interface PublicStats {
	ordersToday: number
	ordersAllTime: number
	activityOrdersToday: ActivityStat[]
	activityOrdersAllTime: ActivityStat[]
}

function PieChart ({ data }: { data: ActivityStat[] }): ReactElement | null {
	const sorted = [...data].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
	const colors = getColorsForNames(sorted.map(d => d.name), 'activity')

	if (sorted.length === 0 || sorted.every(d => d.count === 0)) {
		return null
	}

	const total = sorted.reduce((sum, d) => sum + d.count, 0)
	const size = 160
	const radius = 60
	const cx = size / 2
	const cy = size / 2

	const slices = sorted.reduce<{ items: Array<{ path: string, color: string, name: string, count: number, pct: string }>, angle: number }>((acc, item, i) => {
		const fraction = item.count / total
		const sliceAngle = fraction * 2 * Math.PI
		const endAngle = acc.angle + sliceAngle
		const largeArc = sliceAngle > Math.PI ? 1 : 0

		const x1 = cx + radius * Math.cos(acc.angle)
		const y1 = cy + radius * Math.sin(acc.angle)
		const x2 = cx + radius * Math.cos(endAngle)
		const y2 = cy + radius * Math.sin(endAngle)

		let path: string
		if (sorted.length === 1) {
			path = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
		} else {
			path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
		}

		acc.items.push({ path, color: colors[i], name: item.name, count: item.count, pct: (fraction * 100).toFixed(1) })
		acc.angle = endAngle
		return acc
	}, { items: [], angle: -Math.PI / 2 }).items

	return (
		<div className="flex flex-col items-center h-full w-full overflow-hidden">
			<svg viewBox={`0 0 ${size} ${size}`} className="flex-1 min-h-0 w-auto">
				{slices.map((s, i) => (
					<path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1">
						<title>{`${s.name}: ${s.count} (${s.pct}%)`}</title>
					</path>
				))}
			</svg>
			<div className="flex flex-wrap justify-center gap-x-[0.8em] gap-y-[0.2em] text-[1.4em] shrink-0">
				{slices.map((s, i) => (
					<div key={i} className="flex items-center gap-[0.3em] whitespace-nowrap">
						<span className="inline-block w-[0.8em] h-[0.8em] rounded-full shrink-0" style={{ backgroundColor: s.color }} />
						<span className="text-gray-700">{s.name}</span>
						<span className="text-gray-400">{s.count}</span>
					</div>
				))}
			</div>
		</div>
	)
}

const EMBED_URL = 'https://kantine.nyskivehus.dk/stats'
const STAGING_EMBED_URL = 'https://staging.kantine.nyskivehus.dk/stats'

function EmbedInstructions (): ReactElement | null {
	const [isEmbedded, setIsEmbedded] = useState(true)
	const [showEmbed, setShowEmbed] = useState(true)

	useEffect(() => {
		try {
			setIsEmbedded(window.self !== window.top)
		} catch {
			setIsEmbedded(true)
		}
	}, [])

	if (isEmbedded) { return null }

	const isStaging = typeof window !== 'undefined' && window.location.hostname.startsWith('staging.')
	const url = isStaging ? STAGING_EMBED_URL : EMBED_URL
	const snippet = `<iframe src="${url}" style="width:100%;height:600px;border:none;" loading="lazy"></iframe>`

	return (
		<div className="fixed bottom-3 right-3 z-50 text-sm">
			{!showEmbed && (
				<button
					onClick={() => { setShowEmbed(true) }}
					className="bg-white border border-gray-200 shadow-md rounded-lg px-3 py-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
				>
					{'Embed'}
				</button>
			)}
			{showEmbed && (
				<div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4 max-w-md">
					<div className="flex items-center justify-between mb-2">
						<span className="font-medium text-gray-700">{'Indlejr denne side'}</span>
						<button
							onClick={() => { setShowEmbed(false) }}
							className="text-gray-400 hover:text-gray-600 cursor-pointer"
						>
							{'✕'}
						</button>
					</div>
					<p className="text-gray-500 mb-2">{'Kopiér koden herunder for at indlejre statistik på din hjemmeside:'}</p>
					<pre className="bg-gray-100 rounded p-2 text-xs text-gray-800 overflow-x-auto select-all whitespace-pre-wrap break-all">{snippet}</pre>
				</div>
			)}
		</div>
	)
}

export default function PublicStatsPage (): ReactElement {
	const [stats, setStats] = useState<PublicStats | null>(null)
	const [error, setError] = useState(false)
	const prevJsonRef = useRef<string>('')

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch(`${API_URL}/v1/public-stats`, { cache: 'no-store' })
			if (!res.ok) { throw new Error('fetch failed') }
			const json = await res.json() as PublicStats
			const jsonStr = JSON.stringify(json)
			if (jsonStr !== prevJsonRef.current) {
				prevJsonRef.current = jsonStr
				setStats(json)
			}
			setError(false)
		} catch {
			setError(true)
		}
	}, [])

	useEffect(() => {
		fetchStats()
		const interval = setInterval(fetchStats, POLL_INTERVAL)
		return () => clearInterval(interval)
	}, [fetchStats])

	return (
		<div className="h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 text-[min(1.8vw,2.2vh)] grid grid-cols-2 gap-[min(1vw,1vh)] p-[min(1vw,1vh)]">
			<EmbedInstructions />

			{error && stats === null && (
				<div className="col-span-2 flex items-center justify-center text-red-500">{'Kunne ikke hente data'}</div>
			)}

			{stats === null && !error && (
				<div className="col-span-2 flex items-center justify-center text-gray-400">{'Henter data...'}</div>
			)}

			{stats !== null && (
				<>
					<div className="bg-white rounded-[min(0.8vw,0.8vh)] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
						<div className="flex flex-col items-center justify-center p-[min(0.8vw,0.8vh)]">
							<div className="text-[2em] text-gray-600">{'Ordrer i dag'}</div>
							<div className="text-[3.5em] font-bold text-blue-600 leading-none">{stats.ordersToday}</div>
						</div>
						<div className="flex-1 min-h-0 p-[min(0.8vw,0.8vh)]">
							<PieChart data={stats.activityOrdersToday} />
						</div>
					</div>

					<div className="bg-white rounded-[min(0.8vw,0.8vh)] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
						<div className="flex flex-col items-center justify-center p-[min(0.8vw,0.8vh)]">
							<div className="text-[2em] text-gray-600">{'Ordrer i alt'}</div>
							<div className="text-[3.5em] font-bold text-blue-600 leading-none">{stats.ordersAllTime}</div>
						</div>
						<div className="flex-1 min-h-0 p-[min(0.8vw,0.8vh)]">
							<PieChart data={stats.activityOrdersAllTime} />
						</div>
					</div>
				</>
			)}
		</div>
	)
}

