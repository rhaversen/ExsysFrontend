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
		<div className="p-4 flex flex-col gap-4 bg-gray-50 rounded-lg shadow-sm">
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="w-full sm:w-1/2 text-black">
					<div className="font-medium text-gray-700 mb-1">
						{readableLabel}
					</div>
					<div className="flex items-center">
						<input
							type={isString ? 'text' : 'number'}
							value={rawValue}
							aria-label={readableLabel}
							placeholder={toDisplay(value)}
							title={readableLabel}
							onChange={(e) => setRawValue(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
						{!isString && <span className="ml-2 text-gray-700">{'Sekunder'}</span>}
					</div>
				</div>
				<div className="w-full sm:w-2/3 text-sm text-gray-600">
					{description}
				</div>
			</div>
			<div className="flex justify-between items-center gap-2">
				<SaveFeedback show={showSuccess} />
				{hasChanged && (
					<div className="flex gap-2">
						<button
							type="button"
							onClick={patchConfig}
							className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
						>
							{'Gem'}
						</button>
						<button
							type="button"
							onClick={() => setRawValue(toDisplay(value))}
							className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
						>
							{'Annuller'}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default ConfigItem
