import React, { useState, useRef, useLayoutEffect } from 'react'

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
	const tooltipTextRef = useRef<SVGTextElement>(null)

	// responsiveness: measure container width
	const containerRef = useRef<HTMLDivElement>(null)
	const [chartWidth, setChartWidth] = useState<number>(width)

	useLayoutEffect(() => {
		if (tooltip && tooltipTextRef.current) {
			// Get bounding box of the invisible text to measure width/height
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

	// Filter categories with sales only
	const activeCategories = categories.filter(cat => data.some(d => (d[cat] || 0) > 0))

	if (data.length === 0 || activeCategories.length === 0) {
		return <div className="text-gray-400 p-4 text-center">{'Ingen data at vise'}</div>
	}

	const paddingLeft = 64
	const paddingRight = 32
	const paddingTop = 40
	const paddingBottom = 48 // More space for labels
	const graphWidth = chartWidth - paddingLeft - paddingRight
	const graphHeight = height - paddingTop - paddingBottom

	// Determine if we need to force vertical labels
	const maxLabels = Math.max(1, Math.floor(graphWidth/100))
	const forceVerticalLabels = labels.length > maxLabels

	// Calculate total value for each bar to find maxY
	const totals = data.map(hourData => activeCategories.reduce((sum, cat) => sum + (hourData[cat] || 0), 0))
	const maxY = Math.max(...totals, 1)
	const minY = 0
	const yRange = maxY - minY || 1

	// Bar width calculation
	const barWidth = Math.min(30, (graphWidth / data.length) * 0.7)
	const barSpacing = (graphWidth - (barWidth * data.length)) / (data.length + 1)

	// Y axis ticks
	const yTicks = 5
	const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => minY + (i * yRange) / yTicks)

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
				{/* Y axis grid and labels */}
				{yTickVals.map((v, i) => {
					const y = paddingTop + graphHeight - ((v - minY) / yRange) * graphHeight
					return (
						<g key={i}>
							<line x1={paddingLeft} x2={chartWidth - paddingRight} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
							<text x={paddingLeft - 6} y={y + 4} fontSize={11} textAnchor="end" fill="#6b7280">
								{typeof v === 'number' && v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}
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
						{yLabel}
					</text>
				)}

				{/* Stacked Bars */}
				{data.map((hourData, i) => {
					const barX = paddingLeft + (i * graphWidth) / data.length + (graphWidth / data.length - barWidth) / 2
					let currentY = paddingTop + graphHeight
					const tooltipLines: string[] = [`${labels[i]}: Total ${formatValue(totals[i])} DKK`]
					// Sort categories by value descending for consistent tooltip order
					const sortedCategories = [...activeCategories].sort((a, b) => (hourData[b] || 0) - (hourData[a] || 0))

					return (
						<g key={i} className="bar-group">
							{sortedCategories.map(cat => {
								const value = hourData[cat] || 0
								if (value === 0) { return null }
								const barHeight = Math.max(0, (value / maxY) * graphHeight) // Ensure height is not negative
								const segmentY = currentY - barHeight
								currentY = segmentY // Move up for the next segment
								tooltipLines.push(`${cat}: ${formatValue(value)} DKK`)

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
											setTooltip({
												x: e.nativeEvent.offsetX,
												y: e.nativeEvent.offsetY,
												textLines: tooltipLines // Use pre-calculated lines for this bar
											})
										}}
										// onMouseLeave is handled by the main SVG element
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

				{/* Tooltip */}
				{tooltip && (
					<g pointerEvents="none">
						{/* Invisible text for measurement - render all lines */}
						<text
							ref={tooltipTextRef}
							x={tooltip.x + 18}
							y={tooltip.y - 6}
							fontSize={13}
							fontWeight={500}
							style={{ visibility: 'hidden', whiteSpace: 'pre' }}
						>
							{tooltip.textLines.join('\n')}
						</text>
						{/* Tooltip Background */}
						{tooltipDims.width > 0 && (
							<rect
								x={tooltip.x + 10}
								y={tooltip.y - tooltipDims.height - 5}
								width={tooltipDims.width + 16}
								height={tooltipDims.height + 10}
								rx={5}
								fill="#111827"
								opacity={0.92}
							/>
						)}
						{/* Tooltip Text */}
						<text
							fontSize={13}
							fill="#fff"
							fontWeight={500}
							x={tooltip.x + 18}
							y={tooltip.y - tooltipDims.height + 8}
							style={{ whiteSpace: 'pre' }}
						>
							{tooltip.textLines.join('\n')}
						</text>
					</g>
				)}
			</svg>

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
