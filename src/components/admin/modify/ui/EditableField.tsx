import ValidationErrorWindow from '@/components/ui/ValidationErrorWindow'
import { type Validation } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

const EditableField = ({
	text,
	placeholder,
	italic,
	editable,
	edited,
	validations,
	minSize,
	onChange,
	onValidationChange
}: {
	text: string
	placeholder: string
	italic: boolean
	editable: boolean
	edited: boolean
	validations?: Validation[]
	minSize?: number
	onChange: (v: string) => void
	onValidationChange?: (v: boolean) => void
}): ReactElement => {
	const ref = useRef<HTMLInputElement>(null)

	const [validationErrors, setValidationErrors] = useState<string[] | null>(null)

	const checkValidations = useCallback((v: string): void => {
		const validationFailed = validations?.some(({ validate }) => !validate(v))
		if (validationFailed !== undefined && validationFailed) {
			const failedValidations = validations?.filter(({ validate }) => !validate(v))
			if (failedValidations !== undefined) {
				setValidationErrors(failedValidations.map(({ message }) => message))
				onValidationChange !== undefined && onValidationChange(false)
			}
		} else {
			setValidationErrors(null)
			onValidationChange !== undefined && onValidationChange(true)
		}
	}, [validations, onValidationChange])

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
		const value = e.target.value
		onChange(value)
		checkValidations(value)
	}, [onChange, checkValidations])

	// Reset validation errors when not editable (e.g. when editing is cancelled or completed, meaning validation errors are no longer relevant)
	useEffect(() => {
		if (editable) return
		setValidationErrors(null)
	}, [editable])

	return (
		<div className="flex flex-row items-center">
			{editable &&
				<input
					ref={ref}
					type="text"
					value={text}
					placeholder={placeholder}
					onChange={handleInputChange}
					onBlur={handleInputChange}
					className={`${italic ? 'italic' : ''} text-center bg-transparent border-2 rounded-md cursor-text transition-colors duration-200 ease-in-out focus:outline-none w-auto ${edited ? `${validationErrors !== null ? 'border-red-500 hover:border-red-600 focus:border-red-700' : 'border-green-500 hover:border-green-600 focus:border-green-700'} ` : 'border-blue-500 hover:border-blue-600 focus:border-blue-700'}`}
					readOnly={!editable}
					size={Math.max(text.length, minSize ?? 1, 1)}
					aria-label={text}
				/>
			}
			{!editable &&
				<p className={`${italic ? 'italic' : ''} p-0 m-0 text-center border-0 rounded-md cursor-text transition-colors duration-200 ease-in-out focus:outline-none w-auto border-blue-500 hover:border-blue-600 focus:border-blue-700`}>
					{text}
				</p>
			}
			{validationErrors !== null &&
				<ValidationErrorWindow
					messages={validationErrors}
				/>
			}
		</div>
	)
}

export default EditableField
