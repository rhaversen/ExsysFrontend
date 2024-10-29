import { useState, useEffect, useCallback } from 'react'
import set from 'lodash/set'

const useFormState = (initialState: any): {
	formState: any
	handleFieldChange: (path: string, value: any) => void
	handleValidationChange: (fieldName: string, isValid: boolean) => void
	formIsValid: boolean
} => {
	const [formState, setFormState] = useState(initialState)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(false)

	useEffect(() => {
		setFormIsValid(Object.values(fieldValidations).every(Boolean))
	}, [fieldValidations])

	const handleFieldChange = useCallback((path: string, value: any) => {
		setFormState((prevState: Partial<typeof initialState>) => {
			const newState = { ...prevState }
			set(newState, path, value)
			return newState
		})
	}, [])

	const handleValidationChange = useCallback((fieldName: string, isValid: boolean) => {
		setFieldValidations(prev => ({ ...prev, [fieldName]: isValid }))
	}, [])

	return { formState, handleFieldChange, handleValidationChange, formIsValid }
}

export default useFormState
