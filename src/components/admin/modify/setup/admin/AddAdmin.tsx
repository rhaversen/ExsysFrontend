import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type AdminType, type PostAdminType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

const AddAdmin = ({
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

	const handleCancel = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleAdd = useCallback((): void => {
		if (!formIsValid) return
		postAdmin(admin)
	}, [postAdmin, admin, formIsValid])

	return (
		<div className="border rounded-lg bg-white w-full shadow-sm mb-1 border-blue-300 border-dashed">
			<div className="flex justify-center rounded-t-lg items-center px-1 py-1 bg-blue-50 border-b border-blue-200">
				<span className="font-medium text-blue-700">{'Ny Admin'}</span>
			</div>
			<div className="flex flex-wrap">
				{/* 1. Navn */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Navn'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
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
							editable={true}
							initialText=""
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>

				{/* 2. Adgangskode */}
				<div className="flex flex-col items-center p-1 flex-1">
					<div className="text-xs font-medium text-gray-500 mb-1">{'Adgangskode'}</div>
					<div className="text-gray-800 flex items-center justify-center text-sm">
						<EditableField
							fieldName="password"
							placeholder="Adgangskode"
							minSize={10}
							required={true}
							onChange={handlePasswordChange}
							maxLength={100}
							minLength={4}
							editable={true}
							initialText=""
							onValidationChange={handleValidationChange}
						/>
					</div>
				</div>
			</div>
			<div className="flex justify-end p-2 gap-2">
				<button
					onClick={handleCancel}
					className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
					type="button"
				>
					{'Annuller\r'}
				</button>
				<button
					onClick={handleAdd}
					disabled={!formIsValid}
					className={`px-3 py-1 text-sm rounded-full flex items-center ${
						formIsValid
							? 'bg-blue-600 hover:bg-blue-700 text-white'
							: 'bg-gray-200 text-gray-400 cursor-not-allowed'
					}`}
					type="button"
				>
					<Image className="h-4 w-4 mr-1" src={AdminImages.add.src} alt={AdminImages.add.alt} width={16} height={16} />
					{'Opret\r'}
				</button>
			</div>
		</div>
	)
}

export default AddAdmin
