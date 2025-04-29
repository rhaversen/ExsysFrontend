'use client'

// External imports
import axios from 'axios'
import React, { useState } from 'react'
import { FaSyncAlt } from 'react-icons/fa'

// Internal imports
import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

export default function KioskRefresh (): React.ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [showRefreshModal, setShowRefreshModal] = useState(false)

	const handleForceRefresh = async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/service/force-kiosk-refresh`, { withCredentials: true })
			setShowRefreshModal(false)
		} catch (error) {
			addError(error)
		}
	}

	return (
		<>
			<div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg">
				{/* Header Section */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
					<div className="flex items-center gap-3 flex-grow">
						<FaSyncAlt className="text-blue-500 text-2xl flex-shrink-0" />
						<h2 className="text-lg text-gray-800">{'Genindlæs kiosker'}</h2>
					</div>
					<button
						type="button"
						onClick={() => { setShowRefreshModal(true) }}
						className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md mt-0"
					>
						{'Genindlæs\r'}
					</button>
				</div>

				{/* Description Section */}
				<div className="text-sm text-gray-600">{'Tvinger alle kiosker til at genindlæse deres interface'}</div>
			</div>

			{showRefreshModal && (
				<CloseableModal
					canClose
					canComplete
					onClose={() => { setShowRefreshModal(false) }}
					onComplete={() => { void handleForceRefresh() }}
				>
					<div className="text-center flex flex-col gap-4">
						<FaSyncAlt className="text-blue-500 text-4xl mx-auto" />
						<h2 className="text-2xl font-bold text-gray-800">{'Genindlæs alle kiosker?'}</h2>
						<div className="text-left">
							<p className="text-gray-700 text-lg font-medium">{'Dette vil tvinge alle kiosker til at genindlæse deres interface.'}</p>
							<p className="text-gray-600">{'Genindlæsningen sker øjeblikkeligt og kan ikke fortrydes.'}</p>
							<p className="text-gray-600">{'Igangværende bestillinger vil blive nulstillet, men færdige bestillinger vil ikke blive påvirket.'}</p>
							<p className="text-gray-600">{'Brug kun denne funktion hvis det er nødvendigt, eller uden for åbningstiderne.'}</p>
						</div>
						<div className="flex gap-4 justify-center pt-2">
							<button
								type="button"
								onClick={() => { setShowRefreshModal(false) }}
								className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800"
							>
								{'Annuller\r'}
							</button>
							<button
								type="button"
								onClick={() => { void handleForceRefresh() }}
								className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
							>
								{'Genindlæs\r'}
							</button>
						</div>
					</div>
				</CloseableModal>
			)}
		</>
	)
}
