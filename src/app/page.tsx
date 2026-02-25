'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useCUDOperations from '@/hooks/useCUDOperations'
import { FeedbackMessageType, PatchFeedbackMessageType, PostFeedbackMessageType } from '@/types/backendDataTypes'

export default function Page (): ReactElement {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [isLoading, setIsLoading] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)

	const { createEntityAsync } = useCUDOperations<PostFeedbackMessageType, PatchFeedbackMessageType, FeedbackMessageType>(
		'/v1/feedback/message'
	)

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
			addError(error)
		}
	}, [API_URL, addError, router])

	useEffect(() => {
		checkAuth().catch((error) => {
			addError(error)
		})
	}, [checkAuth, router, addError])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault()
		setIsLoading(true)
		setIsSuccess(false)
		const formData = new FormData(event.currentTarget)
		const data = Object.fromEntries(formData.entries())
		try {
			await createEntityAsync({
				name: data.name as string,
				message: data.message as string
			})
			setIsSuccess(true)
			;(event.target as HTMLFormElement).reset()
		} catch (error) {
			addError(error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
			<div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mb-12">
				<h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{'Ris og Ros'}</h1>
				<p className="text-center text-gray-600 mb-6">{'Skriv din ris og ros i felterne nedenfor. Indtast venligst dit navn eller email, hvis vi må kontakte dig.'}</p>

				{isSuccess ? (
					<div className="flex flex-col h-full items-center justify-center text-center p-2 bg-green-100 text-green-700 rounded-md">
						<h3 className="text-xl font-semibold">{'Tak for dit svar!'}</h3>
						<p className="text-sm mt-2">{'Vi værdsætter din tid og dine tanker.'}</p>
						<button
							type="button"
							onClick={() => setIsSuccess(false)}
							className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
						>
							{'Skriv mere'}
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="nameFeedbackForm" className="block text-sm font-medium text-gray-700 mb-1 text-left">{'Navn eller Email (valgfrit)'}</label>
							<input
								type="text"
								name="name"
								id="nameFeedbackForm"
								placeholder="Navn eller email"
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
							/>
						</div>
						<div>
							<label htmlFor="messageFeedbackForm" className="block text-sm font-medium text-gray-700 mb-1 text-left">{'Ris og Ros'}</label>
							<textarea
								name="message"
								id="messageFeedbackForm"
								required
								rows={4}
								placeholder="Skriv her..."
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
							/>
						</div>
						<button
							type="submit"
							disabled={isLoading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors"
						>
							{isLoading ? 'Sender...' : 'Send'}
						</button>
					</form>
				)}
			</div>

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
