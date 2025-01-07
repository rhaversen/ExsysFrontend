import React, { type ReactElement, useCallback, useState } from 'react'
import axios from 'axios'
import { type ConfigsType } from '@/types/backendDataTypes'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const ConfigsView = ({
	label,
	value, // value is in milliseconds
	readableLabel,
	description,
	onSave
}: {
	label: keyof ConfigsType['configs']
	value: number
	readableLabel: string
	description: string
	onSave: (label: string, value: number) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [newValue, setNewValue] = useState(value / 1000) // Convert ms to seconds for display
	const [showSuccess, setShowSuccess] = useState(false)

	const patchConfig = useCallback((secondsValue: number): void => {
		const msValue = secondsValue * 1000 // Convert seconds to ms for backend
		const patch = { [label]: msValue }
		console.log(patch)
		axios.patch<ConfigsType>(API_URL + '/v1/configs', patch, { withCredentials: true }).then((response) => {
			console.log(response.data)
			onSave(label, Number(response.data.configs[label])) // Value from backend is in ms
			setShowSuccess(true)
			setTimeout(() => { setShowSuccess(false) }, 2000) // Hide after 2 seconds
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, label, addError, onSave])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === 'Enter' && newValue !== value / 1000) {
			patchConfig(newValue)
		}
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
							type="number"
							value={newValue} // Display in seconds
							aria-label={readableLabel}
							placeholder={(value / 1000).toString()} // Convert placeholder to seconds
							title={readableLabel}
							onChange={(e) => { setNewValue(Number(e.target.value)) }}
							onKeyDown={handleKeyDown} // Listen for Enter key
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
						<span className="ml-2 text-gray-700">{'Sekunder'}</span>
					</div>
				</div>
				<div className="w-full sm:w-2/3 text-sm text-gray-600">
					{description}
				</div>
			</div>
			<div className="flex justify-between items-center gap-2">
				<div className="text-sm text-green-600">
					{showSuccess && '✓ Gemt'}
				</div>
				{newValue !== value / 1000 && ( // Only show cancel if value changed
					<div className="flex gap-2">
						<button
							type='button'
							onClick={() => {
								patchConfig(newValue)
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
						>
							{'Gem'}
						</button>
						<button
							type='button'
							onClick={() => {
								setNewValue(value / 1000) // Reset to original value in seconds
							}}
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

export default ConfigsView
