import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement } from 'react'

import { useUser } from '@/contexts/UserProvider'

import { useError } from '../../../contexts/ErrorContext/ErrorContext'

const LogoutButton = ({
	className = ''
}: {
	className?: string
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { setCurrentUser } = useUser()

	const logout = (): void => {
		axios.post(`${API_URL}/v1/auth/logout-local`, {}, { withCredentials: true }).then(() => {
			setCurrentUser(null)
			router.push('/login-admin')
		}).catch(addError)
	}

	return (
		<div className={className}>
			<button
				className="px-2 w-full py-1 text-white rounded-md transition-all border-2 border-gray-500 bg-gray-800 hover:border-blue-500 hover:scale-110 hover:shadow-lg"
				type="button"
				onClick={logout}
			>
				{'Log ud'}
			</button>
		</div>
	)
}

export default LogoutButton
