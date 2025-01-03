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
		failed: 'Betaling Ikke Gennemført'
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
	let successMessage: ReactElement = <></>
	if (checkoutMethod === 'later') {
		successMessage = <div className="flex items-center justify-center">
			{'Betal'}
			<span className="font-bold text-xl mx-1 flex items-center">{price}{' kr'}</span>
			{'ved afhentning'}
		</div>
	} else {
		successMessage = <>{'Betaling gennemført'}</>
	}

	const paragraphContent: Record<OrderStatus, ReactElement> = {
		loading: <>{'Vent venligst'}</>,
		awaitingPayment: <>{'Afventer betaling'}</>,
		success: successMessage,
		paymentFailed: <>{'Betalingen blev ikke gennemført. Prøv igen eller kontakt personalet.'}</>,
		error: (
			<>{'Bestillingen kunne ikke gennemføres. Kontakt venligst personalet.'}</>
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
						text="OK"
						onClick={onClose}
						disabled={!canClose}
					/>
				)}
			</div>
		</CloseableModal>
	)
}

export default OrderConfirmationWindow
