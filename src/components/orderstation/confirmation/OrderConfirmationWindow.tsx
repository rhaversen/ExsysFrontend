import CloseableModal from '@/components/ui/CloseableModal'
import SubmitButton from '@/components/ui/SubmitButton'
import Image from 'next/image'
import React, { type ReactElement } from 'react'

const OrderConfirmationWindow = ({
	price,
	orderStatus,
	onClose
}: {
	price: number
	orderStatus: 'success' | 'error' | 'loading' | 'awaitingPayment' | 'failed'
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
		loading: {
			src: '/orderStation/loading.svg',
			alt: 'Loading'
		},
		success: {
			src: '/orderStation/checkmark.svg',
			alt: 'Order Confirmed'
		},
		error: {
			src: '/orderStation/question-mark.svg',
			alt: 'Error'
		},
		awaitingPayment: {
			src: '/orderStation/arrow.svg',
			alt: 'Awaiting Payment'
		},
		failed: {
			src: '/orderStation/cross.svg',
			alt: 'Payment Failed'
		}
	}

	const imageProps = images[orderStatus]

	const paragraphContent: Record<string, React.ReactNode> = {
		success: `Husk at lægge ${price} kr i skålen`,
		error: (
			<>
				{'Der skete en ukendt fejl, prøv igen senere.'}
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
