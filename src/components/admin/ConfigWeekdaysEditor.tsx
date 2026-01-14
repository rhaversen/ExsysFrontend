import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import 'dayjs/locale/da'
import { FaBan } from 'react-icons/fa'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useCUDOperations from '@/hooks/useCUDOperations'
import type { ConfigsType } from '@/types/backendDataTypes'

dayjs.locale('da')

const weekdayNumbers = [1, 2, 3, 4, 5, 6, 0] // Monday=1 ... Sunday=0 (JS Sunday=0)
const weekdayShorthands = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
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

	const configData = configs?.configs
	const disabledWeekdays = useMemo(() => configData?.disabledWeekdays ?? [], [configData])

	const handleToggle = useCallback(async (weekday: number) => {
		if (!configData) { return }
		const current = disabledWeekdays
		const next = current.includes(weekday)
			? current.filter(w => w !== weekday)
			: [...current, weekday].sort()
		try {
			await updateEntityAsync('', { disabledWeekdays: next })
		} catch (e) {
			addError(e)
		}
	}, [configData, updateEntityAsync, addError, disabledWeekdays])

	if (!configData) { return null }

	return (
		<div className="flex flex-col gap-3">
			<div>
				<p className="text-sm text-gray-600">{'Tryk på en dag for at aktivere/deaktivere bestillinger.'}</p>
				<p className="text-sm text-gray-600">{'Deaktiverede dage vil ikke være tilgængelige for bestilling.'}</p>
			</div>

			<div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
				{weekdayNumbers.map((n, idx) => {
					const isDisabled = disabledWeekdays.includes(n)
					return (
						<button
							key={n}
							className={`
								flex flex-col items-center justify-center px-2 py-2 rounded-lg border font-medium transition
								${isDisabled
							? 'bg-red-50 border-red-200 text-red-700'
							: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}
								focus:outline-none focus:ring-2 focus:ring-blue-400
							`}
							onClick={() => handleToggle(n)}
							type="button"
							title={isDisabled
								? `${weekdayLabels[idx]} er deaktiveret`
								: `${weekdayLabels[idx]} er aktiv`}
						>
							<span className="text-xs sm:text-sm">{weekdayShorthands[idx]}</span>
							<span className="mt-1 h-4 flex items-center justify-center">
								{isDisabled
									? <FaBan className="text-red-400 w-3 h-3" aria-label="Deaktiveret" />
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
