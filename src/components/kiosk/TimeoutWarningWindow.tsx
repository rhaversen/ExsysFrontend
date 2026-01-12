import { type ReactElement } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'
import TimeoutButton from '@/components/ui/TimeoutButton'
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

	return (
		<CloseableModal onClose={onClose}>
			<div className="p-10 flex flex-col items-center gap-10 text-black">
				<h2 className="text-xl font-bold">
					{'Er du der stadig?'}
				</h2>
				<p className="text-center text-lg w-60">
					{'Din bestilling vil blive annulleret automatisk'}
				</p>
				<div className="flex flex-col gap-4 w-full">
					<button
						className="bg-blue-500 text-white text-lg px-10 py-7 rounded-md w-full"
						type="button"
						onClick={onClose}
					>
						{'Fortsæt bestilling'}
					</button>
					<TimeoutButton
						totalMs={timeoutWarningMs}
						onClick={onTimeout}
						className="bg-gray-300 text-gray-700 text-lg px-10 py-7 rounded-md w-full"
					>
						{'Start forfra'}
					</TimeoutButton>
				</div>
			</div>
		</CloseableModal>
	)
}

export default TimeoutWarningWindow
