import CloseableModal from '@/components/ui/CloseableModal'
import SubmitButton from '@/components/ui/SubmitButton'
import { type CheckoutMethod, type OrderStatus } from '@/types/frontendDataTypes'
import Image from 'next/image'
import React, { type ReactElement } from 'react'
import { KioskImages, LoadingImage } from '@/lib/images'

const OrderConfirmationWindow = ({
	price,
	orderStatus,
	checkoutMethod,
	onClose
}: {
	price: number
	orderStatus: OrderStatus
	checkoutMethod: CheckoutMethod | null
	onClose: () => void
}): ReactElement => {
	const canClose = ['success', 'error', 'failed'].includes(orderStatus)

	const headingTexts: Record<string, string> = {
		awaitingPayment: 'Betal på skærmen',
		success: 'Tak For Din Bestilling',
		error: 'Der Skete En Fejl',
		loading: 'Sender Bestilling...',
		failed: 'Betalingen Mislykkedes'
	}

	const images: Record<string, { src: string, alt: string }> = {
		loading: LoadingImage,
		success: KioskImages.orderConfirmed,
		error: KioskImages.error,
		awaitingPayment: KioskImages.awaitingPayment,
		failed: KioskImages.paymentFailed
	}

	const imageProps = images[orderStatus]

	// The order was completed successfully
	let successMessage = ''
	if (checkoutMethod === 'later') {
		successMessage = `Husk at betale ${price} kr når du modtager din bestilling`
	} else if (checkoutMethod === 'sumUp') {
		successMessage = 'Betalingen blev gennemført med kort'
	} else if (checkoutMethod === 'mobilePay') {
		successMessage = 'Betalingen blev gennemført med MobilePay'
	}

	// The order could not be completed
	let errorMessage = ''
	if (checkoutMethod === 'later') {
		errorMessage = 'Fejl ved oprettelse af bestilling'
	} else if (checkoutMethod === 'sumUp') {
		errorMessage = 'Fejl ved kortbetaling'
	} else if (checkoutMethod === 'mobilePay') {
		errorMessage = 'Fejl ved MobilePay-betaling'
	}

	// The payment failed
	let paymentFailedMessage = ''
	if (checkoutMethod === 'later') {
		paymentFailedMessage = 'Betalingen mislykkedes. Prøv igen eller vælg en anden metode'
	} else if (checkoutMethod === 'sumUp') {
		paymentFailedMessage = 'Kortbetaling mislykkedes. Prøv igen eller vælg en anden metode'
	} else if (checkoutMethod === 'mobilePay') {
		paymentFailedMessage = 'MobilePay-betaling mislykkedes. Prøv igen eller vælg en anden metode'
	}

	const paragraphContent: Record<OrderStatus, ReactElement> = {
		loading: <>{'Sender Bestilling'}</>,
		awaitingPayment: <>{'Afventer betaling'}</>,
		success: <>{successMessage}</>,
		paymentFailed: <>{paymentFailedMessage}</>,
		error: (
			<>
				{errorMessage}
				<br />
				{'Hvis problemet fortsætter, kontakt venligst personalet.'}
			</>
		)
	}

	const showSubmitButton = orderStatus !== 'loading'

	return (
		<CloseableModal onClose={onClose} canClose={canClose}>
			<h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
				{headingTexts[orderStatus]}
			</h2>

			{paragraphContent[orderStatus] !== undefined && (
				<p className="mb-4 flex justify-center text-center text-gray-800">
					{paragraphContent[orderStatus]}
				</p>
			)}

			<div className="flex justify-center">
				<div className="w-48 h-48 relative">
					<Image
						src={imageProps.src}
						alt={imageProps.alt}
						width={200}
						height={200}
					/>
				</div>
			</div>

			<div className="flex justify-center">
				{showSubmitButton && (
					<SubmitButton
						text="Ny Bestilling"
						onClick={onClose}
						disabled={!canClose}
					/>
				)}
			</div>
		</CloseableModal>
	)
}

export default OrderConfirmationWindow
