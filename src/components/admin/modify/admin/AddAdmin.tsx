import EditableField from '@/components/admin/modify/ui/EditableField'
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type AdminType, type PostAdminType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import CompletePostControls from '../ui/CompletePostControls'

const Admin = ({
	admins,
	onClose
}: {
	admins: AdminType[]
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [admin, setAdmin] = useState<PostAdminType>({
		name: '',
		password: ''
	})
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(false)

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

	const postAdmin = useCallback((admin: PostAdminType): void => {
		axios.post(API_URL + '/v1/admins', admin, { withCredentials: true }).then((response) => {
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setAdmin({
			...admin,
			name: v
		})
	}, [admin])

	const handlePasswordChange = useCallback((v: string): void => {
		setAdmin({
			...admin,
			password: v
		})
	}, [admin])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postAdmin(admin)
	}, [postAdmin, admin])

	return (
		<CloseableModal onClose={onClose}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-col items-center justify-center">
					<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Admin'}</p>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="name"
							placeholder="Navn"
							minSize={10}
							required={true}
							onChange={handleNameChange}
							maxLength={50}
							validations={[{
								validate: (v: string) => !admins.some((a) => a.name === v),
								message: 'Navn er allerede i brug'
							}]}
							onValidationChange={handleValidationChange}
						/>
					</div>
					<div className="font-bold p-2 text-gray-800">
						<EditableField
							fieldName="password"
							placeholder="Kodeord"
							minSize={10}
							required={true}
							onChange={handlePasswordChange}
							maxLength={100}
							minLength={4}
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>
			</div>
			<CompletePostControls
				formIsValid={formIsValid}
				handleCancelPost={handleCancelPost}
				handleCompletePost={handleCompletePost}
			/>
		</CloseableModal>
	)
}

export default Admin
