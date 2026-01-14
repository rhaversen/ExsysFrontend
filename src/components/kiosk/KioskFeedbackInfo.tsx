import axios from 'axios'
import { type ReactElement, useState } from 'react'
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi'
import QRCode from 'react-qr-code'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { FeedbackRatingValue } from '@/types/backendDataTypes'

const KioskFeedbackInfo = ({ onBack }: { onBack: () => void }): ReactElement => {
	const feedbackUrl = 'kantine.nyskivehus.dk/risros'
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [submittedRating, setSubmittedRating] = useState<FeedbackRatingValue | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const submitFeedback = async (rating: FeedbackRatingValue): Promise<void> => {
		if (isSubmitting) { return }
		setIsSubmitting(true)
		try {
			await axios.post(`${API_URL}/v1/feedback/rating`, { rating }, { withCredentials: true })
			setSubmittedRating(rating)
		} catch (error) {
			addError(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center">
			<button
				type="button"
				onClick={onBack}
				className="absolute top-4 left-4 z-10 flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
			>
				<span className="text-xl">{'←'}</span>
				<span>{'Tilbage'}</span>
			</button>

			<div className="flex flex-col items-center justify-center text-center">
				<h1 className="text-5xl font-bold mb-4 text-gray-800">{'Ris og Ros'}</h1>
				<p className="text-2xl mb-8 text-gray-600">{'Giv din feedback med et tryk eller scan QR-koden'}</p>

				<div className="flex items-center gap-12 mb-8">
					<button
						type="button"
						onClick={() => submitFeedback('negative')}
						disabled={isSubmitting || submittedRating !== null}
						title="Negativ feedback"
						aria-label="Negativ feedback"
						className={`p-8 rounded-2xl shadow-xl transition-all ${
							submittedRating === 'negative'
								? 'bg-red-500 text-white scale-110'
								: submittedRating !== null
									? 'bg-gray-200 text-gray-400 cursor-not-allowed'
									: 'bg-white text-red-500 hover:bg-red-50 hover:scale-105 active:scale-95'
						}`}
					>
						<FiThumbsDown className="w-20 h-20" />
					</button>

					<div className="p-6 bg-white rounded-2xl shadow-xl">
						<QRCode
							value={`https://${feedbackUrl}`}
							size={200}
							bgColor="#ffffff"
							fgColor="#000000"
							level="H"
						/>
					</div>

					<button
						type="button"
						onClick={() => submitFeedback('positive')}
						disabled={isSubmitting || submittedRating !== null}
						title="Positiv feedback"
						aria-label="Positiv feedback"
						className={`p-8 rounded-2xl shadow-xl transition-all ${
							submittedRating === 'positive'
								? 'bg-green-500 text-white scale-110'
								: submittedRating !== null
									? 'bg-gray-200 text-gray-400 cursor-not-allowed'
									: 'bg-white text-green-500 hover:bg-green-50 hover:scale-105 active:scale-95'
						}`}
					>
						<FiThumbsUp className="w-20 h-20" />
					</button>
				</div>

				{submittedRating !== null ? (
					<p className="text-2xl text-gray-600 font-semibold">{'Tak for din feedback!'}</p>
				) : (
					<p className="text-lg text-gray-500 font-mono">{feedbackUrl}</p>
				)}
			</div>
		</div>
	)
}

export default KioskFeedbackInfo