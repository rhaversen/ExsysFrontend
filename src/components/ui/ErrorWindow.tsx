import { useCallback, useEffect, useState } from 'react'

const ErrorWindow = ({ error, onClose }: { error: string[]; onClose: () => void }) => {
	const renderDelay = 50
	const deRenderDelay = 200
	const timeOut = 5000 + renderDelay
	const errorBounceIn = 100

	const [timeoutAnimation, setTimeoutAnimation] = useState(false)
	const [showError, setShowError] = useState(false)

	const messages = error

	const handleClose = useCallback((): void => {
		setShowError(false)
		setTimeout(() => onClose(), errorBounceIn + deRenderDelay)
	}, [onClose])

	useEffect(() => {
		const renderTimer = setTimeout(() => setShowError(true), renderDelay)
		return () => clearTimeout(renderTimer)
	}, [])

	useEffect(() => {
		if (!showError) { return }
		setTimeoutAnimation(true)
		const closeTimer = setTimeout(handleClose, timeOut)
		return () => clearTimeout(closeTimer)
	}, [showError, handleClose, timeOut])

	return (
		<div
			className={`mb-2 rounded-l-lg shadow-lg bg-red-800 z-50 origin-right transition-transform duration-[${errorBounceIn}ms] ${showError ? 'translate-x-0 ease-out' : 'translate-x-full ease-in'}`}
			role="alert"
		>
			<div className="right-0 top-5 flex flex-row p-2">
				<div className="flex flex-col justify-center items-center">
					<h1 className="text-xl font-bold text-white">{'Der skete en fejl'}</h1>
					<ul className="list-disc pl-5">
						{messages.map((msg, idx) => (
							<li key={idx} className="text-lg text-white">{msg}</li>
						))}
					</ul>
				</div>
				<button type="button" className="text-3xl p-3" onClick={handleClose}>
          &times;
				</button>
			</div>
			<div
				className={`ml-1 rounded-l h-1 bg-white transition-transform ${timeoutAnimation ? 'duration-[5000ms] translate-x-full' : 'duration-0'} origin-right ease-linear transform`}
			/>
		</div>
	)
}

export default ErrorWindow
