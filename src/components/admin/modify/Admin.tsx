import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type AdminType, type PatchAdminType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Timestamps from './ui/Timestamps'

const Admin = ({
	admin,
	onAdminPatched,
	onAdminDeleted
}: {
	admin: AdminType
	onAdminPatched: (admin: AdminType) => void
	onAdminDeleted: (id: AdminType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [isEditing, setIsEditing] = useState(false)
	const [newAdmin, setNewAdmin] = useState<AdminType>(admin)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(true)
	const [newPassword, setNewPassword] = useState<string>('')

	// Update formIsValid when fieldValidations change
	useEffect(() => {
		const formIsValid = Object.values(fieldValidations).every((v) => v)
		setFormIsValid(formIsValid)
	}, [fieldValidations])

	const handleValidationChange = useCallback((fieldName: string, v: boolean): void => {
		setFieldValidations((prev) => {
			return {
				...prev,
				[fieldName]: v
			}
		})
	}, [])

	const patchAdmin = useCallback((adminPatch: PatchAdminType): void => {
		axios.patch(API_URL + `/v1/admins/${admin._id}`, adminPatch, { withCredentials: true }).then((response) => {
			onAdminPatched(response.data as AdminType)
		}).catch((error) => {
			addError(error)
			setNewAdmin(admin)
		})
	}, [API_URL, onAdminPatched, addError, admin])

	const deleteAdmin = useCallback((confirm: boolean): void => {
		axios.delete(API_URL + `/v1/admins/${admin._id}`, {
			data: { confirm },
			withCredentials: true
		}).then(() => {
			onAdminDeleted(admin._id)
		}).catch((error) => {
			addError(error)
			setNewAdmin(admin)
		})
	}, [API_URL, onAdminDeleted, addError, admin])

	const handleNameChange = useCallback((v: string): void => {
		setNewAdmin({
			...newAdmin,
			name: v
		})
	}, [newAdmin])

	const handlePasswordChange = useCallback((v: string): void => {
		setNewPassword(v)
	}, [])

	const handleUndoEdit = useCallback((): void => {
		setNewAdmin(admin)
		setIsEditing(false)
	}, [admin])

	const handleCompleteEdit = useCallback((): void => {
		patchAdmin({
			...newAdmin,
			password: newPassword === '' ? undefined : newPassword
		})
		setNewPassword('')
		setIsEditing(false)
	}, [patchAdmin, newAdmin, newPassword])

	const handleDeleteAdmin = useCallback((confirm: boolean): void => {
		deleteAdmin(confirm)
	}, [deleteAdmin])

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
							italic={false}
							minSize={10}
							required={true}
							validations={[{
								validate: (v: string) => v.length <= 50,
								message: 'Navn kan kun have 50 tegn'
							}]}
							editable={isEditing}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
							onValidationChange={(fieldName: string, v: boolean) => {
								handleValidationChange(fieldName, v)
							}}
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
									italic={false}
									minSize={10}
									required={false}
									validations={[{
										validate: (v: string) => v.length >= 4 || v.length === 0,
										message: 'Kodeord skal mindst have 4 tegn'
									},
									{
										validate: (v: string) => v.length <= 100,
										message: 'Kodeord kan kun have 100 tegn'
									}]}
									editable={isEditing}
									onChange={(v: string) => {
										handlePasswordChange(v)
									}}
									onValidationChange={(fieldName: string, v: boolean) => {
										handleValidationChange(fieldName, v)
									}}
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
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
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
						handleDeleteAdmin(confirm)
					}}
				/>
			}
		</div>
	)
}

export default Admin
