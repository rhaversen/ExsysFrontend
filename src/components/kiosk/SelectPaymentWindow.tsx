import { type ReactElement } from 'react'

import AsyncImage from '@/components/ui/AsyncImage'
import CloseableModal from '@/components/ui/CloseableModal'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { KioskImages } from '@/lib/images'

const SelectPaymentWindow = ({
	checkoutMethods,
	sumUpDisabled,
	onSubmit,
	onCancel
}: {
	checkoutMethods: { sumUp: boolean, later: boolean, mobilePay: boolean }
	sumUpDisabled: boolean
	onSubmit: (type: 'sumUp' | 'later' | 'mobilePay') => void
	onCancel: () => void
}): ReactElement => {
	const { track } = useAnalytics()

	const handleSubmit = (type: 'sumUp' | 'later' | 'mobilePay'): void => {
		if (type === 'sumUp') {
			track('payment_select_card')
		} else if (type === 'mobilePay') {
			track('payment_select_mobilepay')
		} else {
			track('payment_select_later')
		}
		onSubmit(type)
	}

	const handleCancel = (): void => {
		track('checkout_cancel')
		onCancel()
	}

	return (
		<CloseableModal canClose={true} onClose={handleCancel}>
			<h2 className="text-4xl pt-5 text-black font-semibold text-center mb-4">
				{'Tryk for at vælge betaling'}
			</h2>
			<div className="p-5 flex gap-4 justify-center">
				{checkoutMethods.later && (
					<button
						onClick={() => { handleSubmit('later') }}
						className="py-2 px-6 focus:outline-none rounded-xl border-dotted border-2 border-blue-500"
						type="button"
					>
						<div className="text-2xl font-bold text-center text-gray-800">
							{'Betal Senere'}
						</div>
						<AsyncImage
							src={KioskImages.payLater.src}
							alt={KioskImages.payLater.alt}
							className="w-48 h-48"
							width={200}
							height={200}
							quality={100}
							priority={true}
							draggable={false}
						/>
					</button>
				)}
				{checkoutMethods.sumUp && (
					<div className="flex flex-col items-center">
						<button
							onClick={() => handleSubmit('sumUp')}
							className={`py-2 px-6 focus:outline-none rounded-xl border-dotted border-2 border-blue-500 ${sumUpDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
							type="button"
							disabled={sumUpDisabled}
						>
							<div className="text-2xl font-bold text-center text-gray-800">
								{'Kort Betaling'}
							</div>
							<AsyncImage
								src={KioskImages.creditCard.src}
								alt={KioskImages.creditCard.alt}
								className="w-48 h-48"
								width={200}
								height={200}
								quality={100}
								priority
								draggable={false}
							/>
						</button>
						{sumUpDisabled && (
							<div className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded border border-red-200 text-center text-sm max-w-48 break-words">
								{'Beløb under 10 kr kan ikke betales med kort'}
							</div>
						)}
					</div>
				)}
				{checkoutMethods.mobilePay && (
					<button
						onClick={() => { handleSubmit('mobilePay') }}
						className="py-2 px-6 focus:outline-none rounded-xl border-dotted border-2 border-blue-500"
						type="button"
					>
						<div className="text-2xl font-bold text-center text-gray-800">
							{'MobilePay'}
						</div>
						<AsyncImage
							src={KioskImages.mobilePay.src}
							alt="MobilePay"
							className="w-48 h-48"
							width={200}
							height={200}
							quality={100}
							priority={true}
							draggable={false}
						/>
					</button>
				)}
			</div>
			<div className="flex p-5 justify-center items-center h-full">
				<button
					onClick={() => { handleCancel() }}
					className="bg-blue-500 w-full text-white rounded-md py-2 px-4 mt-12"
					type="button"
				>
					{'Tilbage'}
				</button>
			</div>
		</CloseableModal>
	)
}

export default SelectPaymentWindow
