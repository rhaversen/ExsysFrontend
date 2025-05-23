'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { type ReactElement, useCallback, useEffect } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'

export default function Page (): ReactElement {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const checkAuth = useCallback(async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })

			try {
				await axios.get(`${API_URL}/v1/auth/is-admin`, { withCredentials: true })
				router.push('/admin')
			} catch {
				// Not an admin, proceed to check if kiosk
			}

			try {
				await axios.get(`${API_URL}/v1/auth/is-kiosk`, { withCredentials: true })
				router.replace('/kiosk')
			} catch {
				// Not a kiosk
			}
		} catch (error) {
			addError(error) // Authentication check failed
		}
	}, [API_URL, addError, router])

	useEffect(() => {
		checkAuth().catch((error) => {
			addError(error)
		})
	}, [checkAuth, router, addError])

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="mb-8 text-center">
				<h1 className="mb-4 text-4xl font-bold text-gray-800">
					{'Din Feedback Tæller!'}
				</h1>
				<p className="mb-6 text-lg text-gray-600">
					{'Hjælp os med at gøre bestillings-systemet bedre. Del din ris eller ros med os.'}
				</p>
				<button
					type="button"
					className="px-8 py-4 text-xl font-bold text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
					onClick={() => {
						router.push('/risros')
					}}
				>
					{'Giv Ris & Ros'}
				</button>
			</div>

			<div className="border-t border-gray-300 pt-8 mt-8 w-full max-w-md text-center">
				<h2 className="mb-4 text-xl font-semibold text-gray-700">
					{'Log ind'}
				</h2>
				<div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
					<button
						type="button"
						className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 sm:flex-1"
						onClick={() => {
							router.replace('/login-kiosk')
						}}
					>
						{'Bestillings Station'}
					</button>
					<button
						type="button"
						className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 sm:flex-1"
						onClick={() => {
							router.push('/login-admin')
						}}
					>
						{'Personale'}
					</button>
				</div>
			</div>
		</main>
	)
}
