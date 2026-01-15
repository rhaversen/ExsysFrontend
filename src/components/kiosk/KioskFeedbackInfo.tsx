import axios from 'axios'
import { type ReactElement, useCallback, useState } from 'react'
import { FiArrowLeft, FiThumbsDown, FiThumbsUp } from 'react-icons/fi'
import QRCode from 'react-qr-code'

import TimeoutButton from '@/components/ui/TimeoutButton'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { FeedbackRatingValue } from '@/types/backendDataTypes'

const KioskFeedbackInfo = ({ onBack }: { onBack: () => void }): ReactElement => {
	const { track } = useAnalytics()
	const feedbackUrl = 'kantine.nyskivehus.dk/risros'
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [submittedRating, setSubmittedRating] = useState<FeedbackRatingValue | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const submitFeedback = async (rating: FeedbackRatingValue): Promise<void> => {
		if (isSubmitting) { return }
		track(rating === 'positive' ? 'feedback_positive' : 'feedback_negative')
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

	const handleBack = useCallback((): void => {
		track('feedback_back')
		onBack()
	}, [track, onBack])

	const handleAutoBack = useCallback((): void => {
		track('feedback_auto_back')
		onBack()
	}, [track, onBack])

	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center">
			<div className="flex flex-col items-center justify-center text-center">
				<h1 className="text-5xl font-bold mb-4 text-gray-800">{'Ris og Ros'}</h1>
				<p className="text-2xl mb-8 text-gray-600">{'Vurder din oplevelse med et tryk, eller scan QR-koden for at skrive en besked til os'}</p>

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

				<div className="flex flex-col items-center gap-6">
					<p className="text-lg text-gray-500 font-mono">{feedbackUrl}</p>
					<p className={`text-2xl font-semibold transition-opacity ${submittedRating !== null ? 'text-gray-600 opacity-100' : 'opacity-0'}`}>
						{'Tak for din vurdering!'}
					</p>
					{submittedRating !== null ? (
						<TimeoutButton
							totalMs={5000}
							onClick={handleBack}
							onTimeout={handleAutoBack}
							className="flex items-center gap-3 px-8 py-4 bg-gray-200 text-gray-700 font-semibold text-xl rounded-xl hover:bg-gray-300 transition-colors whitespace-nowrap"
						>
							<FiArrowLeft className="w-6 h-6 shrink-0" />
							<span>{'Tilbage'}</span>
						</TimeoutButton>
					) : (
						<button
							type="button"
							onClick={handleBack}
							className="flex items-center gap-3 px-8 py-4 bg-gray-200 text-gray-700 font-semibold text-xl rounded-xl hover:bg-gray-300 transition-colors whitespace-nowrap"
						>
							<FiArrowLeft className="w-6 h-6 shrink-0" />
							<span>{'Tilbage'}</span>
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default KioskFeedbackInfo