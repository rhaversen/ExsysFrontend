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

	// Early return if no data
	if (data.length === 0) { return <div className="text-gray-400">{'Ingen data'}</div> }

	// Calculations (can stay after the early return check)
	const total = data.reduce((sum, val) => sum + val, 0)

	// Adjusted paddings
	const topPadding = 22
	// bottomPadding and legendRows no longer needed; legend will be HTML flex
	const radius = Math.min(chartWidth, height - topPadding) / 2.5
	const centerX = chartWidth / 2
	const centerY = topPadding + (height - topPadding) / 2

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

		// build pathData; special case for a full circle
		let pathData: string
		if (percentage === 100) {
			// two half‐arcs to draw a full circle
			pathData = [
				`M ${centerX},${centerY - radius}`,
				`A ${radius},${radius} 0 1,1 ${centerX},${centerY + radius}`,
				`A ${radius},${radius} 0 1,1 ${centerX},${centerY - radius}`,
				'Z'
			].join(' ')
		} else {
			pathData = [
				`M ${centerX},${centerY}`,
				`L ${x1},${y1}`,
				`A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`,
				'Z'
			].join(' ')
		}

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
					<text x={chartWidth / 2} y={topPadding - 6} fontSize={15} textAnchor="middle" fill="#111827" fontWeight={600}>
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

			{/* Legend keys as a flex‑wrap row */}
			<div className="flex flex-wrap gap-2 justify-center mt-2">
				{slices.map((slice, i) => (
					<div key={i} className="flex items-center space-x-1">
						<span
							className="w-3 h-3 block"
							style={{ backgroundColor: slice.color }}
						/>
						<span className="text-xs text-gray-900">
							{`${slice.label} (${slice.percentage}%)`}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default SvgPieChart
