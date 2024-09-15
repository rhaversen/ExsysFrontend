import { type Validation } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

// Separate validation logic into a hook
const useValidation = (value: string, validations: Validation[] | undefined, required: boolean, placeholder: string, minLength: number, maxValue: number, type: 'text' | 'number'): {
	errors: string[]
	isValid: boolean
} => {
	const [errors, setErrors] = useState<string[]>([])

	const validate = useCallback((): string[] => {
		const newErrors: string[] = []
		if (required && value.length === 0) {
			newErrors.push(placeholder + ' er påkrævet')
		} else if (value.length > 0 && value.length < minLength) {
			newErrors.push(placeholder + ' skal være mindst ' + minLength + ' tegn')
		}
		if (type === 'number' && parseInt(value) > maxValue) {
			newErrors.push(placeholder + ' kan ikke være større end ' + maxValue)
		}
		validations?.forEach(validation => {
			if (!validation.validate(value)) {
				newErrors.push(validation.message)
			}
		})
		return newErrors
	}, [value, validations, required, placeholder, minLength, maxValue, type])

	useEffect(() => {
		const validationErrors = validate()
		setErrors(validationErrors)
	}, [validate])

	return {
		errors,
		isValid: errors.length === 0
	}
}

const EditableField = ({
	type = 'text',
	minLength = 0,
	maxLength = 50,
	maxValue = Number.MAX_SAFE_INTEGER,
	fieldName,
	initialText = '',
	placeholder,
	italic = false,
	editable = true,
	validations,
	required = false,
	minSize = 1,
	upperCase = false,
	onChange,
	onValidationChange
}: {
	type?: 'number' | 'text'
	minLength?: number
	maxLength?: number
	maxValue?: number
	fieldName: string
	initialText?: string
	placeholder: string
	italic?: boolean
	editable?: boolean
	validations?: Validation[]
	required?: boolean
	minSize?: number
	upperCase?: boolean
	onChange: (value: string) => void
	onValidationChange: (fieldName: string, isValid: boolean) => void
}): ReactElement => {
	const [text, setText] = useState<string>(initialText)
	const inputRef = useRef<HTMLInputElement>(null)

	// Use custom validation hook
	const {
		errors,
		isValid
	} = useValidation(text, validations, required, placeholder, minLength, maxValue, type)

	const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
		let newValue = event.target.value
		const isNumberType = type === 'number'
		const isInvalidNumber = isNumberType && (newValue !== '' && isNaN(Number(newValue)))
		const exceedsMaxLength = isNumberType && newValue.length > maxLength

		const allowChange = !exceedsMaxLength && !isInvalidNumber

		if (upperCase) {
			newValue = newValue.toUpperCase()
		}

		if (allowChange) {
			setText(newValue)
			onChange(newValue)
		}
	}, [type, onChange, upperCase, maxLength])

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
		<div className="flex flex-col items-center">
			{editable &&
				<input
					pattern={type === 'number' ? '[0-9]*' : undefined}
					ref={inputRef}
					maxLength={maxLength}
					type="text"
					value={text}
					placeholder={placeholder}
					onInput={handleChange}
					className={`${italic ? 'italic' : ''} border-blue-500 text-center bg-transparent border-2 rounded-md cursor-text transition-colors focus:outline-none`}
					readOnly={!editable}
					size={Math.max(text.length, minSize, 1)}
					aria-label={fieldName}
				/>
			}
			{!editable &&
				<p className={`${italic ? 'italic' : ''} p-0 m-0 text-center border-0 cursor-text focus:outline-none w-auto`}>
					{text}
				</p>
			}
			{errors.length > 0 &&
				<div
					className="my-2 not-italic rounded-lg border-2 border-red-800 text-red-800 font-bold flex flex-row items-center">
					<div
						className="w-6 h-6 m-1 border-2 text-sm border-red-800 rounded-full flex justify-center items-center">
						{'!'}
					</div>
					<div className="flex flex-col mx-2">
						{errors.map((error, i) => (
							<p key={i + error} className="text-sm">
								{error}
							</p>
						))}
					</div>
				</div>
			}
		</div>
	)
}

export default EditableField
