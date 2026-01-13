import { type ReactElement } from 'react'
import QRCode from 'react-qr-code'

const KioskFeedbackInfo = ({ onBack }: { onBack: () => void }): ReactElement => {
	const feedbackUrl = 'kantine.nyskivehus.dk/risros'

	return (
		<div className="fixed inset-0 flex flex-col items-center justify-center">
			<button
				type="button"
				onClick={onBack}
				className="absolute top-4 left-4 z-10 flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
			>
				<span className="text-xl">{'←'}</span>
				<span>{'Tilbage'}</span>
			</button>

			<div className="flex flex-col items-center justify-center text-center">
				<h1 className="text-5xl font-bold mb-4 text-gray-800">{'Ris og Ros'}</h1>
				<p className="text-2xl mb-8 text-gray-600">{'Scan QR-koden for at give din feedback'}</p>

				<div className="p-8 bg-white rounded-2xl shadow-xl">
					<QRCode
						value={`https://${feedbackUrl}`}
						size={300}
						bgColor="#ffffff"
						fgColor="#000000"
						level="H"
					/>
				</div>

				<p className="mt-6 text-lg text-gray-500 font-mono">{feedbackUrl}</p>
			</div>
		</div>
	)
}

export default KioskFeedbackInfo