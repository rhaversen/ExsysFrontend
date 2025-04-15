import React, { useState, useEffect } from 'react'
import CloseableModal from '@/components/ui/CloseableModal'
import KioskCircle from '@/components/ui/KioskCircle'
import dayjs from 'dayjs'
import type { KioskType, ProductType } from '@/types/backendDataTypes'
import axios from 'axios'
import { isKioskClosed } from '@/lib/timeUtils'

// Utility: Get next available product time
function getNextProductAvailableTime (products: ProductType[]): string | null {
	if (products.length === 0) return null
	const now = new Date()
	const getNextDate = (from: { hour: number, minute: number }): Date => {
		const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), from.hour, from.minute))
		if (next < now) next.setUTCDate(next.getUTCDate() + 1)
		return next
	}
	let soonest = getNextDate(products[0].orderWindow.from)
	for (let i = 1; i < products.length; i++) {
		const next = getNextDate(products[i].orderWindow.from)
		if (next < soonest) soonest = next
	}
	return soonest.toISOString()
}

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
	// Treat closedUntil in the past as not set
	const now = new Date()
	const closedUntilValid = (kiosk.closedUntil != null) && new Date(kiosk.closedUntil) > now ? kiosk.closedUntil : null
	const [mode, setMode] = useState<'manual' | 'until' | 'nextProduct'>(
		!kiosk.manualClosed && (closedUntilValid != null) ? 'until' : 'manual'
	)
	const [until, setUntil] = useState<string | null>(closedUntilValid)

	const isClosed = isKioskClosed(kiosk)

	// Get circle content (kiosk tag or first letter of name)
	const circleContent = (kiosk.kioskTag.length > 0) && kiosk.kioskTag.trim() !== ''
		? kiosk.kioskTag
		: kiosk.name.charAt(0).toUpperCase()

	const handlePatch = (): void => {
		if (mode === 'manual') onPatch({ manualClosed: true, closedUntil: null })
		else if (mode === 'until') onPatch({ manualClosed: false, closedUntil: until })
		else onPatch({ manualClosed: false, closedUntil: getNextProductAvailableTime(products) })
	}

	const handleOpenKiosk = (): void => { onPatch({ manualClosed: false, closedUntil: null }) }

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
							{((kiosk.closedUntil != null) && !kiosk.manualClosed) && <p className="text-red-700 font-semibold mt-2">{'Kiosken er lukket indtil: '}{dayjs(kiosk.closedUntil).format('DD-MM-YYYY HH:mm')}</p>}
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
								<div className="flex flex-col gap-2 text-gray-700">
									<label className="flex items-center gap-2">
										<input type="radio" checked={mode === 'manual'} onChange={() => { setMode('manual'); setUntil(null) }} />
										<span className="font-medium">{'Luk manuelt (indtil åbnet igen)'}</span>
									</label>
									<label className="flex items-center gap-2">
										<input type="radio" checked={mode === 'until'} onChange={() => { setMode('until') }} />
										<span className="font-medium">{'Luk indtil bestemt dato/tidspunkt'}</span>
									</label>
									<label className="flex items-center gap-2">
										<input type="radio" checked={mode === 'nextProduct'} onChange={() => { setMode('nextProduct'); setUntil(null) }} />
										<span className="font-medium">{'Luk indtil næste produkt bliver tilgængeligt'}</span>
									</label>
								</div>
								{mode === 'until' && (
									<div className="flex flex-col gap-2 mt-2">
										<label className="text-sm text-gray-700 font-medium">{'Vælg dato og tid:'}</label>
										<input id="close-until-input" type="datetime-local" className="border rounded px-2 py-1 text-gray-700" value={(until != null) ? dayjs(until).format('YYYY-MM-DDTHH:mm') : ''} onChange={e => { setUntil((e.target.value.length > 0) ? dayjs(e.target.value).toISOString() : null) }} min={dayjs().format('YYYY-MM-DDTHH:mm')} placeholder="Vælg dato og tid" />
									</div>
								)}
								{mode === 'nextProduct' && (
									<div className="flex flex-col gap-2 mt-2">
										<span className="text-sm text-gray-700 font-medium">
											{'Kiosken åbner automatisk når næste produkt bliver tilgængeligt: '}{(() => {
												const t = getNextProductAvailableTime(products)
												return (t != null) ? dayjs(t).format('DD-MM-YYYY HH:mm') : 'Ingen produkter tilgængelige'
											})()}
										</span>
									</div>
								)}
							</div>
							<div className="flex gap-4 justify-center pt-2">
								<button type="button" disabled={isPatching} onClick={onClose} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800">{'Annuller'}</button>
								<button type="button" disabled={isPatching || (mode === 'until' && (until == null))} onClick={handlePatch} className={`px-5 py-2 text-white rounded-md transition bg-red-500 hover:bg-red-600 ${isPatching ? 'opacity-50 cursor-not-allowed' : ''}`}>{'Luk kiosk'}</button>
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
							const closedUntilTime = dayjs(kiosk.closedUntil).format('HH:mm')
							const closedUntilDate = dayjs(kiosk.closedUntil).format('DD/MM')
							statusText = `Lukket indtil ${closedUntilTime} ${closedUntilDate}`
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
										className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
											closed
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
