import axios from 'axios'
import React, { useState } from 'react'
import { FaStore, FaChevronDown, FaChevronUp } from 'react-icons/fa'

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

	return (
		<div className="relative flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex items-center flex-grow gap-4">
					<FaStore className="text-blue-500 text-2xl flex-shrink-0" />
					<div className="flex flex-col">
						<div className="text-lg text-gray-800">{'Administrer alle kioskers status på en gang'}</div>
						<div className="text-sm text-gray-600">
							<div>{'Deaktiver eller aktiver alle kiosker for bestillinger.'}</div>
							<div>{'Kiosker kan aktiveres og deaktiveres for bestillinger når nødvendigt.'}</div>
							<div>{'Kioskerne forbliver funktionelle og logget ind, så de nemt kan aktiveres igen.'}</div>
							<div>{'Kioskerne kan også aktiveres og deaktiveres individuelt i kiosk status og håndtering.'}</div>
						</div>
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
				</>
			)}
		</div>
	)
}

export default AllKiosksStatusManager
