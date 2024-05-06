import React, { type ReactElement } from 'react'
import Image from 'next/image'
import SubmitButton from '@/components/ui/SubmitButton'

const OrderConfirmationWindow = ({
	price,
	orderStatus,
	onClose
}: {
	price: number
	orderStatus: 'success' | 'error' | 'loading'
	onClose: () => void
}): ReactElement => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			{orderStatus !== 'loading' &&
				<button
					type="button"
					className="absolute inset-0 w-full h-full text-black"
					onClick={onClose}
				>
					<span className="sr-only">
						{'Close'}
					</span>
				</button>
			}
			<div
				className="bg-white rounded-3xl p-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black"
			>
				<h2 className="text-2xl font-bold mb-4 text-center">
					{orderStatus === 'success' && 'Tak For Din Bestilling'}
					{orderStatus === 'error' && 'Der Skete En Fejl'}
					{orderStatus === 'loading' && 'Sender Bestilling...'}
				</h2>
				<p className="mb-4 flex justify-center">
					{orderStatus === 'success' && `Husk at overføre ${price} kr til (BOX)`}
				</p>
				<div className="flex justify-center">
					<SubmitButton
						text="Ny Bestilling"
						onClick={onClose}
						disabled={orderStatus === 'loading'}
					/>
				</div>
				<div className="flex justify-center">
					<Image
						src="/order-confirmed.png"
						alt="Order Confirmed"
						width={200}
						height={200}
					/>
				</div>
			</div>
		</div>
	)
}

export default OrderConfirmationWindow
