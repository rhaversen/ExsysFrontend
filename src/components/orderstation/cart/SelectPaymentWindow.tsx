import React, { type ReactElement } from 'react'

const SelectPaymentWindow = ({
	onSubmit
}: {
	onSubmit: (type: 'Card' | 'Cash') => void
}): ReactElement => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
			<div className="bg-white rounded-xl shadow-lg p-8 m-4 max-w-sm max-h-full text-gray-800 overflow-auto">
				<h2 className="text-lg font-semibold text-center mb-4">Vælg Betalingsmetode</h2>
				<div className="space-x-4 flex justify-center">
					<button
						onClick={() => { onSubmit('Card') }}
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
					>
						Kortbetaling
					</button>
					<button
						onClick={() => { onSubmit('Cash') }}
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
					>
						Kontantbetaling
					</button>
				</div>
			</div>
		</div>
	)
}

export default SelectPaymentWindow
