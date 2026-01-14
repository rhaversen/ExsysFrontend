import axios from 'axios'
import React, { useState, useRef, useEffect } from 'react'
import { FaChevronDown } from 'react-icons/fa'
import { FiRefreshCw, FiSettings } from 'react-icons/fi'

import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { getNextAvailableProductOrderWindowFrom } from '@/lib/timeUtils'
import type { KioskType, ProductType } from '@/types/backendDataTypes'

import CloseModeSelector from './ui/CloseModeSelector'

const AllKiosksStatusManager = ({
	kiosks,
	products
}: {
	kiosks: KioskType[]
	products: ProductType[]
}): React.ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [isProcessing, setIsProcessing] = useState(false)
	const { addError } = useError()
	const [showOptions, setShowOptions] = useState(false)
	const [showRefreshModal, setShowRefreshModal] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowOptions(false)
			}
		}
		if (showOptions) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => { document.removeEventListener('mousedown', handleClickOutside) }
	}, [showOptions])

	const handleAllKiosksAction = async (mode: 'manual' | 'until' | 'nextProduct' | 'open', until: string | null): Promise<void> => {
		try {
			if (API_URL == null) { return }
			setIsProcessing(true)
			if (mode === 'manual') {
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ deactivated: true, deactivatedUntil: null },
							{ withCredentials: true }
						)
					)
				)
			} else if (mode === 'until') {
				if (until == null) { return }
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ deactivated: false, deactivatedUntil: until },
							{ withCredentials: true }
						)
					)
				)
			} else if (mode === 'nextProduct') {
				const nextUntil = getNextAvailableProductOrderWindowFrom(products)?.date.toISOString()
				if (nextUntil == null) { return }
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ deactivated: false, deactivatedUntil: nextUntil },
							{ withCredentials: true }
						)
					)
				)
			} else if (mode === 'open') {
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ deactivated: false, deactivatedUntil: null },
							{ withCredentials: true }
						)
					)
				)
			}
			// collapse options after action
			setShowOptions(false)
		} catch (error) {
			addError(error)
		} finally {
			setIsProcessing(false)
		}
	}

	const handleForceRefresh = async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/service/force-kiosk-refresh`, { withCredentials: true })
			setShowRefreshModal(false)
			setShowOptions(false)
		} catch (error) {
			addError(error)
		}
	}

	return (
		<>
			<div className="relative" ref={dropdownRef}>
				<button
					type="button"
					onClick={() => { setShowOptions(prev => !prev) }}
					className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
					title="Handlinger for alle kiosker"
				>
					<FiSettings className="w-4 h-4" />
					<span className="hidden sm:inline">{'Alle kiosker'}</span>
					<FaChevronDown className={`w-3 h-3 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
				</button>

				{showOptions && (
					<div className="absolute right-0 top-full mt-2 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[340px]">
						{/* Refresh section */}
						<div className="flex flex-col gap-3 text-gray-700 mb-4 pb-4 border-b border-gray-200">
							<label className="flex flex-col gap-0.5">
								<span className="flex items-center gap-2">
									<FiRefreshCw className="w-4 h-4" />
									<span className="font-medium">{'Genindlæs alle kioskskærme'}</span>
								</span>
								<span className="text-xs text-left text-gray-500 pl-6">{'Tvinger alle kiosker til at genindlæse deres interface. Igangværende bestillinger nulstilles.'}</span>
							</label>
							<div className="flex gap-2 justify-end">
								<button
									type="button"
									onClick={() => { setShowRefreshModal(true); setShowOptions(false) }}
									className="px-4 py-1.5 text-sm text-white rounded-md transition bg-blue-500 hover:bg-blue-600"
								>
									{'Genindlæs alle'}
								</button>
							</div>
						</div>

						{/* Activate/deactivate section */}
						<CloseModeSelector<'manual' | 'until' | 'nextProduct' | 'open'>
							products={products}
							showOpenOption={true}
							initialMode="manual"
							isPatching={isProcessing}
							onConfirm={(mode, until) => { void handleAllKiosksAction(mode, until) }}
							onCancel={() => setShowOptions(false)}
							confirmLabelMap={{ open: 'Aktiver alle', manual: 'Deaktiver alle', until: 'Deaktiver alle', nextProduct: 'Deaktiver alle' }}
							cancelText="Annuller"
						/>
					</div>
				)}
			</div>

			{showRefreshModal && (
				<CloseableModal
					canClose
					canComplete
					onClose={() => setShowRefreshModal(false)}
					onComplete={() => { void handleForceRefresh() }}
				>
					<div className="text-center flex flex-col gap-4">
						<FiRefreshCw className="text-blue-500 text-4xl mx-auto" />
						<h2 className="text-2xl font-bold text-gray-800">{'Genindlæs alle kioskskærme?'}</h2>
						<div className="text-left space-y-2">
							<p className="text-gray-700 text-lg font-medium">{'Dette vil tvinge alle kioskskærme til at genindlæse deres interface.'}</p>
							<p className="text-gray-600">{'Genindlæsningen sker øjeblikkeligt og kan ikke fortrydes.'}</p>
							<p className="text-gray-600">{'Igangværende bestillinger vil blive nulstillet, men færdige bestillinger vil ikke blive påvirket.'}</p>
							<p className="text-gray-600">{'Brug kun denne funktion hvis det er nødvendigt, eller uden for åbningstiderne.'}</p>
						</div>
						<div className="flex gap-4 justify-center pt-2">
							<button
								type="button"
								onClick={() => setShowRefreshModal(false)}
								className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-700"
							>
								{'Annuller'}
							</button>
							<button
								type="button"
								onClick={() => { void handleForceRefresh() }}
								className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
							>
								{'Genindlæs'}
							</button>
						</div>
					</div>
				</CloseableModal>
			)}
		</>
	)
}

export default AllKiosksStatusManager
