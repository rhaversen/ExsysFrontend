import { memo, type ReactElement, useEffect, useState } from 'react'

interface TimeoutButtonProps {
	totalMs: number
	onClick: () => void
	onTimeout?: () => void
	children: React.ReactNode
	className?: string
}

const TimeoutButton = memo(function TimeoutButton ({
	totalMs,
	onClick,
	onTimeout,
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
				if (onTimeout) {
					onTimeout()
				} else {
					onClick()
				}
			}
		}, 50)

		return () => { clearInterval(interval) }
	}, [totalMs, onClick, onTimeout])

	return (
		<button
			type="button"
			onClick={onClick}
			className={`relative overflow-hidden ${className}`}
		>
			<div
				className="absolute inset-0 bg-black/20 transition-none pointer-events-none"
				style={{ clipPath: `inset(0 0 0 ${progress * 100}%)` }}
			/>
			{children}
		</button>
	)
})

export default TimeoutButton
