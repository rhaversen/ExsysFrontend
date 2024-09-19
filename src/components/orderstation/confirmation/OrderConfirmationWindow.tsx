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
	return (
		<CloseableModal
			onClose={onClose}
			canClose={['success', 'error', 'failed'].includes(orderStatus)}
		>
			<h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
				{orderStatus === 'awaitingPayment' && 'Betal på skærmen'}
				{orderStatus === 'success' && 'Tak For Din Bestilling'}
				{orderStatus === 'error' && 'Der Skete En Fejl'}
				{orderStatus === 'loading' && 'Sender Bestilling...'}
				{orderStatus === 'failed' && 'Betalingen Mislykkedes'}
			</h2>
			<p className="mb-4 flex justify-center text-gray-800">
				{orderStatus === 'success' && `Husk at lægge ${price} kr i skålen`}
			</p>
			<p className="mb-4 flex justify-center text-center text-gray-800">
				{orderStatus === 'error' && (
					<>
						{'Der skete en ukendt fejl, prøv igen senere.'}
						<br />
						{'Hvis problemet fortsætter, kontakt venligst personalet.'}
					</>
				)}
			</p>
			<div className="flex justify-center">
				<div className="w-48 h-48 relative">
					{orderStatus === 'loading' &&
						<Image
							src="/orderStation/loading.svg"
							alt="Loading"
							width={200}
							height={200}
						/>
					}
					{orderStatus === 'success' &&
						<Image
							src="/orderStation/checkmark.svg"
							alt="Order Confirmed"
							width={200}
							height={200}
						/>
					}
					{orderStatus === 'error' &&
						<Image
							src="/orderStation/question-mark.svg"
							alt="Error"
							width={200}
							height={200}
						/>
					}
					{orderStatus === 'awaitingPayment' &&
						<Image
							src="/orderStation/arrow.svg"
							alt="Awaiting Payment"
							width={200}
							height={200}
						/>
					}
					{orderStatus === 'failed' &&
						<Image
							src="/orderStation/cross.svg"
							alt="Payment Failed"
							width={200}
							height={200}
						/>
					}
				</div>
			</div>
			<div className="flex justify-center">
				{orderStatus !== 'loading' &&
					<SubmitButton
						text="Ny Bestilling"
						onClick={onClose}
						disabled={orderStatus !== 'success' && orderStatus !== 'error'}
					/>
				}
			</div>
		</CloseableModal>
	)
}

export default OrderConfirmationWindow
