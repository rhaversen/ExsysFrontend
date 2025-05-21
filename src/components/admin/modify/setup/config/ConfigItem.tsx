import axios from 'axios'
import React, { type ReactElement, useCallback, useState, useEffect } from 'react'

import SaveFeedback, { useSaveFeedback } from '@/components/ui/SaveFeedback'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ConfigsType } from '@/types/backendDataTypes'

const ConfigItem = ({
	label,
	value, // value is in milliseconds
	readableLabel,
	description,
	onSave
}: {
	label: keyof ConfigsType['configs']
	value: number | string
	readableLabel: string
	description: string
	onSave: (label: string, value: number | string) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const isString = typeof value === 'string'
	// convert ms to seconds string or passthrough string
	const toDisplay = useCallback(
		(val: string | number) => isString ? val.toString() : (Number(val) / 1000).toString(),
		[isString]
	)
	const toPatch = useCallback(
		(input: string) => isString ? input : Number(input) * 1000,
		[isString]
	)
	const [rawValue, setRawValue] = useState<string>(toDisplay(value))
	// sync when prop value changes
	useEffect(() => { setRawValue(toDisplay(value)) }, [toDisplay, value])
	const hasChanged = rawValue !== toDisplay(value)
	const { showSuccess, showSuccessMessage } = useSaveFeedback()

	const patchConfig = useCallback(async () => {
		const patch = { [label]: toPatch(rawValue) }
		try {
			const response = await axios.patch<ConfigsType>(API_URL + '/v1/configs', patch, { withCredentials: true })
			onSave(label, response.data.configs[label] as number | string)
			showSuccessMessage()
		} catch (error) {
			addError(error)
		}
	}, [API_URL, label, rawValue, toPatch, onSave, showSuccessMessage, addError])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && hasChanged) { patchConfig() }
	}

	return (
		<div className="p-4 bg-slate-50 rounded-md border border-slate-200">
			<div className="flex flex-col gap-3">
				<div>
					<label htmlFor={label} className="block font-medium text-slate-800 mb-1">
						{readableLabel}
					</label>
					<div className="flex items-center">
						<input
							id={label}
							type={isString ? 'text' : 'number'}
							value={rawValue}
							aria-label={readableLabel}
							placeholder={toDisplay(value)}
							title={readableLabel}
							onChange={(e) => setRawValue(e.target.value)}
							onKeyDown={handleKeyDown}
							className="flex-grow px-3 py-2 border border-slate-500 min-w-0 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
						{!isString && <span className="ml-2 text-slate-700">{'sekunder'}</span>}
					</div>
				</div>
				<p className="text-sm text-slate-700 mt-1">
					{description}
				</p>
			</div>
			<div className="mt-4 flex justify-end items-center gap-3">
				<SaveFeedback show={showSuccess} />
				{hasChanged && (
					<>
						<button
							type="button"
							onClick={() => setRawValue(toDisplay(value))}
							className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
						>
							{'Annuller'}
						</button>
						<button
							type="button"
							onClick={patchConfig}
							className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							{'Gem'}
						</button>
					</>
				)}
			</div>
		</div>
	)
}

export default ConfigItem
