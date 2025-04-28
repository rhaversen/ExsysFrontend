import React, { useState, useRef, useLayoutEffect } from 'react'

interface SvgLineGraphProps {
  data: number[]
  labels: string[]
  width?: number
  height?: number
  color?: string
  label?: string
  yLabel?: string
  showTodayIndicator?: boolean
}

const SvgLineGraph: React.FC<SvgLineGraphProps> = ({
	data,
	labels,
	width = 500,
	height = 180,
	color = '#2563eb',
	label,
	yLabel,
	showTodayIndicator = false
}) => {
	const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)
	const [tooltipDims, setTooltipDims] = useState<{ width: number, height: number }>({ width: 0, height: 0 })
	const tooltipTextRef = useRef<SVGTextElement>(null)

	// responsiveness: measure container width
	const containerRef = useRef<HTMLDivElement>(null)
	const [chartWidth, setChartWidth] = useState<number>(width)

	useLayoutEffect(() => {
		if (tooltip && tooltipTextRef.current) {
			const bbox = tooltipTextRef.current.getBBox()
			setTooltipDims({ width: bbox.width, height: bbox.height })
		}
	}, [tooltip])

	useLayoutEffect(() => {
		function updateWidth () {
			if (containerRef.current) {
				setChartWidth(containerRef.current.offsetWidth)
			}
		}
		updateWidth()
		window.addEventListener('resize', updateWidth)
		return () => window.removeEventListener('resize', updateWidth)
	}, [width])

	if (data.length === 0 || data.every(d => d === 0)) {
		return <div className="text-gray-400 p-4 text-center">{'Ingen data'}</div>
	}

	// Padding for axes
	const paddingLeft = 64
	const paddingRight = 32
	const paddingTop = 32
	const paddingBottom = 32
	const graphWidth = chartWidth - paddingLeft - paddingRight
	const graphHeight = height - paddingTop - paddingBottom

	// dynamically throttle X‑axis labels
	const maxLabels = Math.max(1, Math.floor(graphWidth / 50))
	const xTickInterval = Math.ceil(labels.length / maxLabels)

	const maxY = Math.max(...data, 1)
	const minY = Math.min(...data, 0)
	const yRange = maxY - minY || 1

	// Map data to SVG coordinates
	const points = data.map((d, i) => {
		// When there's only one data point, place it in the middle
		const x = data.length === 1
			? paddingLeft + graphWidth / 2
			: paddingLeft + (i * graphWidth) / (data.length - 1)
		const y = paddingTop + graphHeight - ((d - minY) / yRange) * graphHeight
		return [x, y]
	})

	// Build SVG path
	const path = data.length === 1
		? `M${points[0][0]},${points[0][1]}`
		: points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')

	// Y axis ticks
	const yTicks = 5
	const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => minY + (i * yRange) / yTicks)

	// Find today index for indicator (if enabled)
	let todayIndex: number | null = null
	if (showTodayIndicator) {
		const todayIso = new Date().toISOString().slice(0, 10)
		todayIndex = labels.findIndex(lbl => {
			// Accept both DD/MM and ISO for robustness
			return lbl === todayIso || lbl === new Date().toLocaleDateString('da-DK').replace(/\./g, '/').replace(/\/$/, '')
		})
		// Try to match DD/MM
		if (todayIndex === -1) {
			const todayDDMM = new Date().toLocaleDateString('da-DK').split('.').map(s => s.trim()).filter(Boolean)
			const todayLabel = todayDDMM.length >= 2 ? `${todayDDMM[0].padStart(2, '0')}/${todayDDMM[1].padStart(2, '0')}` : ''
			todayIndex = labels.findIndex(lbl => lbl === todayLabel)
		}
	}

	// Helper for formatting numbers: 1 decimal if needed, else integer
	const formatValue = (val: number) => Number(val) % 1 === 0 ? val.toFixed(0) : val.toFixed(1)

	return (
		<div ref={containerRef} style={{ width: '100%' }}>
			<svg
				viewBox={`0 0 ${chartWidth} ${height}`}
				preserveAspectRatio="xMidYMid meet"
				className="bg-white rounded shadow"
				style={{ width: '100%', height: 'auto', position: 'relative', overflow: 'visible' }}
				onMouseLeave={() => setTooltip(null)}
			>
				{/* Today vertical indicator */}
				{showTodayIndicator && todayIndex !== null && todayIndex >= 0 && (
					<line
						x1={paddingLeft + (todayIndex * graphWidth) / (labels.length - 1)}
						x2={paddingLeft + (todayIndex * graphWidth) / (labels.length - 1)}
						y1={paddingTop}
						y2={paddingTop + graphHeight}
						stroke="#ef4444"
						strokeDasharray="4 2"
						strokeWidth={2}
					/>
				)}
				{/* Y axis grid and labels */}
				{yTickVals.map((v, i) => {
					const y = paddingTop + graphHeight - ((v - minY) / yRange) * graphHeight
					return (
						<g key={i}>
							<line x1={paddingLeft} x2={chartWidth - paddingRight} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
							<text x={paddingLeft - 6} y={y + 4} fontSize={11} textAnchor="end" fill="#6b7280">{v.toFixed(0)}</text>
						</g>
					)
				})}
				{/* X axis labels (filtered to prevent overlap) */}
				{labels.map((lbl, i) => {
					// skip unless it's a tick position or the last label
					if (i !== labels.length - 1 && (i % xTickInterval !== 0)) { return null }
					// When there's only one data point, place it in the middle
					const x = data.length === 1
						? paddingLeft + graphWidth / 2
						: paddingLeft + (i * graphWidth) / (labels.length - 1)
					return (
						<text
							key={i}
							x={x}
							y={height - paddingBottom / 2}
							fontSize={11}
							textAnchor="middle"
							fill="#6b7280"
						>
							{lbl}
						</text>
					)
				})}
				{/* Y axis label */}
				{(yLabel != null) && (
					<text
						x={paddingLeft / 2}
						y={height / 2}
						fontSize={12}
						textAnchor="middle"
						fill="#6b7280"
						transform={`rotate(-90 ${paddingLeft / 2},${height / 2})`}
					>
						{yLabel}
					</text>
				)}
				{/* Line path */}
				<path
					d={path}
					fill="none"
					stroke={color}
					strokeWidth={2.5}
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
				{/* Dots with hover tooltips */}
				{points.map(([x, y], i) => (
					<g key={i}>
						<circle
							cx={x}
							cy={y}
							r={2.5}
							fill={color}
							onMouseMove={e => {
								setTooltip({
									x: e.nativeEvent.offsetX,
									y: e.nativeEvent.offsetY,
									text: `${labels[i]}: ${formatValue(data[i])}`
								})
							}}
							onMouseLeave={() => setTooltip(null)}
							style={{ cursor: 'pointer' }}
						/>
					</g>
				))}
				{/* Title */}
				{(label != null) && (
					<text x={chartWidth / 2} y={20} fontSize={15} textAnchor="middle" fill="#111827" fontWeight={600}>
						{label}
					</text>
				)}
				{/* Tooltip */}
				{tooltip && (
					<g pointerEvents="none">
						<text
							ref={tooltipTextRef}
							x={tooltip.x + 18}
							y={tooltip.y - 6}
							fontSize={13}
							fill="#fff"
							fontWeight={500}
							style={{ visibility: 'hidden' }}
						>
							{tooltip.text}
						</text>
						{tooltipDims.width > 0 && (
							<rect
								x={tooltip.x + 10}
								y={tooltip.y - 24}
								width={tooltipDims.width + 16}
								height={tooltipDims.height + 10}
								rx={5}
								fill="#111827"
								opacity={0.92}
							/>
						)}
						<text
							x={tooltip.x + 18}
							y={tooltip.y - 6}
							fontSize={13}
							fill="#fff"
							fontWeight={500}
						>
							{tooltip.text}
						</text>
					</g>
				)}
			</svg>
		</div>
	)
}

export default SvgLineGraph
