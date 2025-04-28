import React, { useState, useRef, useLayoutEffect } from 'react'

interface SvgBarChartProps {
  data: number[]
  labels: string[]
  width?: number
  height?: number
  color?: string // Default color if itemColors not provided
  label?: string
  yLabel?: string
  itemColors?: string[] // Specific colors per bar
}

const SvgBarChart: React.FC<SvgBarChartProps> = ({
	data,
	labels,
	width = 500,
	height = 180,
	color = '#6366f1', // Tailwind indigo-500 (fallback)
	label,
	yLabel,
	itemColors
}) => {
	const [tooltip, setTooltip] = useState<{ x: number, y: number, textLines: string[] } | null>(null)
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

	if (data.length === 0 || data.every(d => d === 0)) {
	  return <div className="text-gray-400 p-4 text-center">{'Ingen data'}</div>
	}

	// Padding for axes
	const paddingLeft = 64
	const paddingRight = 32
	const paddingTop = 40
	const paddingBottom = 48 // More space for labels
	const graphWidth = chartWidth - paddingLeft - paddingRight
	const graphHeight = height - paddingTop - paddingBottom

	// Determine if we need to force vertical labels
	const maxLabels = Math.max(1, Math.floor(graphWidth/100))
	const forceVerticalLabels = labels.length > maxLabels

	const maxY = Math.max(...data, 1)
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
		<div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
			<svg
				ref={svgRef}
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

				{/* Bars with hover tooltips */}
				{data.map((value, i) => {
					const x = paddingLeft + barSpacing + i * (barWidth + barSpacing)
					const barHeight = (value / yRange) * graphHeight
					const y = paddingTop + graphHeight - barHeight
					// Use itemColors if available, otherwise fall back to single color
					const barColor = itemColors?.[i] ?? color

					return (
						<g key={i}>
							<rect
								x={x}
								y={y}
								width={barWidth}
								height={barHeight}
								fill={barColor}
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
											textLines: [`${labels[i]}: ${formatValue(value)}`]
										})
									}
								}}
								onMouseLeave={() => setTooltip(null)}
								style={{ cursor: 'pointer' }}
							/>
							{barHeight > 15 && (
								<text
									x={x + barWidth / 2}
									y={y + 12}
									fontSize={10}
									textAnchor="middle"
									fill="white"
									fontWeight="bold"
								>
									{value.toFixed(0)}
								</text>
							)}
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
		</div>
	)
}

export default SvgBarChart
