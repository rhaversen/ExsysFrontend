import SubmitButton from '@/components/ui/SubmitButton'
import Image from 'next/image'
import React, { type ReactElement } from 'react'

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
					className="absolute inset-0 w-full h-full text-gray-800"
					onClick={onClose}
				>
					<span className="sr-only">
						{'Close'}
					</span>
				</button>
			}
			<div
				className="bg-white rounded-3xl p-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800"
			>
				<h2 className="text-2xl font-bold mb-4 text-center">
					{orderStatus === 'success' && 'Tak For Din Bestilling'}
					{orderStatus === 'error' && 'Der Skete En Fejl'}
					{orderStatus === 'loading' && 'Sender Bestilling...'}
				</h2>
				<p className="mb-4 flex justify-center">
					{orderStatus === 'success' && `Husk at overføre ${price} kr til (BOX)`}
				</p>
				<p className="mb-4 flex justify-center text-center">
					{orderStatus === 'error' && (
						<>
							{'Der skete en fejl, prøv igen senere.'}
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
								src="/orderStation/questionmark.svg"
								alt="Error"
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
							disabled={false}
						/>
					}
				</div>
			</div>
		</div>
	)
}

export default OrderConfirmationWindow
