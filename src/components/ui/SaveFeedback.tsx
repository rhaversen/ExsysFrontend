import React, { type ReactElement, useCallback, useEffect, useRef } from 'react'

export const useSaveFeedback = (): { showSuccess: boolean, showSuccessMessage: () => void } => {
	const [showSuccess, setShowSuccess] = React.useState(false)
	const timeoutRef = useRef<NodeJS.Timeout>(undefined)

	const showSuccessMessage = useCallback(() => {
		if (timeoutRef.current != null) {
			clearTimeout(timeoutRef.current)
		}
		setShowSuccess(true)
		timeoutRef.current = setTimeout(() => {
			setShowSuccess(false)
			timeoutRef.current = undefined
		}, 2000)
	}, [])

	useEffect(() => {
		return () => {
			if (timeoutRef.current != null) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return {
		showSuccess,
		showSuccessMessage
	}
}

const SaveFeedback = ({ show }: { show: boolean }): ReactElement => {
	return (
		<div className="h-6 items-center">
			{show && (
				<div className="text-green-600 text-sm">
					{'✓ Indstillinger gemt'}
				</div>
			)}
		</div>
	)
}

export default SaveFeedback
