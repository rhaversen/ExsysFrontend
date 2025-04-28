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
	height = 300, // Increased default height slightly for legend
	label,
	yLabel
}) => {
	const [tooltip, setTooltip] = useState<{ x: number, y: number, textLines: string[] } | null>(null)
	const [tooltipDims, setTooltipDims] = useState<{ width: number, height: number }>({ width: 0, height: 0 })
	const tooltipTextRef = useRef<SVGTextElement>(null)

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

	if (data.length === 0 || categories.length === 0) {
		return <div className="text-gray-400 p-4 text-center">{'Ingen data at vise'}</div>
	}

	const paddingLeft = 64
	const paddingRight = 32
	const paddingTop = 40 // Space for title
	const paddingBottom = 32 // Space for x-axis labels
	const legendItemHeight = 18
	const itemsPerRow = Math.max(1, Math.floor((chartWidth - paddingLeft - paddingRight) / 100)) // Dynamic items per row
	const numLegendRows = Math.ceil(categories.length / itemsPerRow)
	const legendHeight = numLegendRows * legendItemHeight + 10 // Total legend height + padding

	const effectiveHeight = height - legendHeight // Adjust height for legend
	const graphWidth = chartWidth - paddingLeft - paddingRight
	const graphHeight = effectiveHeight - paddingTop - paddingBottom

	const barWidth = Math.max(5, graphWidth / data.length * 0.7) // 70% width bars

	// Calculate total value for each bar to find maxY
	const totals = data.map(hourData => categories.reduce((sum, cat) => sum + (hourData[cat] || 0), 0))
	const maxY = Math.max(...totals, 1) // Ensure maxY is at least 1

	// Y axis ticks
	const yTicks = 5
	const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => (i * maxY) / yTicks)

	// Dynamically throttle X‑axis labels
	const maxLabels = Math.max(1, Math.floor(graphWidth / 40)) // Allow more labels if space permits
	const xTickInterval = Math.ceil(labels.length / maxLabels)

	const formatValue = (val: number) => val.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

	return (
		<div ref={containerRef} style={{ width: '100%' }}>
			<svg
				viewBox={`0 0 ${chartWidth} ${height}`}
				preserveAspectRatio="xMidYMid meet"
				className="bg-white rounded shadow"
				style={{ width: '100%', height: 'auto', position: 'relative', overflow: 'visible' }}
				onMouseLeave={() => setTooltip(null)}
			>
				{/* Title */}
				{(label != null) && (
					<text x={chartWidth / 2} y={20} fontSize={15} textAnchor="middle" fill="#111827" fontWeight={600}>
						{label}
					</text>
				)}

				{/* Legend */}
				<g transform={`translate(${paddingLeft}, ${paddingTop + graphHeight + paddingBottom + 15})`}> {/* Position legend below chart */}
					{categories.map((cat, i) => {
						const colIndex = i % itemsPerRow
						const rowIndex = Math.floor(i / itemsPerRow)
						const xOffset = colIndex * ((graphWidth) / itemsPerRow)
						const yOffset = rowIndex * legendItemHeight
						return (
							<g key={cat} transform={`translate(${xOffset}, ${yOffset})`}>
								<rect x={0} y={-8} width={10} height={10} fill={colors[cat] || '#cccccc'} rx={2} />
								<text x={15} y={0} fontSize={10} fill="#6b7280">{cat}</text>
							</g>
						)
					})}
				</g>

				{/* Y axis grid and labels */}
				{yTickVals.map((v, i) => {
					const y = paddingTop + graphHeight - (v / maxY) * graphHeight
					return (
						<g key={i}>
							<line x1={paddingLeft} x2={chartWidth - paddingRight} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
							<text x={paddingLeft - 6} y={y + 4} fontSize={11} textAnchor="end" fill="#6b7280">{formatValue(v)}</text>
						</g>
					)
				})}

				{/* X axis labels */}
				{labels.map((lbl, i) => {
					if (i % xTickInterval !== 0 && i !== labels.length - 1 && labels.length > maxLabels) { return null }
					const x = paddingLeft + (i * graphWidth) / data.length + (graphWidth / data.length) / 2
					return (
						<text
							key={i}
							x={x}
							y={paddingTop + graphHeight + paddingBottom / 1.5} // Position below graph
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
						x={paddingLeft / 2 - 10} // Adjust position
						y={(paddingTop + effectiveHeight - paddingBottom) / 2}
						fontSize={12}
						textAnchor="middle"
						fill="#6b7280"
						transform={`rotate(-90 ${paddingLeft / 2 - 10},${(paddingTop + effectiveHeight - paddingBottom) / 2})`}
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
					const sortedCategories = [...categories].sort((a, b) => (hourData[b] || 0) - (hourData[a] || 0))

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

				{/* Tooltip - Render last so it's on top */}
				{tooltip && (
					<g pointerEvents="none">
						{/* Invisible text for measurement - render all lines */}
						<text ref={tooltipTextRef} x={-9999} y={-9999} fontSize={13} fontWeight={500} style={{ whiteSpace: 'pre' }}>
							{tooltip.textLines.join('\n')}
						</text>
						{/* Tooltip Background */}
						{tooltipDims.width > 0 && (
							<rect
								x={tooltip.x + 10}
								y={tooltip.y - tooltipDims.height - 5} // Position above cursor
								width={tooltipDims.width + 16}
								height={tooltipDims.height + 10}
								rx={5}
								fill="rgba(17, 24, 39, 0.92)" // #111827 with opacity
							/>
						)}
						{/* Tooltip Text */}
						<text
							fontSize={13}
							fill="#fff"
							fontWeight={500}
							x={tooltip.x + 18}
							y={tooltip.y - tooltipDims.height + 8} // Adjust based on background
							style={{ whiteSpace: 'pre' }}
						>
							{tooltip.textLines.join('\n')}
						</text>
					</g>
				)}
			</svg>
		</div>
	)
}

export default SvgStackedBarChart
