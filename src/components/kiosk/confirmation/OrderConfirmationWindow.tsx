import axios from 'axios'
import Image from 'next/image'
import { useCallback, useRef, useState, type ReactElement } from 'react'
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi'

import CloseableModal from '@/components/ui/CloseableModal'
import TimeoutImage from '@/components/ui/TimeoutImage'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { useConfig } from '@/contexts/ConfigProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { KioskImages, LoadingImage } from '@/lib/images'
import type { FeedbackRatingValue } from '@/types/backendDataTypes'
import { type CheckoutMethod, type OrderStatus } from '@/types/frontendDataTypes'

const OrderConfirmationWindow = ({
	price,
	orderStatus,
	checkoutMethod,
	onClose,
	onCancelPayment,
	isCancelling = false
}: {
	price: number
	orderStatus: OrderStatus
	checkoutMethod: CheckoutMethod | null
	onClose: () => void
	onCancelPayment: () => void
	isCancelling?: boolean
}): ReactElement => {
	const { config } = useConfig()
	const { addError } = useError()
	const { track } = useAnalytics()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [selectedRating, setSelectedRating] = useState<FeedbackRatingValue | null>(null)
	const selectedRatingRef = useRef<FeedbackRatingValue | null>(null)

	const submitFeedbackAndClose = useCallback(async (): Promise<void> => {
		if (selectedRatingRef.current !== null) {
			try {
				await axios.post(`${API_URL}/v1/feedback/rating`, { rating: selectedRatingRef.current }, { withCredentials: true })
			} catch (error) {
				addError(error)
			}
		}
		onClose()
	}, [API_URL, addError, onClose])

	const handleTimeoutClose = useCallback(() => {
		track('confirmation_close')
		void submitFeedbackAndClose()
	}, [track, submitFeedbackAndClose])

	const handleTimeoutExpired = useCallback(() => {
		track('confirmation_timeout')
		void submitFeedbackAndClose()
	}, [track, submitFeedbackAndClose])

	const autoCloseMs = config?.configs.kioskOrderConfirmationTimeoutMs ?? 1000 * 10

	const handleSelectRating = (rating: FeedbackRatingValue): void => {
		track(rating === 'positive' ? 'confirmation_feedback_positive' : 'confirmation_feedback_negative')
		setSelectedRating(rating)
		selectedRatingRef.current = rating
	}

	const canClose = ['success', 'error', 'paymentFailed'].includes(orderStatus)
	const showTimeoutImage = canClose && orderStatus !== 'awaitingPayment'

	const headingTexts: Record<string, string> = {
		awaitingPayment: 'Betal på skærmen',
		success: 'Tak For Din Bestilling',
		error: 'Noget Gik Galt',
		loading: 'Sender Bestilling...',
		paymentFailed: 'Betaling Afbrudt'
	}

	const images: Record<string, { src: string, alt: string }> = {
		loading: LoadingImage,
		success: KioskImages.orderConfirmed,
		error: KioskImages.error,
		awaitingPayment: KioskImages.awaitingPayment,
		paymentFailed: KioskImages.paymentFailed
	}

	const imageProps = images[orderStatus]

	// The order was completed successfully
	let successMessage: ReactElement = <></>
	if (checkoutMethod === 'later' && price > 0) {
		successMessage = <p className="flex items-center justify-center">
			{'Betal '}
			<span className="font-bold text-xl mx-1 flex items-center">{price}{' kr'}</span>
			{' ved afhentning'}
		</p>
	}

	const paragraphContent: Record<OrderStatus, ReactElement> = {
		loading: <p>{'Vent venligst'}</p>,
		awaitingPayment: <p>{'Betal på skærmen til højre'}</p>,
		success: successMessage,
		paymentFailed: <p>{'Prøv igen, eller kontakt personalet'}</p>,
		error: <p>{'Kontakt venligst personalet'}</p>
	}

	return (
		<CloseableModal onClose={handleTimeoutClose} canClose={canClose}>
			<h2 className="text-2xl pt-3 px-5 font-bold mb-2 text-center text-gray-800">
				{headingTexts[orderStatus]}
			</h2>

			{paragraphContent[orderStatus] !== undefined && (
				<div className="mb-4 px-5 flex justify-center text-center text-gray-800">
					{paragraphContent[orderStatus]}
				</div>
			)}

			<div className="p-5 flex justify-center">
				<div className="w-48 h-48 relative">
					{showTimeoutImage ? (
						<TimeoutImage
							totalMs={autoCloseMs}
							onClick={handleTimeoutClose}
							onTimeout={handleTimeoutExpired}
							src={imageProps.src}
							alt={imageProps.alt}
							width={200}
							height={200}
						/>
					) : (
						<Image
							src={imageProps.src}
							alt={imageProps.alt}
							width={200}
							height={200}
							priority
						/>
					)}
				</div>
			</div>

			{orderStatus === 'success' && (
				<div className="px-5 pb-5">
					<p className="text-center text-gray-600 text-lg mb-4">
						{'Hvordan var din oplevelse?'}
					</p>
					<div className="flex justify-center gap-6">
						<button
							type="button"
							onClick={() => { handleSelectRating('negative') }}
							title="Negativ feedback"
							aria-label="Negativ feedback"
							className={`p-6 rounded-2xl shadow transition-all ${
								selectedRating === 'negative'
									? 'bg-red-500 text-white scale-110'
									: 'bg-white text-red-500 hover:bg-red-50 hover:scale-105 active:scale-95 border border-gray-200'
							}`}
						>
							<FiThumbsDown className="w-14 h-14" />
						</button>
						<button
							type="button"
							onClick={() => { handleSelectRating('positive') }}
							title="Positiv feedback"
							aria-label="Positiv feedback"
							className={`p-6 rounded-2xl shadow transition-all ${
								selectedRating === 'positive'
									? 'bg-green-500 text-white scale-110'
									: 'bg-white text-green-500 hover:bg-green-50 hover:scale-105 active:scale-95 border border-gray-200'
							}`}
						>
							<FiThumbsUp className="w-14 h-14" />
						</button>
					</div>
				</div>
			)}

			{orderStatus === 'awaitingPayment' && (
				<div className="flex p-5 justify-center items-center h-full">
					<button
						onClick={() => { track('payment_cancel'); onCancelPayment() }}
						className={`bg-gray-200 ${isCancelling ? '' : 'hover:bg-gray-300'} w-full text-gray-700 rounded-md py-3 px-4 mt-8 transition-colors`}
						type="button"
						disabled={isCancelling}
					>
						{isCancelling ? 'Afbryder…' : 'Afbryd betaling'}
					</button>
				</div>
			)}
		</CloseableModal>
	)
}

export default OrderConfirmationWindow
