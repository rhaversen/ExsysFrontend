import Image from 'next/image'
import { type ReactElement } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'
import TimeoutImage from '@/components/ui/TimeoutImage'
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

	const canClose = ['success', 'error', 'paymentFailed'].includes(orderStatus)
	const showTimeoutImage = canClose && orderStatus !== 'awaitingPayment'

	const headingTexts: Record<string, string> = {
		awaitingPayment: 'Betal på skærmen',
		success: 'Tak For Din Bestilling',
		error: 'Noget Gik Galt',
		loading: 'Sender Bestilling...',
		paymentFailed: 'Betaling Mislykkedes'
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
		<CloseableModal onClose={onClose} canClose={canClose}>
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
							onClick={onClose}
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
						/>
					)}
				</div>
			</div>

			{orderStatus === 'awaitingPayment' && (
				<div className="flex p-5 justify-center items-center h-full">
					<button
						onClick={onCancelPayment}
						className="bg-gray-200 hover:bg-gray-300 w-full text-gray-700 rounded-md py-3 px-4 mt-8 transition-colors"
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
