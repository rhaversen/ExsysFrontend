import ValidationErrorWindow from '@/components/ui/ValidationErrorWindow'
import { type Validation } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

// Separate validation logic into a hook
const useValidation = (value: string, validations: Validation[], required: boolean): { errors: string[], isValid: boolean } => {
	const [errors, setErrors] = useState<string[]>([])

	const validate = useCallback((): string[] => {
		const newErrors: string[] = []
		if (required && value.length === 0) {
			newErrors.push('Dette felt er påkrævet')
		}
		validations.forEach(validation => {
			if (!validation.validate(value)) {
				newErrors.push(validation.message)
			}
		})
		return newErrors
	}, [value, validations, required])

	useEffect(() => {
		const validationErrors = validate()
		setErrors(validationErrors)
	}, [validate])

	return { errors, isValid: errors.length === 0 }
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
	const inputRef = useRef<HTMLInputElement>(null)

	// Use custom validation hook
	const { errors, isValid } = useValidation(text, validations, required)

	const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
		let newValue = event.target.value
		if (upperCase) {
			newValue = newValue.toUpperCase()
		}
		setText(newValue)
		onChange(newValue)
	}, [onChange, upperCase])

	// Notify parent component when validation changes
	useEffect(() => {
		onValidationChange(fieldName, isValid)
	}, [isValid, fieldName, onValidationChange])

	// Reset text when no longer editable
	useEffect(() => {
		if (!editable) {
			setText(initialText)
		}
	}, [editable, initialText])

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
			{errors.length > 0 &&
				<ValidationErrorWindow
					messages={errors}
				/>
			}
		</div>
	)
}

export default EditableField
