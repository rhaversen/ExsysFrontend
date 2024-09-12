import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type AdminType, type PostAdminType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const Admin = ({
	admins,
	onAdminPosted,
	onClose
}: {
	admins: AdminType[]
	onAdminPosted: (admin: AdminType) => void
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
			onAdminPosted(response.data as AdminType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onAdminPosted, onClose, addError])

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
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
			>
				<span className="sr-only">
					{'Close'}
				</span>
			</button>
			<div className="absolute bg-white rounded-3xl p-10">
				<div className="flex flex-col items-center justify-center">
					<div className="flex flex-col items-center justify-center">
						<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Admin'}</p>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName="name"
								placeholder="Navn"
								italic={false}
								minSize={10}
								required={true}
								editable={true}
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
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={handlePasswordChange}
								maxLength={100}
								minLength={4}
								onValidationChange={handleValidationChange}
							/>
						</div>
					</div>
				</div>
				<div className="flex flex-row justify-center gap-4 pt-5">
					<button
						type="button"
						className="bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4"
						onClick={handleCancelPost}
					>
						{'Annuller'}
					</button>
					<button
						type="button"
						disabled={!formIsValid}
						className={`${formIsValid ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-200'} text-white rounded-md py-2 px-4`}
						onClick={handleCompletePost}
					>
						{'Færdig'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default Admin
