import axios from 'axios'
import dayjs from 'dayjs'
import React, { useState, useEffect } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'
import KioskCircle from '@/components/ui/KioskCircle'
import { getNextAvailableProductTimeLocal, isKioskClosed } from '@/lib/timeUtils'
import type { KioskType, ProductType } from '@/types/backendDataTypes'

import CloseModeSelector from './ui/CloseModeSelector'

import 'dayjs/locale/da'

// Modal content for kiosk status
function KioskStatusModalContent ({
	kiosk,
	products,
	isPatching,
	onPatch,
	onClose
}: {
	kiosk: KioskType
	products: ProductType[]
	isPatching: boolean
	onPatch: (patch: Partial<KioskType>) => void
	onClose: () => void
}): React.ReactElement {
	dayjs.locale('da')
	// Treat closedUntil in the past as not set
	const now = new Date()
	const closedUntilValid = (kiosk.closedUntil != null) && new Date(kiosk.closedUntil) > now ? kiosk.closedUntil : null
	const [mode, setMode] = useState<'manual' | 'until' | 'nextProduct'>(
		!kiosk.manualClosed && (closedUntilValid != null) ? 'until' : 'manual'
	)
	const [until, setUntil] = useState<string | null>(closedUntilValid)

	const isClosed = isKioskClosed(kiosk)

	// Check if there is any available products
	const hasAvailableProducts = products.some(p => p.isActive)

	// Get circle content (kiosk tag or first letter of name)
	const circleContent = (kiosk.kioskTag.length > 0) && kiosk.kioskTag.trim() !== ''
		? kiosk.kioskTag
		: kiosk.name.charAt(0).toUpperCase()

	const handlePatch = (): void => {
		if (mode === 'manual') onPatch({ manualClosed: true, closedUntil: null })
		else if (mode === 'until') onPatch({ manualClosed: false, closedUntil: until })
		else onPatch({ manualClosed: false, closedUntil: getNextAvailableProductTimeLocal(products)?.date.toISOString() ?? null })
	}

	const handleOpenKiosk = (): void => { onPatch({ manualClosed: false, closedUntil: null }) }

	const isUntilInPast = mode === 'until' && until != null && new Date(until) <= now

	return (
		<CloseableModal canClose onClose={onClose}>
			<div className="text-center flex flex-col gap-4">
				<KioskCircle
					isClosed={isClosed}
					content={circleContent}
					size="md"
					className="mx-auto mb-2"
				/>
				<h2 className="text-2xl font-bold text-gray-800">{kiosk.name}</h2>
				{isClosed
					? (
						<>
							{(kiosk.manualClosed) && <p className="text-red-700 font-semibold mt-2">{'Kiosken er lukket manuelt.'}</p>}
							{((kiosk.closedUntil != null) && !kiosk.manualClosed) && <p className="text-red-700 font-semibold mt-2">{'Kiosken er lukket indtil: '}{dayjs(kiosk.closedUntil).format('dddd [d.] DD/MM YYYY [kl.] HH:mm')}</p>}
							<div className="flex gap-4 justify-center pt-2">
								<button type="button" disabled={isPatching} onClick={onClose} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800">{'Annuller'}</button>
								<button type="button" disabled={isPatching} onClick={handleOpenKiosk} className={`px-5 py-2 text-white rounded-md transition bg-green-500 hover:bg-green-600 ${isPatching ? 'opacity-50 cursor-not-allowed' : ''}`}>{'Åben kiosk'}</button>
							</div>
						</>
					)
					: (
						<>
							<div className="text-left space-y-2">
								<p className="text-gray-700 text-lg font-medium">{'Vælg hvordan kiosken skal lukkes:'}</p>
								<CloseModeSelector<'manual' | 'until' | 'nextProduct'>
									mode={mode}
									setMode={setMode}
									until={until}
									setUntil={setUntil}
									products={products}
								/>
							</div>
							<div className="flex gap-4 justify-center pt-2">
								<button type="button" disabled={isPatching} onClick={onClose} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800">{'Annuller'}</button>
								<button type="button" disabled={isPatching || (mode === 'until' && (until == null)) || (mode === 'until' && isUntilInPast) || (mode === 'nextProduct' && !hasAvailableProducts)} onClick={handlePatch} className={`px-5 py-2 text-white rounded-md transition bg-red-500 hover:bg-red-600 ${(isPatching || (mode === 'nextProduct' && !hasAvailableProducts) || (mode === 'until' && (until == null)) || (mode === 'until' && isUntilInPast)) ? 'opacity-50 cursor-not-allowed' : ''}`}>{'Luk kiosk'}</button>
							</div>
						</>
					)}
			</div>
		</CloseableModal>
	)
}

// Main manager component
function KioskStatusManager ({ kiosks, products }: { kiosks: KioskType[], products: ProductType[] }): React.ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [selectedKiosk, setSelectedKiosk] = useState<KioskType | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [isPatching, setIsPatching] = useState(false)
	const [, setNow] = useState(Date.now())
	useEffect(() => {
		const interval = setInterval(() => { setNow(Date.now()) }, 1000)
		return () => { clearInterval(interval) }
	}, [])

	const handlePatchKiosk = async (kioskId: string, patch: Partial<KioskType>): Promise<void> => {
		await axios.patch(`${API_URL}/v1/kiosks/${kioskId}`, patch, { withCredentials: true })
	}

	return (
		<div className="flex flex-col w-full max-w-2xl mx-auto">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{kiosks.map(kiosk => {
					const closed = isKioskClosed(kiosk)
					// Show tag inside circle if available, otherwise first letter of kiosk name
					const circleContent = (kiosk.kioskTag.length > 0) && kiosk.kioskTag.trim() !== ''
						? kiosk.kioskTag
						: kiosk.name.charAt(0).toUpperCase()

					// Create appropriate status text based on why kiosk is closed
					let statusText = 'Åben'
					if (closed) {
						if (kiosk.manualClosed) {
							statusText = 'Lukket manuelt'
						} else if (kiosk.closedUntil != null) {
							const closedUntil = dayjs(kiosk.closedUntil).format('dddd [d.] DD/MM YYYY [kl.] HH:mm')
							statusText = `Lukket indtil ${closedUntil}`
						} else {
							statusText = 'Lukket'
						}
					}

					return (
						<div key={kiosk._id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
							<KioskCircle
								isClosed={closed}
								content={circleContent}
								size="md"
							/>

							<div className="flex-1">
								<div className="text-sm font-medium text-gray-700 mb-1 line-clamp-2">{kiosk.name}</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-gray-500">{statusText}</span>
									<button
										type="button"
										disabled={isPatching}
										onClick={() => { setSelectedKiosk(kiosk); setShowModal(true) }}
										className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${closed
											? 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
											: 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50'
										} ${isPatching ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
										aria-label={closed ? 'Åben kiosk' : 'Luk kiosk'}
									>
										{closed ? 'Åben' : 'Luk'}
									</button>
								</div>
							</div>
						</div>
					)
				})}
			</div>
			{showModal && (selectedKiosk != null) && (
				<KioskStatusModalContent
					kiosk={selectedKiosk}
					products={products}
					isPatching={isPatching}
					onPatch={patch => {
						setIsPatching(true)
						void handlePatchKiosk(selectedKiosk._id, patch).finally(() => {
							setIsPatching(false)
							setShowModal(false)
						})
					}}
					onClose={() => { setShowModal(false) }}
				/>
			)}
		</div>
	)
}

export default KioskStatusManager
