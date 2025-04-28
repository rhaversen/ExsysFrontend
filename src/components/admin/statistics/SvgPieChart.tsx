import React, { useState, useRef, useLayoutEffect } from 'react'

interface SvgPieChartProps {
  data: number[]
  labels: string[]
  width?: number
  height?: number
  label?: string
  colors?: string[] // Default rotating colors
  itemColors?: string[] // Specific colors per slice
}

const SvgPieChart: React.FC<SvgPieChartProps> = ({
	data,
	labels,
	width = 500,
	height = 250,
	label,
	colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6'],
	itemColors // New prop for specific colors
}) => {
	// Hooks must be called at the top level
	const [tooltip, setTooltip] = useState<{ x: number, y: number, textLines: string[] } | null>(null) // Changed text to textLines
	const [tooltipDims, setTooltipDims] = useState<{ width: number, height: number }>({ width: 0, height: 0 })
	const tooltipTextRef = useRef<HTMLDivElement>(null)
	const svgRef = useRef<SVGSVGElement>(null)

	// responsiveness: measure container width
	const containerRef = useRef<HTMLDivElement>(null)
	const [chartWidth, setChartWidth] = useState<number>(width)

	useLayoutEffect(() => {
		if (tooltip && tooltipTextRef.current) {
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

	// Early return if no data
	if (data.length === 0 || data.every(d => d === 0)) {
		return <div className="text-gray-400 p-4 text-center">{'Ingen data'}</div>
	}

	// Calculations (can stay after the early return check)
	const total = data.reduce((sum, val) => sum + val, 0)

	// Adjusted paddings
	const topPadding = 40 // Increased for consistent title spacing
	// bottomPadding and legendRows no longer needed; legend will be HTML flex
	const radius = Math.min(chartWidth, height - topPadding) / 2.5 // Adjusted calculation due to topPadding change
	const centerX = chartWidth / 2
	const centerY = topPadding + (height - topPadding) / 2 // Adjusted calculation due to topPadding change

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

		// build pathData; special case for a full circle
		let pathData: string
		if (Math.abs(angle - 2 * Math.PI) < 0.001) { // Check for nearly full circle
			// Draw two half circles to make a full one
			const midX1 = centerX + radius * Math.cos(startAngle + Math.PI)
			const midY1 = centerY + radius * Math.sin(startAngle + Math.PI)
			pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${midX1} ${midY1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`
		} else {
			pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
		}

		// Use itemColors if available, otherwise fall back to rotating colors
		const sliceColor = itemColors?.[i] ?? colors[i % colors.length]

		const slice = {
			path: pathData,
			color: sliceColor,
			percentage: percentage.toFixed(1),
			value,
			label: labels[i]
		}

		startAngle = endAngle
		return slice
	})

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
				{/* Title */}
				{(label != null) && (
					<text x={chartWidth / 2} y={20} fontSize={15} textAnchor="middle" fill="#111827" fontWeight={600}> {/* Standardized y=20 */}
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
									// Calculate position relative to container
									const svgRect = svgRef.current?.getBoundingClientRect()
									if (svgRect) {
										const x = e.clientX - svgRect.left
										const y = e.clientY - svgRect.top
										setTooltip({
											x,
											y,
											textLines: [`${slice.label}: ${formatValue(slice.value)} (${formatValue(Number(slice.percentage))}%)`]
										})
									}
								}}
								onMouseLeave={() => setTooltip(null)}
								style={{ cursor: 'pointer' }}
							/>
						</g>
					))}
				</g>
			</svg>

			{/* HTML-based tooltip overlay */}
			{tooltip && (
				<div
					className="absolute pointer-events-none"
					style={{
						left: tooltip.x + 10,
						top: tooltip.y - (tooltipDims.height || 40),
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
				{slices.map((slice, i) => (
					<div key={i} className="flex items-center space-x-1">
						<span
							className="w-3 h-3 block"
							style={{ backgroundColor: slice.color }}
						/>
						<span className="text-xs text-gray-900">
							{`${slice.label}`} {/* Removed percentage */}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default SvgPieChart
