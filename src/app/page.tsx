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
		<main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
			{/* Main user action - prominent and welcoming */}
			<div className="mb-12 text-center max-w-lg">
				<h1 className="mb-3 text-5xl font-bold text-gray-800">
					{'Ris & Ros'}
				</h1>
				<p className="mb-8 text-xl text-gray-600">
					{'Din mening hjælper os med at blive bedre!'}
				</p>
				<button
					type="button"
					className="px-12 py-5 text-2xl font-bold text-white bg-green-500 rounded-2xl shadow-xl hover:bg-green-600 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-200"
					onClick={() => {
						router.push('/risros')
					}}
				>
					{'Tryk her for at give Ris & Ros'}
				</button>
			</div>

			{/* Staff login - smaller, less prominent */}
			<div className="text-center">
				<p className="text-sm text-gray-400 mb-3">{'Personale Login'}</p>
				<div className="flex gap-3">
					<button
						type="button"
						className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
						onClick={() => {
							router.push('/login-admin')
						}}
					>
						{'Admin'}
					</button>
					<button
						type="button"
						className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
						onClick={() => {
							router.replace('/login-kiosk')
						}}
					>
						{'Kiosk'}
					</button>

				</div>
			</div>
		</main>
	)
}
