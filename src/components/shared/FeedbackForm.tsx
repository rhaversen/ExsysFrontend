import axios from 'axios'
import { type ReactElement, useState, type FormEvent } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'

const FeedbackForm = (): ReactElement => {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [isLoading, setIsLoading] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault()
		setIsLoading(true)
		setIsSuccess(false)
		const formData = new FormData(event.currentTarget)
		const data = Object.fromEntries(formData.entries())
		try {
			await axios.post(`${apiUrl}/v1/feedback`, data, { withCredentials: true })
			setIsSuccess(true)
			;(event.target as HTMLFormElement).reset()
		} catch (error) {
			addError(error)
		} finally {
			setIsLoading(false)
		}
	}

	if (isSuccess) {
		return (
			<div className="flex flex-col h-full items-center justify-center text-center p-2 bg-green-100 text-green-700 rounded-md">
				<h3 className="text-xl font-semibold">{'Tak for din feedback!'}</h3>
				<p className="text-sm mt-2">{'Vi værdsætter din tid og dine tanker.'}</p>
				<button
					type="button"
					onClick={() => setIsSuccess(false)}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
				>
					{'Send mere feedback'}
				</button>
			</div>
		)
	}

	return (
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
				<label htmlFor="feedbackFeedbackForm" className="block text-sm font-medium text-gray-700 mb-1 text-left">{'Ris og Ros'}</label>
				<textarea
					name="feedback"
					id="feedbackFeedbackForm"
					required
					rows={4}
					placeholder="Din feedback her..."
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
	)
}

export default FeedbackForm
