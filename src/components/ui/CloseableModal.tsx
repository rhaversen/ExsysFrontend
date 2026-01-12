import { type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
}): ReactElement | null => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

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

	const modalContent = (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-xs">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
				disabled={!canClose}
			>
				<span className="sr-only">{'Close'}</span>
			</button>
			<div className="absolute bg-white rounded-3xl m-1 p-2 md:p-10">
				{children}
			</div>
		</div>
	)

	if (!mounted) {
		return null
	}

	return createPortal(modalContent, document.body)
}

export default CloseableModal
