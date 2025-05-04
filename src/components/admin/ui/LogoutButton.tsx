import axios from 'axios'
import { useRouter } from 'next/navigation'
import { type ReactElement } from 'react'

import { useUser } from '@/contexts/UserProvider'

import { useError } from '../../../contexts/ErrorContext/ErrorContext'

const LogoutButton = ({
	className = '',
	isLoggingOut,
	setIsLoggingOut
}: {
	className?: string
	isLoggingOut: boolean
	setIsLoggingOut: (isLoggingOut: boolean) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { setCurrentUser } = useUser()

	const logout = (): void => {
		setIsLoggingOut(true)
		axios.post(`${API_URL}/v1/auth/logout-local`, {}, { withCredentials: true }).then(() => {
			setCurrentUser(null)
			router.push('/login-admin')
			// No need to explicitly hide modal on success, redirect handles it
			return null
		}).catch((error) => {
			setIsLoggingOut(false) // Hide modal on error
			addError(error)
		})
	}

	return (
		<div className={className}>
			<button
				className="px-2 w-full py-1 text-white rounded-md transition-all border-2 border-gray-500 bg-gray-800 hover:border-blue-500 hover:scale-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
				type="button"
				onClick={logout}
				disabled={isLoggingOut}
			>
				{'Log ud'}
			</button>
		</div>
	)
}

export default LogoutButton
