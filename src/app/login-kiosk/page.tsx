'use client'

import axios, { AxiosError } from 'axios' // Import AxiosError
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react' // Import useState

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import { type KioskType } from '@/types/backendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { setCurrentUser } = useUser()
	const [isLoading, setIsLoading] = useState(false)
	const [showConflictWarning, setShowConflictWarning] = useState(false) // Renamed state
	const [overrideLogin, setOverrideLogin] = useState(false)

	const login = useCallback(async (credentials: {
			kioskTag: FormDataEntryValue | null
			password: FormDataEntryValue | null
			stayLoggedIn: boolean
			override?: boolean // Add optional override parameter
		}) => {
		try {
			setIsLoading(true)
			setShowConflictWarning(false) // Reset warning on new attempt
			const response = await axios.post<{
				auth: boolean
				user: KioskType
			}>(`${API_URL}/v1/auth/login-kiosk-local`, credentials, { withCredentials: true })
			setCurrentUser(response.data.user)
			// setShowConflictWarning(false) // Already reset above
			router.replace('/kiosk')
		} catch (error) {
			setCurrentUser(null)
			// Check if it's a 409 conflict error
			if (error instanceof AxiosError && error.response?.status === 409) {
				setShowConflictWarning(true) // Show warning div and checkbox on 409
				// addError('Denne kiosk er allerede logget ind. Sæt flueben for at logge ind alligevel.') // Removed addError call
			} else {
				setShowConflictWarning(false) // Hide warning div and checkbox on other errors
				addError(error)
			}
		}
	}, [API_URL, addError, router, setCurrentUser])

	useEffect(() => {
		axios.get(`${API_URL}/v1/auth/is-kiosk`, { withCredentials: true }).then(() => {
			router.replace('/kiosk')
			return null
		}).catch(() => {
			// Do nothing
		})
	}, [API_URL, router])

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault() // Prevent default form submission
		const formData = new FormData(event.currentTarget)
		const credentials = {
			kioskTag: formData.get('kioskTag'),
			password: formData.get('password'),
			stayLoggedIn: true, // Always stay logged in for kiosk
			override: overrideLogin // Pass the override state
		}
		login(credentials) // Error is handled within login now
	}, [login, overrideLogin])

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
			<form className="w-full max-w-sm flex flex-col justify-between space-y-5" onSubmit={handleSubmit}>
				{/* ... Kiosk Tag and Password inputs ... */}
				<div className="space-y-2">
					<label htmlFor="kioskTag" className="block text-sm font-medium text-gray-700">
						{'Kiosk #'}
					</label>
					<input type="number" id="kioskTag" name="kioskTag" pattern="[0-9]*"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required
					/>
				</div>
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-medium text-gray-700">
						{'Kodeord'}
					</label>
					<input type="password" id="password" name="password"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required
					/>
				</div>

				{/* Conflict Warning Div and Override Checkbox - Conditionally Rendered */}
				{showConflictWarning && (
					<div className="space-y-3">
						<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
							<p className="font-bold">{'Advarsel: Kiosk allerede logget ind'}</p>
							<p>{'Denne kiosk ser ud til allerede at have en aktiv session. Dobbelttjek venligst, at du logger ind på den korrekte kiosk (korrekt Kiosk #).'}</p>
							<p className="mt-2">{'Det kan skabe problemer at have flere sessioner kørende samtidigt. Hvis du er sikker og vælger at logge ind alligevel, bedes du efterfølgende gå til administrator-siden og logge den gamle/forkerte session ud under "Login Sessioner".'}</p>
						</div>
						<div className="flex items-center">
							<input
								id="override"
								name="override"
								type="checkbox"
								checked={overrideLogin}
								onChange={(e) => { setOverrideLogin(e.target.checked) }}
								className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
							/>
							<label htmlFor="override" className="ml-2 block text-sm text-gray-900">
								{'Log ind alligevel'}
							</label>
						</div>
					</div>
				)}

				<div>
					<button type="submit"
						disabled={isLoading}
						className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
							isLoading ? 'opacity-50 cursor-not-allowed' : ''
						}`}>
						{isLoading ? 'Logger ind...' : 'Log ind'}
					</button>
				</div>
			</form>
			{/* ... Back button ... */}
			<div className="mt-5">
				<button type="button" onClick={() => { router.replace('/') }}
					className="text-sm text-indigo-600 hover:text-indigo-900">
					{'Tilbage'}
				</button>
			</div>
		</main>
	)
}
