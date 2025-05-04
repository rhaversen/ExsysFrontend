import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

interface Option {
	value: string
	label: string
	disabled?: boolean
}

const Dropdown = ({
	options,
	initialValue = '',
	onChange,
	title,
	editable = true,
	placeholder,
	onValidationChange,
	fieldName,
	allowNullOption = false
}: {
	options: Option[]
	initialValue?: string
	onChange: (value: string) => void
	title?: string
	editable?: boolean
	placeholder?: string
	fieldName?: string
	onValidationChange?: (fieldName: string, isValid: boolean) => void
	allowNullOption?: boolean
}): ReactElement => {
	const [selectedValue, setSelectedValue] = useState<string>(initialValue)

	const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
		const value = event.target.value
		setSelectedValue(value)
		onChange(value)
		if (onValidationChange !== undefined && fieldName !== undefined) {
			onValidationChange(fieldName, value !== '')
		}
	}, [onChange, onValidationChange, fieldName])

	// Notify parent component about validation when component mounts
	useEffect(() => {
		if (onValidationChange !== undefined && fieldName !== undefined) {
			onValidationChange(fieldName, selectedValue !== '')
		}
	}, [selectedValue, onValidationChange, fieldName])

	// Reset selected value when no longer editable
	useEffect(() => {
		if (!editable) {
			setSelectedValue(initialValue ?? '')
		}
	}, [editable, initialValue])

	return (
		<div className="pb-2 flex flex-row items-center">
			{editable
				? (
					<select
						className="border-2 border-blue-500 bg-transparent rounded-md p-2 focus:outline-none transition-colors"
						value={selectedValue}
						onChange={handleChange}
						title={title}
					>
						{placeholder !== undefined && placeholder !== '' && (
							<option disabled value="">
								{placeholder}
							</option>
						)}
						{allowNullOption && (
							<option value="null-option">
								{'Intet\r'}
							</option>
						)}
						{options.map((option) => (
							<option key={option.value} value={option.value} disabled={option.disabled}>
								{option.label}
							</option>
						))}
					</select>
				)
				: (
					<p className="p-0 m-0 text-center border-0 cursor-text focus:outline-none w-auto">
						{options.find(option => option.value === selectedValue)?.label ?? 'Intet'}
					</p>
				)}
		</div>
	)
}

export default Dropdown
