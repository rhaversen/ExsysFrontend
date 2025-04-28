import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import 'dayjs/locale/da'
import { FaBan } from 'react-icons/fa'

import SaveFeedback, { useSaveFeedback } from '@/components/ui/SaveFeedback'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import useCUDOperations from '@/hooks/useCUDOperations'
import type { ConfigsType } from '@/types/backendDataTypes'

dayjs.locale('da')

const weekdayNumbers = [1, 2, 3, 4, 5, 6, 0] // Monday=1 ... Sunday=0 (JS Sunday=0)
const weekdayLabels = weekdayNumbers.map(n => dayjs().day(n).format('dddd').charAt(0).toUpperCase() + dayjs().day(n).format('dddd').slice(1))

const ConfigWeekdaysEditor = ({
	configs
}: {
    configs: ConfigsType | null
}) => {
	const [localConfigs, setLocalConfigs] = useState<ConfigsType | null>(configs)
	const { showSuccess, showSuccessMessage } = useSaveFeedback()
	const { addError } = useError()
	const { updateEntityAsync } = useCUDOperations<Partial<ConfigsType['configs']>, Partial<ConfigsType['configs']>, ConfigsType>(
		'/v1/configs'
	)

	// Listen for config updates
	useEntitySocketListeners<ConfigsType>(
		null,
		'configsUpdated',
		config => setLocalConfigs(config),
		config => setLocalConfigs(config),
		() => {}
	)

	useEffect(() => {
		setLocalConfigs(configs)
	}, [configs])

	const handleToggle = useCallback(async (weekday: number) => {
		if (!localConfigs) { return }
		const current = localConfigs.configs.disabledWeekdays
		const next = current.includes(weekday)
			? current.filter(w => w !== weekday)
			: [...current, weekday].sort()
		try {
			// For configs, PATCH is sent to /v1/configs (no id)
			const updated = await updateEntityAsync('', { ...localConfigs.configs, disabledWeekdays: next })
			setLocalConfigs(updated)
			showSuccessMessage()
		} catch (e) {
			addError(e)
		}
	}, [localConfigs, updateEntityAsync, addError, showSuccessMessage])

	if (!localConfigs) { return null }

	return (
		<div className="p-4 bg-gray-50 rounded-lg w-full">
			<div>
				<h2 className="text-lg text-gray-800">
					<span>{'Deaktiver ugedage for bestilling'}</span>
				</h2>
				<div className="text-gray-500 text-sm mb-2">
					{'Deaktiverede dage vil ikke være tilgængelige for bestilling.'}
				</div>
			</div>
			<div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
				{weekdayNumbers.map((n, idx) => {
					const isDisabled = localConfigs.configs.disabledWeekdays.includes(n)
					return (
						<button
							key={n}
							className={`
								flex flex-col items-center justify-center px-3 py-2 rounded-lg border font-medium transition
								${isDisabled
							? 'bg-red-100 border-red-300 text-red-700 shadow-inner'
							: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'}
								focus:outline-none focus:ring-2 focus:ring-blue-400
								group
							`}
							onClick={() => handleToggle(n)}
							type="button"
							title={isDisabled
								? `${weekdayLabels[idx]} er deaktiveret`
								: `${weekdayLabels[idx]} er aktiv`}
						>
							<span className="text-xs sm:text-sm">{weekdayLabels[idx]}</span>
							<span className="mt-1 h-4 flex items-center justify-center">
								{isDisabled
									? <FaBan className="text-red-500" aria-label="Deaktiveret" />
									: <span className="block w-2 h-2 rounded-full bg-green-500" aria-label="Aktiv"></span>
								}
							</span>
						</button>
					)
				})}
			</div>
			<SaveFeedback show={showSuccess} />
		</div>
	)
}

export default ConfigWeekdaysEditor
