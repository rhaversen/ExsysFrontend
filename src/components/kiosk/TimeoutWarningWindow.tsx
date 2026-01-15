import { useCallback, type ReactElement } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'
import TimeoutButton from '@/components/ui/TimeoutButton'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { useConfig } from '@/contexts/ConfigProvider'

const TimeoutWarningWindow = ({
	onClose,
	onTimeout,
	onRestart
}: {
	onClose: () => void
	onTimeout: () => void
	onRestart: () => void
}): ReactElement => {
	const { config } = useConfig()
	const { track } = useAnalytics()
	const timeoutWarningMs = config?.configs.kioskInactivityTimeoutWarningMs ?? 1000 * 10

	const handleClose = useCallback((): void => {
		track('timeout_continue')
		onClose()
	}, [track, onClose])

	const handleTimeout = useCallback((): void => {
		track('session_timeout')
		onTimeout()
	}, [track, onTimeout])

	const handleRestart = useCallback((): void => {
		track('timeout_restart')
		onRestart()
	}, [track, onRestart])

	return (
		<CloseableModal onClose={handleClose}>
			<div className="p-10 flex flex-col items-center gap-8 text-black">
				<h2 className="text-2xl font-bold">
					{'Er du der stadig?'}
				</h2>
				<p className="text-center text-gray-600 text-lg">
					{'Vi gør klar til næste bestilling, hvis ikke du ønsker at fortsætte'}
				</p>
				<div className="flex flex-col gap-3 w-full mt-2">
					<button
						className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold px-8 py-5 rounded-2xl w-full shadow-lg transition-all duration-200 active:scale-[0.98]"
						type="button"
						onClick={handleClose}
					>
						{'Fortsæt bestilling'}
					</button>
					<TimeoutButton
						totalMs={timeoutWarningMs}
						onClick={handleRestart}
						onTimeout={handleTimeout}
						className="bg-gray-200 hover:bg-gray-200 text-gray-900 text-base font-medium px-8 py-4 rounded-2xl w-full border border-gray-200 transition-all duration-200"
					>
						{'Start forfra'}
					</TimeoutButton>
				</div>
			</div>
		</CloseableModal>
	)
}

export default TimeoutWarningWindow
