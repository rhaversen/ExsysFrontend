'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement } from 'react'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

export default function Page (): ReactElement {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const checkAuth = async (): Promise<boolean> => {
		try {
			await axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
			return true
		} catch (error: any) {
			return false
		}
	}

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<h1 className="mb-4 text-2xl font-bold text-gray-800">Vælg Opgave</h1>
			<div className="flex space-x-4">
				<button
					type="button"
					className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
					onClick={() => {
						checkAuth().then((isAuthenticated) => {
							if (isAuthenticated) {
								router.push('/orderstation')
							} else {
								router.push('/login-kiosk')
							}
						}).catch(addError)
					}}
				>
					Bestillings Station
				</button>
				<button
					type="button"
					className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
					onClick={() => {
						checkAuth().then((isAuthenticated) => {
							if (isAuthenticated) {
								router.push('/admin')
							} else {
								router.push('/login-admin')
							}
						}).catch(addError)
					}}
				>
					Personale
				</button>
			</div>
		</main>
	)
}
