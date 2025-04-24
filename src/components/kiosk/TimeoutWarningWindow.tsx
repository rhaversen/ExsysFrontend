import { type ReactElement, useEffect, useState } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'
import { useConfig } from '@/contexts/ConfigProvider'

const TimeoutWarningWindow = ({
	onClose,
	onTimeout
}: {
	onClose: () => void
	onTimeout: () => void
}): ReactElement => {
	const { config } = useConfig()
	const timeoutWarningMs = config?.configs.kioskInactivityTimeoutWarningMs ?? 1000 * 10
	const [remainingSeconds, setRemainingSeconds] = useState(timeoutWarningMs / 1000)

	useEffect(() => {
		const timer = setInterval(() => {
			setRemainingSeconds(prev => {
				if (prev < 1) {
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
		<CloseableModal onClose={onClose}>
			<div className="p-10 flex flex-col items-center gap-10 text-black">
				<h2 className="text-xl font-bold">
					{'Er du der stadig?'}
				</h2>
				<p className="text-center text-lg w-60">
					{'Din bestilling vil blive annulleret om '}
					<strong>{remainingSeconds}</strong>
					{' sekund'}{remainingSeconds == 1 ? '' : 'er'}
				</p>
				<div className="flex flex-col gap-4 w-full">
					<button
						className="bg-blue-500 text-white text-lg px-10 py-7 rounded-md w-full"
						type="button"
						onClick={onClose}
					>
						{'Fortsæt bestilling'}
					</button>
					<button
						className="bg-gray-300 text-gray-700 text-lg px-10 py-7 rounded-md w-full"
						type="button"
						onClick={onTimeout}
					>
						{'Start forfra'}
					</button>
				</div>
			</div>
		</CloseableModal>
	)
}

export default TimeoutWarningWindow
