'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import { type AdminType } from '@/types/backendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { setCurrentUser } = useUser()

	const login = useCallback(async (credentials: any) => {
		try {
			const response = await axios.post<{
				auth: boolean
				user: AdminType
			}>(`${API_URL}/v1/auth/login-admin-local`, credentials, { withCredentials: true })
			setCurrentUser(response.data.user)
			router.push('/admin')
		} catch (error: any) {
			setCurrentUser(null)
			addError(error)
		}
	}, [API_URL, addError, router, setCurrentUser])

	useEffect(() => {
		axios.get(`${API_URL}/v1/auth/is-admin`, { withCredentials: true }).then(() => {
			router.push('/admin')
		}).catch(() => {
			// Do nothing
		})
	}, [API_URL, router])

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault() // Prevent default form submission
		const formData = new FormData(event.currentTarget)
		const credentials = {
			name: formData.get('username'),
			password: formData.get('password'),
			stayLoggedIn: formData.get('stayLoggedIn') === 'on' // Convert on to boolean
		}
		login(credentials).catch(addError)
	}, [addError, login])

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
			<form className="w-full max-w-sm flex flex-col justify-between space-y-5" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<label htmlFor="username" className="block text-sm font-medium text-gray-700">
						{'Brugernavn'}
					</label>
					<input type="username" id="username" name="username"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required />
				</div>
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-medium text-gray-700">
						{'Kodeord'}
					</label>
					<input type="password" id="password" name="password"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required />
				</div>
				<div className="space-y-2">
					<label htmlFor="stayLoggedIn" className="flex items-center">
						<input type="checkbox" id="stayLoggedIn" name="stayLoggedIn"
							className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
						<span className="ml-2 block text-sm text-gray-900">
							{'Forbliv logget ind'}
						</span>
					</label>
				</div>
				<div>
					<button type="submit"
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
						{'Log ind'}
					</button>
				</div>
			</form>
			<div className="mt-5">
				<button type="button" onClick={() => { router.push('/') }}
					className="text-sm text-indigo-600 hover:text-indigo-900">
					{'Tilbage'}
				</button>
			</div>
		</main>
	)
}
