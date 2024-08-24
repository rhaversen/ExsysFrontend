import ValidationErrorWindow from '@/components/ui/ValidationErrorWindow'
import { type Validation } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

const validateField = (value: string, validations: Validation[], required: boolean = false): string[] => {
	const errors: string[] = []
	if (required && value.length === 0) {
		errors.push('Dette felt er påkrævet')
	}
	validations.forEach(validation => {
		if (!validation.validate(value)) {
			errors.push(validation.message)
		}
	})
	return errors
}

const EditableField = ({
	fieldName,
	initialText = '',
	placeholder,
	italic,
	editable,
	validations,
	required = false,
	minSize = 1,
	upperCase = false,
	onChange,
	onValidationChange
}: {
	fieldName: string
	initialText?: string
	placeholder: string
	italic: boolean
	editable: boolean
	validations: Validation[]
	required?: boolean
	minSize?: number
	upperCase?: boolean
	onChange: (value: string) => void
	onValidationChange: (fieldName: string, isValid: boolean) => void
}): ReactElement => {
	const [text, setText] = useState<string>(initialText)
	const [errors, setErrors] = useState<string[]>([])
	const inputRef = useRef<HTMLInputElement>(null)

	const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
		let newValue = event.target.value
		if (upperCase) {
			newValue = newValue.toUpperCase()
		}
		setText(newValue)
		onChange(newValue)
		const newErrors = validateField(newValue, validations, required)
		setErrors(newErrors)
		onValidationChange(fieldName, newErrors.length === 0)
	}, [onChange, validations, required, fieldName, onValidationChange, upperCase])

	// Reset text when no longer editable
	useEffect(() => {
		if (!editable) {
			setText(initialText)
		}
	}, [editable, initialText])

	useEffect(() => {
		setErrors(validateField(text, validations, required))
	}, [text, validations, required])

	return (
		<div className="flex flex-row items-center">
			{editable &&
				<input
					ref={inputRef}
					type="text"
					value={text}
					placeholder={placeholder}
					onChange={handleChange}
					onBlur={handleChange}
					className={`${italic ? 'italic' : ''} border-blue-500 text-center bg-transparent border-2 rounded-md cursor-text transition-colors focus:outline-none`}
					readOnly={!editable}
					size={Math.max(text.length, minSize ?? 1, 1)}
					aria-label={text}
				/>
			}
			{!editable &&
				<p className={`${italic ? 'italic' : ''} p-0 m-0 text-center border-0 cursor-text focus:outline-none w-auto`}>
					{text}
				</p>
			}
			{errors !== null &&
				<ValidationErrorWindow
					messages={errors}
				/>
			}
		</div>
	)
}

export default EditableField
