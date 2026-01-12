import { type ReactElement } from 'react'
import QRCode from 'react-qr-code'

import FeedbackForm from '@/components/shared/FeedbackForm'

const KioskFeedbackInfo = (): ReactElement => {
	const feedbackUrl = 'kantine.nyskivehus.dk/risros'
	const domain = feedbackUrl.substring(0, feedbackUrl.indexOf('/'))
	const path = feedbackUrl.substring(feedbackUrl.indexOf('/'))

	return (
		<div className="flex flex-col items-center justify-center text-center">
			<h1 className="text-4xl font-bold mb-8 text-gray-800">{'Ris og Ros'}</h1>
			<p className="text-xl mb-6 text-gray-600">{'Har du ris eller ros? Vi vil gerne høre fra dig!'}</p>
			<p className="text-lg mb-10 text-gray-600">{'Scan QR-koden, besøg hjemmesiden, eller skriv direkte her.'}</p>

			<div className="flex flex-row flex-wrap justify-around gap-4 w-full">
				{/* Scan QR Code */}
				<div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-xl w-80">
					<h2 className="text-2xl font-semibold mb-6 text-gray-700">{'Scan QR-koden'}</h2>
					<div className="p-4 border-2 border-dashed w-full h-[260px] border-gray-400 rounded-lg bg-white flex items-center justify-center">
						<QRCode
							value={`https://${feedbackUrl}`}
							size={220}
							bgColor="#ffffff"
							fgColor="#000000"
							level="H"
						/>
					</div>
				</div>

				{/* Visit URL */}
				<div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-xl w-80">
					<h2 className="text-2xl font-semibold mb-6 text-gray-700">{'Besøg Hjemmesiden'}</h2>
					{/* Square box for the link, matching QR code box dimensions */}
					<div className="flex flex-col items-center justify-center w-full h-[260px] p-4 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50">
						<p className="text-lg font-mono text-blue-700 text-center">{domain}</p>
						<p className="text-lg font-mono text-blue-700 text-center">{path}</p>
					</div>
				</div>

				{/* Instant Feedback Form */}
				<div className="flex flex-col items-center justify-start p-6 bg-white rounded-xl shadow-xl w-80">
					<h2 className="text-2xl font-semibold mb-6 text-gray-700">{'Skriv her'}</h2>
					<FeedbackForm />
				</div>
			</div>
		</div>
	)
}

export default KioskFeedbackInfo