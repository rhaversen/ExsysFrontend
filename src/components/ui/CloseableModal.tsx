import { type ReactElement, type ReactNode, useEffect } from 'react'

const CloseableModal = ({
	canClose = true,
	canComplete = false,
	onClose,
	onComplete,
	children
}: {
	canClose?: boolean
	canComplete?: boolean
	onClose: () => void
	onComplete?: () => void
	children: ReactNode
}): ReactElement => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' && canClose) {
				onClose()
			} else if (event.key === 'Enter' && canComplete && (onComplete !== undefined)) {
				onComplete()
			}
		}

		// Attach the event listener
		window.addEventListener('keydown', handleKeyDown)

		// Cleanup the event listener on component unmount
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [canClose, canComplete, onClose, onComplete])

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
				disabled={!canClose}
			>
				<span className="sr-only">{'Close'}</span>
			</button>
			<div className="absolute bg-white rounded-3xl p-10">
				{children}
			</div>
		</div>
	)
}

export default CloseableModal
