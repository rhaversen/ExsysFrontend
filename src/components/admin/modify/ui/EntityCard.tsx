import React, { type ReactElement, type ReactNode, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import EditingControls from './EditControls'
import Timestamps from './Timestamps'

interface EntityCardProps {
	children: ReactNode
	isActive?: boolean
	onToggleActivity?: () => void
	isEditing: boolean
	setIsEditing: (value: boolean) => void
	onHandleUndoEdit: () => void
	onHandleCompleteEdit: () => void
	setShowDeleteConfirmation: (value: boolean) => void
	formIsValid: boolean
	canClose: boolean
	createdAt: string
	updatedAt: string
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
	canClose,
	createdAt,
	updatedAt
}: EntityCardProps): ReactElement => {
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
