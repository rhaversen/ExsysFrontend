import { type Validation } from '@/types/frontendDataTypes'
import { useCallback, useEffect, useState } from 'react'

const useValidation = (value: string, validations: Validation[] | undefined, required: boolean, placeholder: string, minLength: number, maxLength: number, maxValue: number, type: 'text' | 'number'): {
	errors: string[]
	isValid: boolean
} => {
	const [errors, setErrors] = useState<string[]>([])

	const validate = useCallback((): string[] => {
		const newErrors: string[] = []
		if (required || value.length > 0) {
			if (minLength === maxLength && value.length !== minLength) {
				newErrors.push(placeholder + ' skal være præcis ' + minLength + ' tegn lang')
			} else if (value.length < minLength) {
				newErrors.push(placeholder + ' skal være mindst ' + minLength + ' tegn lang')
			} else if (value.length > maxLength) {
				newErrors.push(placeholder + ' kan ikke være længere end ' + maxLength + ' tegn')
			}
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
	}, [maxLength, maxValue, minLength, placeholder, required, type, validations, value])

	useEffect(() => {
		const validationErrors = validate()
		setErrors(validationErrors)
	}, [validate])

	return {
		errors,
		isValid: required ? value.length > 0 && errors.length === 0 : errors.length === 0
	}
}

export default useValidation
