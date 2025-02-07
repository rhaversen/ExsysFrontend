import { AdminImages } from '@/lib/images'
import Image from 'next/image'
import React, { type ReactElement, useEffect } from 'react'

const EditingControls = ({
	canClose = true,
	isEditing,
	formIsValid,
	setIsEditing,
	handleUndoEdit,
	handleCompleteEdit,
	setShowDeleteConfirmation
}: {
	canClose?: boolean
	isEditing: boolean
	formIsValid: boolean
	setIsEditing: (isEditing: boolean) => void
	handleUndoEdit: () => void
	handleCompleteEdit: () => void
	setShowDeleteConfirmation: (show: boolean) => void
}): ReactElement => {
	useEffect(() => {
		if (!isEditing) return

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' && canClose) {
				handleUndoEdit()
			} else if (event.key === 'Enter' && formIsValid && canClose) {
				handleCompleteEdit()
			}
		}

		// Attach the event listener
		window.addEventListener('keydown', handleKeyDown)

		// Cleanup the event listener on component unmount
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditing, handleUndoEdit, canClose, formIsValid, handleCompleteEdit])

	if (isEditing) {
		return (
			<div className="flex flex-row gap-5">
				<button
					onClick={() => {
						setShowDeleteConfirmation(true)
					}}
					type="button"
					title="Slet"
					className="w-5 h-5 mx-2.5 place-self-center hover:bounceOrig"
				>
					<span className="sr-only">{'Delete'}</span>
					<Image
						width={20}
						height={20}
						className="w-full h-full"
						src={AdminImages.delete.src}
						alt={AdminImages.delete.alt}
					/>
				</button>
				<button
					onClick={handleUndoEdit}
					type="button"
					title="Fortryd ændringer"
					className="w-10 h-10 place-self-center transition-transform duration-300 transform hover:-rotate-180"
				>
					<span className="sr-only">{'Undo changes'}</span>
					<Image
						width={40}
						height={40}
						className="w-full h-full"
						src={AdminImages.undo.src}
						alt={AdminImages.undo.alt}
					/>
				</button>
				<div className="w-10 h-10 relative">
					{!formIsValid && (
						<Image
							width={40}
							height={40}
							className="absolute top-0 left-0 w-full h-full z-10 cursor-not-allowed"
							src={AdminImages.confirmModificationBlocked.src}
							alt={AdminImages.confirmModificationBlocked.alt}
						/>
					)}
					<button
						onClick={handleCompleteEdit}
						type="button"
						title="Gem ændringer"
						disabled={!formIsValid}
						className={`w-full h-full place-self-center transition-transform duration-300 transform ${formIsValid ? 'hover:rotate-12 hover:scale-125' : 'scale-90'}`}
					>
						<span className="sr-only">{'Complete changes'}</span>
						<Image
							width={40}
							height={40}
							className="w-full h-full"
							src={AdminImages.confirmModification.src}
							alt={AdminImages.confirmModification.alt}
						/>
					</button>
				</div>
			</div>
		)
	} else {
		return (
			<button
				onClick={() => {
					setIsEditing(true)
				}}
				type="button"
				title="Rediger"
				className="w-1/2 h-10 border-2 border-blue-500 rounded-full m-5"
			>
				<Image
					width={40}
					height={40}
					className="w-full h-full place-self-center transition-transform duration-300 transform hover:-translate-y-0.5 hover:-rotate-45"
					src={AdminImages.edit.src}
					alt={AdminImages.edit.alt}
				/>
				<span className="sr-only">{'Edit'}</span>
			</button>
		)
	}
}

export default EditingControls
