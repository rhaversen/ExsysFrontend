import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import { useCallback, useEffect, useState } from 'react'

const useFormState = <T extends Record<string, any>> (initialState: T, isEditing: boolean): {
	formState: T
	handleFieldChange: (path: string, value: any) => void
	handleValidationChange: (fieldName: string, isValid: boolean) => void
	resetFormState: () => void
	formIsValid: boolean
} => {
	const [formState, setFormState] = useState<T>(initialState)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(false)

	useEffect(() => {
		setFormIsValid(Object.values(fieldValidations).every(Boolean))
	}, [fieldValidations])

	// Sync with incoming props when not editing
	useEffect(() => {
		if (!isEditing) {
			setFormState(initialState)
		}
	}, [initialState, isEditing])

	const handleFieldChange = useCallback((path: string, value: any) => {
		setFormState(prevState => {
			const newState = cloneDeep(prevState)
			set(newState, path, value)
			return newState
		})
	}, [])

	const handleValidationChange = useCallback((fieldName: string, isValid: boolean) => {
		setFieldValidations(prev => ({
			...prev,
			[fieldName]: isValid
		}))
	}, [])

	const resetFormState = useCallback((): void => {
		setFormState(cloneDeep(initialState))
		setFieldValidations({})
	}, [initialState])

	return {
		formState,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	}
}

export default useFormState
