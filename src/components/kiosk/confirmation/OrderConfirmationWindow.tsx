import Image from 'next/image'
import { type ReactElement, useEffect, useState } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'
import SubmitButton from '@/components/ui/SubmitButton'
import { useConfig } from '@/contexts/ConfigProvider'
import { KioskImages, LoadingImage } from '@/lib/images'
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

	const autoCloseMs = config?.configs.kioskOrderConfirmationTimeoutMs ?? 1000 * 10

	const [remainingSeconds, setRemainingSeconds] = useState(autoCloseMs / 1000)
	const canClose = ['success', 'error', 'paymentFailed'].includes(orderStatus)

	useEffect(() => {
		setRemainingSeconds(autoCloseMs / 1000)
		const timer = setInterval(() => {
			setRemainingSeconds((prev) => {
				return prev - 1
			})
		}, 1000)

		return () => { clearInterval(timer) }
	}, [autoCloseMs, canClose, orderStatus])

	useEffect(() => {
		if (!canClose || orderStatus === 'awaitingPayment') { return }
		const timeoutId = setTimeout(() => {
			onClose()
		}, autoCloseMs + 1000)
		return () => { clearTimeout(timeoutId) }
	}, [autoCloseMs, canClose, orderStatus, onClose])

	const headingTexts: Record<string, string> = {
		awaitingPayment: 'Betal på skærmen',
		success: 'Tak For Din Bestilling',
		error: 'Der Skete En Fejl',
		loading: 'Sender Bestilling...',
		paymentFailed: 'Betaling Ikke Gennemført'
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
		awaitingPayment: <p>{'Afventer betaling på terminalen til højre'}</p>,
		success: successMessage,
		paymentFailed: <p>{'Betalingen blev ikke gennemført. Prøv igen eller kontakt personalet.'}</p>,
		error: <p>{'Bestillingen kunne ikke gennemføres. Kontakt venligst personalet.'}</p>
	}

	const showSubmitButton = orderStatus !== 'loading' && orderStatus !== 'awaitingPayment'

	return (
		<CloseableModal onClose={onClose} canClose={canClose}>
			<h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
				{headingTexts[orderStatus]}
			</h2>

			{paragraphContent[orderStatus] !== undefined && (
				<div className="mb-4 flex justify-center text-center text-gray-800">
					{paragraphContent[orderStatus]}
				</div>
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
				{orderStatus === 'awaitingPayment' && (
					<SubmitButton
						text={isCancelling ? 'Annullerer…' : 'Annuller'}
						onClick={onCancelPayment}
						disabled={isCancelling}
					/>
				)}
				{showSubmitButton && (
					<SubmitButton
						text="OK"
						onClick={onClose}
						disabled={!canClose}
					/>
				)}
			</div>
			{orderStatus !== 'awaitingPayment' && orderStatus !== 'loading' && (
				<div className="text-center text-sm text-gray-800 mt-4">
					{'Fortsætter om '}
					<strong>{remainingSeconds}</strong>
					{' sekund'}{remainingSeconds == 1 ? '' : 'er'}
				</div>
			)}
		</CloseableModal>
	)
}

export default OrderConfirmationWindow
