import CloseableModal from '@/components/ui/CloseableModal'
import React, { type ReactElement, useEffect, useState } from 'react'

const TimeoutWarningWindow = ({
	warningOffsetSeconds,
	onClose,
	onTimeout
}: {
	warningOffsetSeconds: number
	onClose: () => void
	onTimeout: () => void
}): ReactElement => {
	const [remainingSeconds, setRemainingSeconds] = useState(warningOffsetSeconds)

	useEffect(() => {
		const timer = setInterval(() => {
			setRemainingSeconds(prev => {
				if (prev <= 1) {
					clearInterval(timer)
					// Schedule timeout callback for next tick to avoid state updates during render
					setTimeout(() => {
						onTimeout()
					}, 0)
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => { clearInterval(timer) }
	}, [onTimeout])

	return (
		<CloseableModal onClose={() => { onClose() }}>
			{/* We trea the entire modal as a button, since any interaction should qualify as a "keep alive" */}
			<button
				className="p-10 flex flex-col items-center gap-10 text-black"
				type="button"
				onClick={() => {
					onClose() // reset main timer
				}}
			>
				<h2 className="text-xl font-bold">
					{'Er du der stadig?'}
				</h2>
				<p className="text-center text-lg w-60">
					{'Din bestilling vil blive annulleret om '}
					<strong>{remainingSeconds}</strong>
					{' sekund'}{remainingSeconds > 1 ? 'er' : ''}
				</p>
				<div className="bg-blue-500 text-white text-lg px-10 py-7 rounded-md">
					{'Fortsæt bestilling'}
				</div>
			</button>
		</CloseableModal>
	)
}

export default TimeoutWarningWindow
