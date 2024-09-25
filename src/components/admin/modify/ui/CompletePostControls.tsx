import React, { type ReactElement, useEffect } from 'react'

const CompletePostControls = ({
	canClose = true,
	formIsValid,
	handleCancelPost,
	handleCompletePost
}: {
	canClose?: boolean
	formIsValid: boolean
	handleCancelPost: () => void
	handleCompletePost: () => void
}): ReactElement => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' && canClose) {
				handleCancelPost()
			} else if (event.key === 'Enter' && formIsValid && canClose) {
				handleCompletePost()
			}
		}

		// Attach the event listener
		window.addEventListener('keydown', handleKeyDown)

		// Cleanup the event listener on component unmount
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [canClose, formIsValid, handleCancelPost, handleCompletePost])

	return (
		<div className="flex flex-row justify-center gap-4 pt-5">
			<button
				type="button"
				className="bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4"
				onClick={handleCancelPost}
			>
				{'Annuller'}
			</button>
			<button
				type="button"
				disabled={!formIsValid}
				className={`${formIsValid ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-200'} text-white rounded-md py-2 px-4`}
				onClick={handleCompletePost}
			>
				{'Færdig'}
			</button>
		</div>
	)
}

export default CompletePostControls
