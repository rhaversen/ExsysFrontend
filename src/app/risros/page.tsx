'use client'

import { ReactElement } from 'react'

import FeedbackForm from '@/components/shared/FeedbackForm'

export default function Page (): ReactElement {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
				<h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{'Ris og Ros'}</h1>
				<p className="text-center text-gray-600 mb-6">{'Skriv din ris og ros i felterne nedenfor. Indtast venligst dit navn eller email, hvis vi må kontakte dig.'}</p>

				<FeedbackForm/>
			</div>
		</div>
	)
}
