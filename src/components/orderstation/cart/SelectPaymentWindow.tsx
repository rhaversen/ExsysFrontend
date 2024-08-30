import React, { type ReactElement } from 'react'
import AsyncImage from '@/components/ui/AsyncImage'

const SelectPaymentWindow = ({
	onSubmit
}: {
	onSubmit: (type: 'Card' | 'Cash') => void
}): ReactElement => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
			<div className="bg-white rounded-xl shadow-lg p-8 m-4 text-gray-800">
				<h2 className="text-lg font-semibold text-center mb-4">Vælg Betalingsmetode</h2>
				<div className="space-x-4 flex justify-center">
					<button
						onClick={() => { onSubmit('Card') }}
						className="py-2 px-6 focus:outline-none rounded-xl border-dotted border-2 border-blue-500"
						type='button'
					>
						<div className='text-2xl font-bold text-center text-gray-800'>
							{'Kort'}
						</div>
						<AsyncImage
							src="/orderStation/creditcard.svg"
							alt="Kort"
							className="w-48 h-48"
							width={200}
							height={200}
							quality={100}
							priority={true}
							draggable={false}
						/>
					</button>
					<button
						onClick={() => { onSubmit('Cash') }}
						className="py-2 px-6 focus:outline-none rounded-xl border-dotted border-2 border-blue-500"
						type='button'
					>
						<div className='text-2xl font-bold text-center text-gray-800'>
							{'Kontant'}
						</div>
						<AsyncImage
							src="/orderStation/coins.svg"
							alt="Kontant"
							className="w-48 h-48"
							width={200}
							height={200}
							quality={100}
							priority={true}
							draggable={false}
						/>
					</button>
				</div>
			</div>
		</div>
	)
}

export default SelectPaymentWindow
