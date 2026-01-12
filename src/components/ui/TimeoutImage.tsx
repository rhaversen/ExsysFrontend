import Image from 'next/image'
import { memo, type ReactElement, useEffect, useState } from 'react'

interface TimeoutImageProps {
	totalMs: number
	onClick: () => void
	src: string
	alt: string
	width: number
	height: number
	className?: string
}

const TimeoutImage = memo(function TimeoutImage ({
	totalMs,
	onClick,
	src,
	alt,
	width,
	height,
	className = ''
}: TimeoutImageProps): ReactElement {
	const [elapsedMs, setElapsedMs] = useState(0)
	const progress = Math.min(elapsedMs / totalMs, 1)

	useEffect(() => {
		const startTime = Date.now()
		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime
			setElapsedMs(elapsed)
			if (elapsed >= totalMs) {
				clearInterval(interval)
				onClick()
			}
		}, 50)

		return () => { clearInterval(interval) }
	}, [totalMs, onClick])

	return (
		<button
			type="button"
			onClick={onClick}
			title={alt}
			className={`relative overflow-hidden rounded-full ${className}`}
		>
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
			/>
			<div
				className="absolute inset-0 bg-white/50 transition-none rounded-full"
				style={{ clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)` }}
			/>
		</button>
	)
})

export default TimeoutImage
