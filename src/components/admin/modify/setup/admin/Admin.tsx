import { type ReactElement, useState } from 'react'

import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'
import { type AdminType, type PatchAdminType, type PostAdminType } from '@/types/backendDataTypes'

import EntityCard from '../../ui/EntityCard'

const Admin = ({
	admins,
	admin
}: {
	admins: AdminType[]
	admin: AdminType
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const {
		formState: newAdmin,
		handleFieldChange,
		handleValidationChange,
		resetFormState,
		formIsValid
	} = useFormState(admin, isEditing)
	const {
		updateEntity,
		deleteEntity
	} = useCUDOperations<PostAdminType, PatchAdminType>('/v1/admins')
	const [newPassword, setNewPassword] = useState('')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	return (
		<>
			<EntityCard
				isEditing={isEditing}
				setIsEditing={setIsEditing}
				onHandleUndoEdit={() => {
					setNewPassword('')
					resetFormState()
					setIsEditing(false)
				}}
				onHandleCompleteEdit={() => {
					updateEntity(newAdmin._id, {
						name: newAdmin.name,
						password: newPassword.length > 0 ? newPassword : undefined
					})
					setNewPassword('')
					setIsEditing(false)
				}}
				setShowDeleteConfirmation={setShowDeleteConfirmation}
				formIsValid={formIsValid}
				createdAt={admin.createdAt}
				updatedAt={admin.updatedAt}
			>
				{/* Username */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Brugernavn'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="name"
							initialText={admin.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={50}
							validations={[{
								validate: (v: string) => !admins.some((a) => a.name.trim().toLowerCase() === v.trim().toLowerCase() && a._id !== newAdmin._id),
								message: 'Navn er allerede i brug'
							}]}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* Password */}
				{isEditing && (
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Ny Adgangskode'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							<EditableField
								fieldName="password"
								initialText={newPassword}
								placeholder="Ny Adgangskode"
								minSize={10}
								minLength={4}
								maxLength={100}
								editable={isEditing}
								onChange={setNewPassword}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>
				)}
				{!isEditing && (
					<div className="flex flex-col items-center p-1 flex-1">
						<div className="text-xs font-medium text-gray-500 mb-1">{'Adgangskode'}</div>
						<div className="text-gray-800 flex items-center justify-center text-sm">
							{'******'}
						</div>
					</div>
				)}
			</EntityCard>

			{showDeleteConfirmation && (
				<ConfirmDeletion
					itemName={admin.name}
					onClose={() => { setShowDeleteConfirmation(false) }}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(admin._id, confirm)
					}}
				/>
			)}
		</>
	)
}

export default Admin
