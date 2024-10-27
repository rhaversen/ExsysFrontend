import ValidationErrorWindow from '@/components/admin/modify/ui/ValidationErrorWindow'
import useValidation from '@/hooks/useValidation'
import { type Validation } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

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
	const [borderColor, setBorderColor] = useState<'red' | 'blue' | 'green'>('blue')
	const inputRef = useRef<HTMLInputElement>(null)

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
			if (required && newValue === '') {
				setBorderColor('red')
			} else {
				setBorderColor('green')
			}
		}
	}, [type, maxLength, upperCase, onChange, required])

	// Notify parent component when validation changes
	useEffect(() => {
		onValidationChange(fieldName, isValid)
	}, [isValid, fieldName, onValidationChange])

	// Reset text and border color when editable prop changes
	useEffect(() => {
		if (!editable) {
			setText(initialText)
			setBorderColor('blue')
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
					className={`${italic ? 'italic' : ''} text-center bg-transparent border-2 rounded-md cursor-text transition-colors focus:outline-none ${borderColor === 'red' ? 'border-red-500' : borderColor === 'blue' ? 'border-blue-500' : 'border-green-500'}`}
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
				<ValidationErrorWindow
					errors={errors}
				/>
			}
		</div>
	)
}

export default EditableField
