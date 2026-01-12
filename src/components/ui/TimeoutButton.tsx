import { memo, type ReactElement, useEffect, useState } from 'react'

interface TimeoutButtonProps {
	totalMs: number
	onClick: () => void
	children: React.ReactNode
	className?: string
}

const TimeoutButton = memo(function TimeoutButton ({
	totalMs,
	onClick,
	children,
	className = ''
}: TimeoutButtonProps): ReactElement {
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
			className={`relative overflow-hidden ${className}`}
		>
			<div
				className="absolute inset-0 bg-black/20 transition-none"
				style={{ clipPath: `inset(0 0 0 ${progress * 100}%)` }}
			/>
			<span className="relative z-10">
				{children}
			</span>
		</button>
	)
})

export default TimeoutButton
