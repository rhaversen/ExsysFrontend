import React, { useState, useRef, useLayoutEffect, useMemo, useCallback } from 'react'

import type { ProductType, Time } from '@/types/backendDataTypes'

// --- Utility Functions ---
// Helper: convert hour/minute to minutes since midnight
function toMinutes (time: Time): number {
	return time.hour * 60 + time.minute
}

// Helper: format minutes as HH:mm
function formatMinutes (mins: number): string {
	const h = Math.floor(mins / 60)
	const m = mins % 60
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Helper to measure text width in px for a given font
function measureTextWidth (text: string, font: string): number {
	type MeasureTextWidthWithCanvas = ((text: string, font: string) => number) & { _canvas?: HTMLCanvasElement }
	const fn = measureTextWidth as MeasureTextWidthWithCanvas
	if (fn._canvas == null) {
		fn._canvas = document.createElement('canvas')
	}
	const canvas = fn._canvas
	const context = canvas.getContext('2d')
	if (context == null) return 0
	context.font = font
	return context.measureText(text).width
}

function getBarSegments (from: number, to: number): Array<{ start: number, end: number }> {
	if (from === to) return []
	// no wrap if ending exactly at midnight
	if (to === 0) return [{ start: from, end: 1440 }]
	if (from < to) return [{ start: from, end: to }]
	return [
		{ start: from, end: 1440 },
		{ start: 0, end: to }
	]
}

// common axis ticks
const AXIS_HOURS = [0, 6, 12, 18, 24]

// build SVG path for a bar segment with independent corner radii
function buildSegmentPath (x: number, w: number, y: number, h: number, rxL: number, rxR: number): string {
	// clamp corner radii so they never exceed half the segment width
	const rLeft = Math.min(rxL, w / 2)
	const rRight = Math.min(rxR, w / 2)
	const iw = Math.max(w - rLeft - rRight, 0)
	return [
		`M${x + rLeft},${y}`,
		`h${iw}`,
		`a${rRight},${rRight} 0 0 1 ${rRight},${rRight}`,
		`v${h - 2 * rRight}`,
		`a${rRight},${rRight} 0 0 1 -${rRight},${rRight}`,
		`h-${iw}`,
		`a${rLeft},${rLeft} 0 0 1 -${rLeft},-${rLeft}`,
		`v-${h - 2 * rLeft}`,
		`a${rLeft},${rLeft} 0 0 1 ${rLeft},-${rLeft}`,
		'Z'
	].join(' ')
}

// inline axis component (top or bottom)
const Axis: React.FC<{
	yOffset: number
	tickDir: -1 | 1
	labelY: number
	timelineWidth: number
	rowCount: number
}> = ({ yOffset, tickDir, labelY, timelineWidth, rowCount }) => (
	<g transform={`translate(${AXIS_HOURS[0] /* placeholder, parent translate applied */},${yOffset})`} className="select-none">
		<line x1={0} y1={0} x2={timelineWidth} y2={0} stroke="#cbd5e0" strokeWidth={1} />
		{AXIS_HOURS.map(hour => {
			const x = (hour / 24) * timelineWidth
			return (
				<g key={hour} className="select-none">
					<line
						x1={x} y1={tickDir * 6} x2={x} y2={0}
						stroke="#e2e8f0" strokeWidth={1}
					/>
					<text x={x} y={labelY} textAnchor="middle" className="text-xs text-gray-500">
						{`${hour.toString().padStart(2, '0')}:00`}
					</text>
				</g>
			)
		})}
	</g>
)

// --- Tooltip Component ---
interface TooltipProps {
	x: number
	y: number
	name: string
	from: number
	to: number
}
const Tooltip: React.FC<TooltipProps> = ({ x, y, name, from, to }) => (
	<g style={{ pointerEvents: 'none', userSelect: 'none' }}>
		<rect
			x={x + 10}
			y={y - 30}
			width={180}
			height={38}
			fill="#fff"
			stroke="#888"
			rx={6}
			style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
		/>
		<text x={x + 20} y={y - 12} fontSize={14} fill="#222" fontWeight={600} style={{ userSelect: 'none' }}>{name}</text>
		<text x={x + 20} y={y + 4} fontSize={13} fill="#444" style={{ userSelect: 'none' }}>
			{formatMinutes(from)}{' - '}{formatMinutes(to)}
		</text>
	</g>
)

// --- Product Timeline Row ---
interface ProductTimelineRowProps {
	product: ProductType
	idx: number
	timelineWidth: number
	labelWidth: number
	onBarHover: (hover: { name: string, from: number, to: number, y: number, x: number } | null) => void
}
const ROW_HEIGHT = 36
const BAR_HEIGHT = 20
const PADDING = 8

const ProductTimelineRow: React.FC<ProductTimelineRowProps> = ({
	product, idx, timelineWidth, labelWidth, onBarHover
}) => {
	const from = toMinutes(product.orderWindow.from)
	const to = toMinutes(product.orderWindow.to)
	const segments = getBarSegments(from, to)
	const y = PADDING + idx * ROW_HEIGHT

	return (
		<g className="select-none">
			{/* stripe */}
			<rect
				x={0} y={y}
				width={labelWidth + timelineWidth + 40}
				height={ROW_HEIGHT}
				className={idx % 2 === 0 ? 'fill-gray-50' : 'fill-white'}
			/>
			{/* per‐row grid */}
			{AXIS_HOURS.map(hour => {
				const xg = labelWidth + (hour / 24) * timelineWidth
				return <line key={hour} x1={xg} y1={y} x2={xg} y2={y + ROW_HEIGHT} stroke="#cbd5e0" strokeWidth={1}/>
			})}
			{/* name */}
			<text
				x={labelWidth - 8} y={y + BAR_HEIGHT + 2} textAnchor="end"
				className="text-[15px] font-medium text-gray-900 select-none"
			>{product.name}</text>
			{/* bars */}
			{segments.map((seg, i) => {
				const x = labelWidth + (seg.start / 1440) * timelineWidth
				const w = ((seg.end - seg.start) / 1440) * timelineWidth
				const wrap = segments.length === 2
				const r = 6
				const rxL = wrap ? (i === 0 ? r : 0) : r
				const rxR = wrap ? (i === segments.length - 1 ? r : 0) : r
				const y0 = y + (ROW_HEIGHT - BAR_HEIGHT) / 2
				const path = buildSegmentPath(x, w, y0, BAR_HEIGHT, rxL, rxR)
				return (
					<path
						key={i} d={path} fill="#3b82f6"
						className="cursor-pointer transition-colors duration-200"
						onMouseEnter={() => { onBarHover({ name: product.name, from, to, y: y0, x }) }}
						onMouseLeave={() => { onBarHover(null) }}
					/>
				)
			})}
		</g>
	)
}

// --- Main Timeline Overview ---
interface Props { products: ProductType[] }

const EntitiesTimelineOverview: React.FC<Props> = ({ products }) => {
	const [hovered, setHovered] = useState<null | { name: string, from: number, to: number, y: number, x: number }>(null)
	const labelFont = '500 15px Inter, Arial, sans-serif'
	const maxLabelWidth = useMemo(() => {
		if (typeof window === 'undefined') return 120
		return Math.ceil(Math.max(...products.map(p => measureTextWidth(p.name, labelFont)), 0)) + 16
	}, [products])
	const [timelineWidth, setTimelineWidth] = useState(600)
	const containerRef = useRef<HTMLDivElement>(null)
	const height = products.length * ROW_HEIGHT + 2 * PADDING

	useLayoutEffect(() => {
		function updateWidth (): void {
			if (containerRef.current != null) {
				setTimelineWidth(Math.max(100, containerRef.current.offsetWidth - maxLabelWidth - 40))
			}
		}
		updateWidth()
		window.addEventListener('resize', updateWidth)
		return () => { window.removeEventListener('resize', updateWidth) }
	}, [maxLabelWidth])

	const handleBarHover = useCallback((hover: TooltipProps | null): void => { setHovered(hover) }, [])

	return (
		<div ref={containerRef} className="overflow-visible" style={{ minHeight: height }}>
			{/* styled title */}
			<h2 className="mb-4 text-lg font-bold text-gray-800">
				{'Produkter og deres bestillingsvinduer\r'}
			</h2>

			{/* SVG frame with background & rounded corners */}
			<svg
				width={maxLabelWidth + timelineWidth + 40}
				height={height}
				className="block select-none bg-white rounded-lg overflow-visible"
			>
				{/* top axis */}
				<g transform={`translate(${maxLabelWidth},${PADDING})`}>
					<Axis
						yOffset={0} tickDir={-1} labelY={-10}
						timelineWidth={timelineWidth} rowCount={products.length}
					/>
				</g>

				{/* rows */}
				{products.map((p, idx) => (
					<ProductTimelineRow
						key={p._id} product={p} idx={idx}
						timelineWidth={timelineWidth}
						labelWidth={maxLabelWidth}
						onBarHover={handleBarHover}
					/>
				))}

				{/* bottom axis */}
				<g transform={`translate(${maxLabelWidth},${PADDING + products.length * ROW_HEIGHT})`}>
					<Axis
						yOffset={0} tickDir={1} labelY={20}
						timelineWidth={timelineWidth} rowCount={products.length}
					/>
				</g>

				{/* tooltip */}
				{(hovered != null) && (
					<Tooltip x={hovered.x} y={hovered.y} name={hovered.name} from={hovered.from} to={hovered.to} />
				)}
			</svg>
		</div>
	)
}

export default EntitiesTimelineOverview
