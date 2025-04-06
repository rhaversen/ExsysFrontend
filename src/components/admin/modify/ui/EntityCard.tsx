import React, { type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

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
			<div className="flex flex-row gap-1">
				<button
					onClick={() => {
						setShowDeleteConfirmation(true)
					}}
					type="button"
					title="Slet"
					className="w-4 h-4 mx-1 place-self-center hover:bounceOrig"
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
					className="w-6 h-6 place-self-center transition-transform duration-300 transform hover:-rotate-180"
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
				<div className="w-6 h-6 relative">
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
						className="w-full h-full place-self-center transition-transform duration-300 transform hover:rotate-12 hover:scale-125"
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
				className="py-1 px-6 rounded-full border border-blue-500"
			>
				<Image
					width={40}
					height={40}
					className="w-6 h-6 place-self-center transition-transform duration-300 transform hover:-translate-y-0.5 hover:-rotate-45"
					src={AdminImages.edit.src}
					alt={AdminImages.edit.alt}
				/>
				<span className="sr-only">{'Edit'}</span>
			</button>
		)
	}
}

const Timestamps = ({
	createdAt,
	updatedAt
}: {
	createdAt: string
	updatedAt: string
}): ReactElement => {
	const currentDate = new Date()
	const currentYear = currentDate.getFullYear()

	const createdDate = new Date(createdAt)
	const updatedDate = new Date(updatedAt)

	const isCreatedToday = createdDate.toDateString() === currentDate.toDateString()
	const isUpdatedToday = updatedDate.toDateString() === currentDate.toDateString()

	const formatDate = (date: Date): string => {
		let dateStr = date.toLocaleDateString('da-DK', {
			day: 'numeric',
			month: 'long'
		})
		if (date.getFullYear() !== currentYear) {
			dateStr += ` ${date.getFullYear()}`
		}
		return dateStr
	}

	const formatTime = (date: Date): string => 'i dag ' + date.toLocaleTimeString('da-DK', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: false
	})

	const created = isCreatedToday ? formatTime(createdDate) : formatDate(createdDate)
	const updated = isUpdatedToday ? formatTime(updatedDate) : formatDate(updatedDate)

	return (
		<div className="flex items-start gap-3">
			<div className="text-xs text-gray-500 flex items-center"
				title="Oprettet"
			>
				<Image
					className="h-4 w-4"
					src={AdminImages.created.src}
					alt={AdminImages.created.alt}
					width={10}
					height={10}
				/>
				<span>{created}</span>
			</div>
			{createdAt !== updatedAt && (
				<div className="text-xs text-gray-500 flex items-center"
					title="Opdateret"
				>
					<Image
						className="h-4 w-4"
						src={AdminImages.updated.src}
						alt={AdminImages.updated.alt}
						width={10}
						height={10}
					/>
					<span>{updated}</span>
				</div>
			)}
		</div>
	)
}

const EntityCard = ({
	children,
	isActive,
	onToggleActivity,
	isEditing,
	setIsEditing,
	onHandleUndoEdit,
	onHandleCompleteEdit,
	setShowDeleteConfirmation,
	formIsValid,
	canClose = true,
	createdAt,
	updatedAt
}: {
	children: ReactNode
	isActive?: boolean
	onToggleActivity?: () => void
	isEditing: boolean
	setIsEditing: (value: boolean) => void
	onHandleUndoEdit: () => void
	onHandleCompleteEdit: () => void
	setShowDeleteConfirmation: (value: boolean) => void
	formIsValid: boolean
	canClose?: boolean
	createdAt: string
	updatedAt: string
}): ReactElement => {
	const [isHovered, setIsHovered] = useState(false)

	return (
		<div className="border rounded-lg bg-white hover:bg-gray-50 w-full shadow-sm relative">
			<div className="flex justify-between items-center p-1">
				<div className="flex items-center gap-3">
					{isActive !== undefined && (onToggleActivity != null) && (
						<button
							onClick={() => {
								onToggleActivity()
								setIsHovered(false)
							}}
							onMouseEnter={() => { setIsHovered(true) }}
							onMouseLeave={() => { setIsHovered(false) }}
							title={isActive ? 'Skjul produkt' : 'Vis produkt'}
							className={`rounded-full w-20 flex items-center justify-center p-2 ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
						>
							{isHovered
								? (isActive
									? (<FaEyeSlash className="w-5 h-5" />)
									: (<FaEye className="w-5 h-5" />))
								: (isActive
									? (<FaEye className="w-5 h-5" />)
									: (<FaEyeSlash className="w-5 h-5" />))
							}
							<div className="text-xs font-medium px-1 text-gray-500">{isActive ? 'Aktiv' : 'Skjult'}</div>
						</button>
					)}
					<Timestamps
						createdAt={createdAt}
						updatedAt={updatedAt}
					/>
				</div>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={onHandleUndoEdit}
					handleCompleteEdit={onHandleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
					canClose={canClose}
				/>
			</div>
			{children}
		</div>
	)
}

export default EntityCard
