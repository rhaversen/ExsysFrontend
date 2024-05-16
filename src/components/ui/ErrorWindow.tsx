import React, { type ReactElement, useEffect, useState, useCallback } from 'react'

const ErrorWindow = ({
	errorMessage,
	onClose
}: {
	errorMessage: string
	onClose: () => void
}): ReactElement => {
	const timeOut = 5000
	const errorBounceIn = 100

	const [timeoutAnimation, setTimeoutAnimation] = useState(false)
	const [showError, setShowError] = useState(false)
	const [timeOutId, setTimeOutId] = useState<NodeJS.Timeout>()

	const handleClose = useCallback((): void => {
		setShowError(false)
		setTimeout(() => {
			onClose()
		}, errorBounceIn)
	}, [onClose])

	const handleMouseLeave = useCallback((): void => {
		const timeoutId = setTimeout(handleClose, timeOut)
		setTimeOutId(timeoutId)
		setTimeoutAnimation(true)
	}, [timeOut, handleClose, setTimeOutId, setTimeoutAnimation])

	const handleMouseEnter = useCallback((): void => {
		clearTimeout(timeOutId)
		setTimeoutAnimation(false)
	}, [timeOutId, setTimeoutAnimation])

	useEffect(() => {
		setShowError(true)
		setTimeoutAnimation(true)
	}, [])

	return (
		<div
			className={`fixed top-5 right-0 rounded-l-lg shadow-lg bg-red-800 z-50 transition-transform duration-[${errorBounceIn}ms] origin-right ease-in-out ${showError ? 'translate-x-0' : 'translate-x-full'}`}
			role="alert"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onKeyDown={(e) => {
				if (e.key === 'Enter') {
					handleMouseEnter()
				}
			}}
		>
			<div className="flex flex-row p-2">
				<div className="flex flex-col justify-center items-center">
					<h1 className="text-xl font-bold text-white">Der skete en fejl</h1>
					<p className="text-lg text-white">{errorMessage}</p>
				</div>
				<button
					type="button"
					className="text-3xl p-3"
					onClick={onClose}
				>
					X
				</button>
			</div>
			<div
				className={`ml-1 rounded-l h-1 bg-white transition-transform ${timeoutAnimation ? 'duration-[5000ms]' : 'duration-0'} origin-right ease-linear transform ${timeoutAnimation && 'translate-x-full'}`}/>
		</div>
	)
}

export default ErrorWindow
