import { type ReactElement, useEffect, useMemo } from 'react'

import ValidationErrorWindow from '@/components/admin/modify/ui/ValidationErrorWindow'
import { type InlineValidation } from '@/types/frontendDataTypes'

const InlineValidationField = ({
	fieldName,
	validations,
	onValidationChange
}: {
	fieldName: string
	validations: InlineValidation[]
	onValidationChange: (fieldName: string, isValid: boolean) => void
}): ReactElement => {
	const errors = useMemo(() => {
		const newErrors: string[] = []
		validations?.forEach((validation) => {
			if (!validation.validate()) {
				newErrors.push(validation.message)
			}
		})
		return newErrors
	}, [validations])

	const isValid = errors.length === 0

	// Notify parent component when validation changes
	useEffect(() => {
		onValidationChange(fieldName, isValid)
	}, [isValid, fieldName, onValidationChange])

	return (
		<>
			{errors.length > 0 && (
				<ValidationErrorWindow
					errors={errors}
				/>
			)}
		</>
	)
}

export default InlineValidationField
