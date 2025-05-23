import React, { useState, useRef, useLayoutEffect } from 'react'
import { ImParagraphLeft, ImParagraphJustify } from 'react-icons/im'

interface SvgStackedBarChartProps {
	data: Array<Record<string, number>>; // Array index = bar (e.g., hour), Record maps category to value
	labels: string[]; // Labels for each bar (e.g., '0:00', '1:00')
	categories: string[]; // List of all possible categories
	colors: Record<string, string>; // Map category name to color hex
	width?: number;
	height?: number;
	label?: string;
	yLabel?: string;
}

const SvgStackedBarChart: React.FC<SvgStackedBarChartProps> = ({
	data,
	labels,
	categories,
	colors,
	width = 500,
	height = 180,
	label,
	yLabel
}) => {
	const [tooltip, setTooltip] = useState<{ x: number, y: number, textLines: string[] } | null>(null)
	const [tooltipDims, setTooltipDims] = useState<{ width: number, height: number }>({ width: 0, height: 0 })
	const tooltipTextRef = useRef<HTMLDivElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)

	// Toggle between absolute and relative (100%) mode
	const [relativeMode, setRelativeMode] = useState(false)

	// responsiveness: measure container width
	const containerRef = useRef<HTMLDivElement>(null)
	const [chartWidth, setChartWidth] = useState<number>(width)

	useLayoutEffect(() => {
		if (tooltip && tooltipTextRef.current) {
			// Get element dimensions
			const rect = tooltipTextRef.current.getBoundingClientRect()
			setTooltipDims({ width: rect.width, height: rect.height })
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

	// Filter categories with sales only
	const activeCategories = categories.filter(cat => data.some(d => (d[cat] || 0) > 0))

	if (data.length === 0 || activeCategories.length === 0) {
		return <div className="text-gray-400 p-4 text-center">{'Ingen data'}</div>
	}

	const paddingLeft = 64
	const paddingRight = 32
	const paddingTop = 40
	const paddingBottom = 48 // More space for labels
	const graphWidth = chartWidth - paddingLeft - paddingRight
	const graphHeight = height - paddingTop - paddingBottom

	// Determine if we need to force vertical labels
	const maxLabels = Math.max(1, Math.floor(graphWidth / 100))
	const forceVerticalLabels = labels.length > maxLabels

	// Calculate total value for each bar to find maxY
	const totals = data.map(hourData => activeCategories.reduce((sum, cat) => sum + (hourData[cat] || 0), 0))
	const maxY = relativeMode ? 1 : Math.max(...totals, 1)
	const minY = 0
	const yRange = maxY - minY || 1

	// Bar width calculation
	const barWidth = Math.min(30, (graphWidth / data.length) * 0.7)
	const barSpacing = (graphWidth - (barWidth * data.length)) / (data.length + 1)

	// Y axis ticks
	const yTicks = 5
	const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
		relativeMode
			? minY + (i * 1) / yTicks
			: minY + (i * yRange) / yTicks
	)

	// Helper for formatting numbers: 1 decimal if needed, else integer
	const formatValue = (val: number) => Number(val) % 1 === 0 ? val.toFixed(0) : val.toFixed(1)

	return (
		<div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
			<svg
				ref={svgRef}
				viewBox={`0 0 ${chartWidth} ${height}`}
				preserveAspectRatio="xMidYMid meet"
				className="bg-white rounded shadow"
				style={{ width: '100%', height: 'auto', position: 'relative', overflow: 'visible' }}
				onMouseLeave={() => setTooltip(null)}
			>
				{/* Toggle buttons in SVG, top-right */}
				<foreignObject
					x={chartWidth - paddingRight - 15}
					y={5}
					width={44}
					height={24}
					style={{ pointerEvents: 'none' }}
				>
					<div style={{ display: 'flex', gap: 2, pointerEvents: 'auto' }}>
						<button
							type="button"
							aria-label="Absolut"
							onClick={() => setRelativeMode(false)}
							className={`flex items-center justify-center w-5 h-5 rounded border transition
								${!relativeMode
			? 'bg-blue-600 text-white border-blue-600 shadow'
			: 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
		}`}
							style={{
								outline: 'none',
								padding: 0,
								minWidth: 0,
								minHeight: 0,
								borderRadius: 3,
								fontSize: 0,
								margin: 0
							}}
						>
							<span style={{ display: 'inline-block', transform: 'rotate(-90deg)' }}>
								<ImParagraphLeft size={13} />
							</span>
						</button>
						<button
							type="button"
							aria-label="Relativ (100%)"
							onClick={() => setRelativeMode(true)}
							className={`flex items-center justify-center w-5 h-5 rounded border transition
								${relativeMode
			? 'bg-blue-600 text-white border-blue-600 shadow'
			: 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
		}`}
							style={{
								outline: 'none',
								padding: 0,
								minWidth: 0,
								minHeight: 0,
								borderRadius: 3,
								fontSize: 0,
								margin: 0
							}}
						>
							<span style={{ display: 'inline-block', transform: 'rotate(-90deg)' }}>
								<ImParagraphJustify size={13} />
							</span>
						</button>
					</div>
				</foreignObject>
				{/* Y axis grid and labels */}
				{yTickVals.map((v, i) => {
					const y = paddingTop + graphHeight - ((v - minY) / (relativeMode ? 1 : yRange)) * graphHeight
					return (
						<g key={i}>
							<line x1={paddingLeft} x2={chartWidth - paddingRight} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
							<text x={paddingLeft - 6} y={y + 4} fontSize={11} textAnchor="end" fill="#6b7280">
								{relativeMode
									? `${Math.round(v * 100)}%`
									: (typeof v === 'number' && v % 1 === 0 ? v.toFixed(0) : v.toFixed(1))
								}
							</text>
						</g>
					)
				})}

				{/* X axis labels */}
				{labels.map((lbl, i) => {
					const x = paddingLeft + barSpacing + i * (barWidth + barSpacing) + barWidth / 2
					const y = forceVerticalLabels
						? height - paddingBottom / 2 - 18 // move up when vertical
						: height - paddingBottom / 2
					return (
						<text
							key={i}
							x={x}
							y={y}
							fontSize={11}
							textAnchor={forceVerticalLabels ? 'end' : 'middle'}
							fill="#6b7280"
							transform={
								forceVerticalLabels
									? `rotate(-90, ${x}, ${y})`
									: undefined
							}
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
						{relativeMode ? 'Procent' : yLabel}
					</text>
				)}

				{/* Stacked Bars */}
				{data.map((hourData, i) => {
					const barX = paddingLeft + (i * graphWidth) / data.length + (graphWidth / data.length - barWidth) / 2
					let currentY = paddingTop + graphHeight
					// Sort categories by value descending for consistent tooltip order
					const sortedCategories = [...activeCategories].sort((a, b) => (hourData[b] || 0) - (hourData[a] || 0))

					return (
						<g key={i} className="bar-group">
							{sortedCategories.map(cat => {
								const value = hourData[cat] || 0
								if (value === 0) { return null }
								const total = totals[i] || 1
								const percent = total === 0 ? 0 : (value / total)
								const barHeight = relativeMode
									? (percent * graphHeight)
									: Math.max(0, (value / maxY) * graphHeight)
								const segmentY = currentY - barHeight
								currentY = segmentY

								return (
									<rect
										key={cat}
										x={barX}
										y={segmentY}
										width={barWidth}
										height={barHeight}
										fill={colors[cat] || '#cccccc'}
										rx={2}
										onMouseMove={e => {
											// Calculate position relative to container
											const svgRect = svgRef.current?.getBoundingClientRect()
											if (svgRect) {
												const x = e.clientX - svgRect.left
												const y = e.clientY - svgRect.top
												setTooltip({
													x,
													y,
													textLines: [
														`kl. ${labels[i]}`,
														`${cat}`,
														`${formatValue(value)} ${yLabel} (${((value / total) * 100).toFixed(1)}%)`
													]
												})
											}
										}}
										onMouseLeave={() => setTooltip(null)}
										style={{ cursor: 'pointer' }}
									/>
								)
							})}
						</g>
					)
				})}

				{/* Title */}
				{(label != null) && (
					<text x={chartWidth / 2} y={20} fontSize={15} textAnchor="middle" fill="#111827" fontWeight={600}>
						{label}
					</text>
				)}
			</svg>

			{/* HTML-based tooltip overlay */}
			{tooltip && (
				<div
					className="absolute pointer-events-none"
					style={{
						left: (() => {
							const tooltipW = tooltipDims.width || 120
							const offset = 10
							const chartW = chartWidth ?? 500
							// Prefer right, but if not enough space, place to the left of cursor
							if (tooltip.x + offset + tooltipW + 8 < chartW) {
								return tooltip.x + offset
							} else {
								return Math.max(0, tooltip.x - tooltipW - offset)
							}
						})(),
						top: (() => {
							const tooltipH = tooltipDims.height || 40
							const offset = 8
							 // Prefer below, but clamp to chart bottom if not enough space
							return Math.min(
								tooltip.y + offset,
								height - tooltipH - offset
							)
						})(),
						zIndex: 9999
					}}
				>
					{/* Hidden div for measuring tooltip dimensions */}
					<div
						ref={tooltipTextRef}
						className="opacity-0 absolute whitespace-pre bg-gray-900 text-white p-2 rounded text-sm font-medium"
					>
						{tooltip.textLines.join('\n')}
					</div>

					{/* Actual visible tooltip */}
					<div
						className="bg-gray-900 bg-opacity-90 text-white p-2 rounded text-sm font-medium whitespace-pre"
					>
						{tooltip.textLines.join('\n')}
					</div>
				</div>
			)}

			{/* Legend keys as a flex‑wrap row */}
			<div className="flex flex-wrap gap-2 justify-center mt-2">
				{activeCategories.map((cat) => (
					<div key={cat} className="flex items-center space-x-1">
						<span
							className="w-3 h-3 block"
							style={{ backgroundColor: colors[cat] || '#cccccc' }}
						/>
						<span className="text-xs text-gray-900">
							{cat}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default SvgStackedBarChart
