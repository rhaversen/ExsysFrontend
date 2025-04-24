import { type ReactElement } from 'react'

import AsyncImage from '@/components/ui/AsyncImage'
import CloseableModal from '@/components/ui/CloseableModal'
import { KioskImages } from '@/lib/images'

const SelectPaymentWindow = ({
	checkoutMethods,
	onSubmit,
	onCancel
}: {
	checkoutMethods: { sumUp: boolean, later: boolean, mobilePay: boolean }
	onSubmit: (type: 'sumUp' | 'later' | 'mobilePay') => void
	onCancel: () => void
}): ReactElement => {
	return (
		<CloseableModal canClose={true} onClose={onCancel}>
			<h2 className="text-4xl text-black font-semibold text-center mb-4">
				{'Vælg Betaling'}
			</h2>
			<div className="space-x-4 flex justify-center">
				{checkoutMethods.sumUp && (
					<button
						onClick={() => { onSubmit('sumUp') }}
						className="py-2 px-6 focus:outline-none rounded-xl border-dotted border-2 border-blue-500"
						type="button"
					>
						<div className="text-2xl font-bold text-center text-gray-800">
							{'Kort'}
						</div>
						<AsyncImage
							src={KioskImages.creditCard.src}
							alt={KioskImages.creditCard.alt}
							className="w-48 h-48"
							width={200}
							height={200}
							quality={100}
							priority={true}
							draggable={false}
						/>
					</button>
				)}
				{checkoutMethods.later && (
					<button
						onClick={() => { onSubmit('later') }}
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
				{checkoutMethods.mobilePay && (
					<button
						onClick={() => { onSubmit('mobilePay') }}
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
			<div className="flex justify-center items-center h-full">
				<button
					onClick={() => { onCancel() }}
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
