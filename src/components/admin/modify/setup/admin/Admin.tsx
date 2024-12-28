import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { type PatchAdminType, type PostAdminType, type AdminType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import Timestamps from '../../ui/Timestamps'
import useCUDOperations from '@/hooks/useCUDOperations'
import useFormState from '@/hooks/useFormState'

const Admin = ({
	admins,
	admin
}: {
	admins: AdminType[]
	admin: AdminType
}): ReactElement => {
	const [isEditing, setIsEditing] = useState(false)
	const { formState: newAdmin, handleFieldChange, handleValidationChange, resetFormState, formIsValid } = useFormState(admin, isEditing)
	const { updateEntity, deleteEntity } = useCUDOperations<PostAdminType, PatchAdminType>('/v1/admins')
	const [newPassword, setNewPassword] = useState('')
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

	return (
		<div className="p-2 m-2">
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="italic text-gray-500">{'Brugernavn'}</p>
					<div className="font-bold pb-2 text-gray-800">
						<EditableField
							fieldName="name"
							initialText={admin.name}
							placeholder="Navn"
							minSize={10}
							required={true}
							maxLength={50}
							validations={[{
								validate: (v: string) => !admins.some((a) => a.name === v && a._id !== newAdmin._id),
								message: 'Navn er allerede i brug'
							}]}
							editable={isEditing}
							onChange={(value) => { handleFieldChange('name', value) }}
							onValidationChange={handleValidationChange}
						/>
					</div>
					{isEditing &&
						<div className="text-center">
							<p className="italic text-gray-500">{'Nyt Kodeord'}</p>
							<div className="font-bold pb-2 text-gray-800">
								<EditableField
									fieldName="password"
									initialText={newPassword}
									placeholder="Nyt Kodeord"
									minSize={10}
									minLength={4}
									maxLength={100}
									editable={isEditing}
									onChange={setNewPassword}
									onValidationChange={handleValidationChange}
								/>
							</div>
						</div>
					}
				</div>
				<Timestamps
					createdAt={admin.createdAt}
					updatedAt={admin.updatedAt}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={() => {
						setNewPassword('')
						resetFormState()
						setIsEditing(false)
					}}
					handleCompleteEdit={() => {
						updateEntity(newAdmin._id, {
							name: newAdmin.name,
							password: newPassword.length > 0 ? newPassword : undefined
						})
						setNewPassword('')
						setIsEditing(false)
					}}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
					formIsValid={formIsValid}
				/>
			</div>
			{showDeleteConfirmation &&
				<ConfirmDeletion
					itemName={admin.name}
					onClose={() => {
						setShowDeleteConfirmation(false)
					}}
					onSubmit={(confirm: boolean) => {
						setShowDeleteConfirmation(false)
						deleteEntity(admin._id, confirm)
					}}
				/>
			}
		</div>
	)
}

export default Admin
