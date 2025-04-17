import axios from 'axios'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { FaStore, FaChevronDown, FaChevronUp } from 'react-icons/fa'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { getNextAvailableProductTimeLocal } from '@/lib/timeUtils'
import type { KioskType, ProductType } from '@/types/backendDataTypes'

import CloseModeSelector from './ui/CloseModeSelector'

import 'dayjs/locale/da'

const AllKiosksStatusManager = ({
	kiosks,
	products
}: {
	kiosks: KioskType[]
	products: ProductType[]
}): React.ReactElement => {
	dayjs.locale('da')
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [allKiosksMode, setAllKiosksMode] = useState<'manual' | 'until' | 'nextProduct' | 'open'>('manual')
	const [allKiosksUntil, setAllKiosksUntil] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const { addError } = useError()
	const [showOptions, setShowOptions] = useState(false)

	// Check if there is any available products
	const hasAvailableProducts = products.some(p => p.isActive)

	const handleAllKiosksAction = async (): Promise<void> => {
		try {
			if (API_URL == null) return
			setIsProcessing(true)
			if (allKiosksMode === 'manual') {
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: true, closedUntil: null },
							{ withCredentials: true }
						)
					)
				)
			} else if (allKiosksMode === 'until') {
				if (allKiosksUntil == null) return
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: false, closedUntil: allKiosksUntil },
							{ withCredentials: true }
						)
					)
				)
			} else if (allKiosksMode === 'nextProduct') {
				const until = getNextAvailableProductTimeLocal(products)?.date.toISOString()
				if (until == null) return
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: false, closedUntil: until },
							{ withCredentials: true }
						)
					)
				)
			} else if (allKiosksMode === 'open') {
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: false, closedUntil: null },
							{ withCredentials: true }
						)
					)
				)
			}
			setAllKiosksUntil(null)
		} catch (error) {
			addError(error)
		} finally {
			setIsProcessing(false)
		}
	}

	const now = new Date()
	const isUntilInPast = allKiosksMode === 'until' && allKiosksUntil != null && new Date(allKiosksUntil) <= now

	return (
		<div className="relative flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex items-center flex-grow gap-4">
					<FaStore className="text-blue-500 text-2xl flex-shrink-0" />
					<div className="flex flex-col">
						<span className="text-lg text-gray-800">{'Administrer alle kioskers status'}</span>
						<div className="text-sm text-gray-600">{'Luk eller åbn alle kiosker for bestillinger på én gang.'}</div>
					</div>
				</div>
				<button
					type="button"
					onClick={() => { setShowOptions(prev => !prev) }}
					className="w-[120px] h-[40px] shadow-md flex items-center justify-center gap-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition mt-4 sm:mt-0"
				>
					{showOptions ? (<><span>{'Skjul'}</span> <FaChevronUp /></>) : (<><span>{'Udvid'}</span> <FaChevronDown /></>)}
				</button>
			</div>

			{showOptions && (
				<>
					<CloseModeSelector
						mode={allKiosksMode}
						setMode={setAllKiosksMode}
						until={allKiosksUntil}
						setUntil={setAllKiosksUntil}
						products={products}
						showOpenOption={true}
					/>
					<div className="flex gap-4 justify-end pt-2">
						<button
							type="button"
							disabled={isProcessing || (allKiosksMode === 'until' && (allKiosksUntil == null)) || (allKiosksMode === 'until' && isUntilInPast) || (allKiosksMode === 'nextProduct' && !hasAvailableProducts)}
							onClick={() => { void handleAllKiosksAction() }}
							className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition disabled:opacity-50"
						>
							{allKiosksMode === 'open' ? 'Åbn alle' : 'Luk alle'}
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export default AllKiosksStatusManager
