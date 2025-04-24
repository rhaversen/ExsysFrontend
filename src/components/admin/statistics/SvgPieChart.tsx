import React, { useState, useRef, useLayoutEffect } from 'react'

interface SvgPieChartProps {
  data: number[]
  labels: string[]
  width?: number
  height?: number
  label?: string
  colors?: string[]
}

const SvgPieChart: React.FC<SvgPieChartProps> = ({
	data,
	labels,
	width = 500,
	height = 250,
	label,
	colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6']
}) => {
	// Hooks must be called at the top level
	const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)
	const [tooltipDims, setTooltipDims] = useState<{ width: number, height: number }>({ width: 0, height: 0 })
	const tooltipTextRef = useRef<SVGTextElement>(null)

	useLayoutEffect(() => {
		if (tooltip && tooltipTextRef.current) {
			const bbox = tooltipTextRef.current.getBBox()
			setTooltipDims({ width: bbox.width, height: bbox.height })
		}
	}, [tooltip])

	// Early return if no data
	if (data.length === 0) { return <div className="text-gray-400">{'Ingen data'}</div> }

	// Calculations (can stay after the early return check)
	const total = data.reduce((sum, val) => sum + val, 0)

	// Adjusted paddings
	const topPadding = 22
	const legendItemWidth = 140
	const legendItemHeight = 18
	const legendGapX = 12
	const legendGapY = 6
	const maxLegendCols = Math.max(1, Math.floor((width - 40) / legendItemWidth))
	const legendRows = Math.ceil(data.length / maxLegendCols)
	// Add extra space for legend rows
	const bottomPadding = 22 + legendRows * (legendItemHeight + legendGapY)
	const radius = Math.min(width, height - topPadding - bottomPadding) / 2.5
	const centerX = width / 2
	const centerY = topPadding + (height - topPadding - bottomPadding) / 2

	// Helper for formatting numbers: 1 decimal if needed, else integer
	const formatValue = (val: number) => Number(val) % 1 === 0 ? val.toFixed(0) : val.toFixed(1)

	let startAngle = 0
	const slices = data.map((value, i) => {
		const percentage = (value / total) * 100
		const angle = (percentage / 100) * 2 * Math.PI
		const endAngle = startAngle + angle
		const largeArcFlag = angle > Math.PI ? 1 : 0

		const x1 = centerX + radius * Math.cos(startAngle)
		const y1 = centerY + radius * Math.sin(startAngle)
		const x2 = centerX + radius * Math.cos(endAngle)
		const y2 = centerY + radius * Math.sin(endAngle)

		const midAngle = startAngle + angle / 2
		const labelRadius = radius * 0.75
		const labelX = centerX + labelRadius * Math.cos(midAngle)
		const labelY = centerY + labelRadius * Math.sin(midAngle)

		const pathData = [
			`M ${centerX},${centerY}`,
			`L ${x1},${y1}`,
			`A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`,
			'Z'
		].join(' ')

		const slice = {
			path: pathData,
			color: colors[i % colors.length],
			labelX,
			labelY,
			percentage: percentage.toFixed(1),
			value,
			label: labels[i]
		}

		startAngle = endAngle
		return slice
	})

	// Legend layout: wrap items to multiple rows if needed
	const legendStartY = height - bottomPadding + 8

	return (
		<svg
			width={width}
			height={height}
			className="bg-white rounded shadow"
			style={{ position: 'relative', overflow: 'visible' }}
			onMouseLeave={() => setTooltip(null)}
		>
			{/* Title */}
			{(label != null) && (
				<text x={width / 2} y={topPadding - 6} fontSize={15} textAnchor="middle" fill="#111827" fontWeight={600}>
					{label}
				</text>
			)}

			{/* Pie slices with hover tooltips */}
			<g>
				{slices.map((slice, i) => (
					<g key={i}>
						<path
							d={slice.path}
							fill={slice.color}
							stroke="white"
							strokeWidth={1}
							onMouseMove={e => {
								setTooltip({
									x: e.nativeEvent.offsetX,
									y: e.nativeEvent.offsetY,
									text: `${slice.label}: ${formatValue(slice.value)} (${formatValue(Number(slice.percentage))}%)`
								})
							}}
							onMouseLeave={() => setTooltip(null)}
							style={{ cursor: 'pointer' }}
						/>
					</g>
				))}
			</g>

			{/* Legend with dynamic wrapping */}
			<g>
				{slices.map((slice, i) => {
					const col = i % maxLegendCols
					const row = Math.floor(i / maxLegendCols)
					const x = 20 + col * (legendItemWidth + legendGapX)
					const y = legendStartY + row * (legendItemHeight + legendGapY)
					return (
						<g key={i} transform={`translate(${x}, ${y})`}>
							<rect width={12} height={12} fill={slice.color} />
							<text x={16} y={10} fontSize={10} fill="#111827">
								{`${slice.label} (${slice.percentage}%)`}
							</text>
						</g>
					)
				})}
			</g>

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
	)
}

export default SvgPieChart
