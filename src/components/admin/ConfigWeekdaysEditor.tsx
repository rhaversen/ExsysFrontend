import dayjs from 'dayjs'
import { useCallback } from 'react'
import 'dayjs/locale/da'
import { FaBan, FaCalendarAlt } from 'react-icons/fa'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
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
	const { addError } = useError()
	const { updateEntityAsync } = useCUDOperations<Partial<ConfigsType['configs']>, Partial<ConfigsType['configs']>, ConfigsType>(
		'/v1/configs'
	)

	const handleToggle = useCallback(async (weekday: number) => {
		if (!configs) { return }
		const current = configs.configs.disabledWeekdays
		const next = current.includes(weekday)
			? current.filter(w => w !== weekday)
			: [...current, weekday].sort()
		try {
			// For configs, PATCH is sent to /v1/configs (no id)
			await updateEntityAsync('', { disabledWeekdays: next })
		} catch (e) {
			addError(e)
		}
	}, [configs, updateEntityAsync, addError])

	if (!configs) { return null }

	return (
		<div className="p-4 bg-gray-50 rounded-lg w-full flex flex-col gap-2">
			{/* Header Section */}
			<div className="flex items-center gap-3">
				<FaCalendarAlt className="text-blue-500 text-2xl flex-shrink-0" />
				<h2 className="text-lg text-gray-800">{'Deaktiver ugedage for bestilling'}</h2>
			</div>

			{/* Description Section */}
			<div className="text-gray-500 text-sm">
				<div>{'Deaktiverede dage vil ikke være tilgængelige for bestilling.'}</div>
				<div>{'Tryk på en dag for at aktivere/deaktivere den.'}</div>
			</div>

			{/* Weekday Buttons */}
			<div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
				{weekdayNumbers.map((n, idx) => {
					const isDisabled = configs.configs.disabledWeekdays.includes(n)
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
		</div>
	)
}

export default ConfigWeekdaysEditor
