import ValidationErrorWindow from '@/components/ui/ValidationErrorWindow'
import { type Validation } from '@/lib/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

const EditableField = ({
	text,
	placeholder,
	italic,
	editable,
	edited,
	validations,
	onChange,
	onValidationChange
}: {
	text: string
	placeholder: string
	italic: boolean
	editable: boolean
	edited: boolean
	validations?: Validation[]
	onChange: (v: string) => void
	onValidationChange?: (v: boolean) => void
}): ReactElement => {
	const ref = useRef<HTMLInputElement>(null)

	const [validationError, setValidationError] = useState<string | null>(null)

	const checkValidations = useCallback((v: string): void => {
		const validationFailed = validations?.some(({ validate }) => !validate(v))
		if (validationFailed !== undefined && validationFailed) {
			const failedValidation = validations?.find(({ validate }) => !validate(v))
			if (failedValidation !== undefined) {
				setValidationError(failedValidation.message)
				onValidationChange !== undefined && onValidationChange(false)
			}
		} else {
			setValidationError(null)
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
		setValidationError(null)
	}, [editable])

	return (
		<div>
			{editable &&
				<input
					ref={ref}
					type="text"
					value={text}
					placeholder={placeholder}
					onChange={handleInputChange}
					onBlur={handleInputChange}
					className={`${italic ? 'italic' : ''} text-center bg-transparent border-2 rounded-md cursor-text transition-colors duration-200 ease-in-out focus:outline-none w-auto ${edited ? `${validationError !== null ? 'border-red-500 hover:border-red-600 focus:border-red-700' : 'border-green-500 hover:border-green-600 focus:border-green-700'} ` : 'border-blue-500 hover:border-blue-600 focus:border-blue-700'}`}
					readOnly={!editable}
					size={Math.max(text.length, 1)}
					aria-label={text}
				/>
			}
			{!editable &&
				<p className={`${italic ? 'italic' : ''} p-0 m-0 text-center border-0 rounded-md cursor-text transition-colors duration-200 ease-in-out focus:outline-none w-auto border-blue-500 hover:border-blue-600 focus:border-blue-700`}>
					{text}
				</p>
			}
			{validationError !== null &&
				<ValidationErrorWindow
					message={validationError}
				/>
			}
		</div>
	)
}

export default EditableField
