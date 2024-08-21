'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useCallback, type ReactElement } from 'react'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()

	const login = useCallback(async (credentials: any) => {
		try {
			const response = await axios.post(`${API_URL}/v1/auth/login-kiosk-local`, credentials, { withCredentials: true })
			console.log(response.status)
			router.push('/orderstation')
		} catch (error: any) {
			console.error(error)
		}
	}, [API_URL, router])

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault() // Prevent default form submission
		const formData = new FormData(event.currentTarget)
		const credentials = {
			kioskTag: String(formData.get('kioskTag')),
			password: formData.get('password')
		}
		console.log(credentials)
		login(credentials).catch(console.error)
	}, [login])

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
			<form className="w-full max-w-sm flex flex-col justify-between space-y-5" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<label htmlFor="kioskTag" className="block text-sm font-medium text-gray-700">Kiosk Tag</label>
					<input type="number" id="kioskTag" name="kioskTag" pattern="[0-9]*" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
				</div>
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-medium text-gray-700">Kodeord</label>
					<input type="password" id="password" name="password" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
				</div>
				<div>
					<button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Log ind</button>
				</div>
			</form>
		</main>
	)
}