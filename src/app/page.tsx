'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { type ReactElement, useCallback, useEffect, useState } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'

export default function Page (): ReactElement {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [loginAs, setLoginAs] = useState<'Admin' | 'Kiosk' | null>(null)
	const { addError } = useError()

	const checkAuth = useCallback(async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })

			try {
				await axios.get(`${API_URL}/v1/auth/is-admin`, { withCredentials: true })
				setLoginAs('Admin')
				return
			} catch (error) {
				addError(error)
			}

			try {
				await axios.get(`${API_URL}/v1/auth/is-kiosk`, { withCredentials: true })
				setLoginAs('Kiosk')
				return
			} catch (error) {
				addError(error)
			}

			setLoginAs(null) // No roles match
		} catch (error) {
			setLoginAs(null) // Authentication check failed
			addError(error)
		}
	}, [API_URL, addError])

	useEffect(() => {
		checkAuth().catch(() => {
			setLoginAs(null)
		})
	}, [API_URL, checkAuth])

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<h1 className="mb-4 text-2xl font-bold text-gray-800">
				{'Vælg Opgave'}
			</h1>
			<div className="flex space-x-4">
				<button
					type="button"
					className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
					onClick={() => {
						if (loginAs === 'Kiosk') {
							router.replace('/kiosk')
						} else {
							router.replace('/login-kiosk')
						}
					}}
				>
					{'Bestillings Station'}
				</button>
				<button
					type="button"
					className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
					onClick={() => {
						if (loginAs === 'Admin') {
							router.push('/admin')
						} else {
							router.push('/login-admin')
						}
					}}
				>
					{'Personale'}
				</button>
			</div>
		</main>
	)
}
