import axios from 'axios'
import dayjs from 'dayjs'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import 'dayjs/locale/da'

import CloseableModal from '@/components/ui/CloseableModal'
import KioskCircle from '@/components/ui/KioskCircle'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { getNextAvailableProductTimeLocal, isKioskClosed } from '@/lib/timeUtils'
import type { KioskType, ProductType, SessionType } from '@/types/backendDataTypes'

import CloseModeSelector from './ui/CloseModeSelector'

// --- Types and helpers ---
// Kiosk status and warning types for clarity and extensibility
export type KioskBaseStatus = 'open' | 'closed'
export type KioskWarning = 'inactive' | 'multiSession' | 'noSession'

export interface KioskStatus {
	base: KioskBaseStatus
	warning?: KioskWarning
}

/**
 * Returns the current status and warning for a kiosk based on its sessions and closed state.
 */
function getKioskStatus (kiosk: KioskType, sessions: SessionType[]): KioskStatus {
	const closed = isKioskClosed(kiosk)
	if (sessions.length === 0) return { base: closed ? 'closed' : 'open', warning: 'noSession' }
	if (sessions.length > 1) return { base: closed ? 'closed' : 'open', warning: 'multiSession' }
	const lastActivity = new Date(sessions[0].lastActivity)
	if (Date.now() - lastActivity.getTime() > 24 * 60 * 60 * 1000) {
		return { base: closed ? 'closed' : 'open', warning: 'inactive' }
	}
	return { base: closed ? 'closed' : 'open' }
}

/**
 * Returns a human-readable status string for the kiosk.
 */
function getStatusText (kiosk: KioskType, base: KioskBaseStatus): string {
	if (base === 'open') return 'Åben'
	if (kiosk.manualClosed) return 'Lukket manuelt'
	if (kiosk.closedUntil != null) return `Lukket indtil ${dayjs(kiosk.closedUntil).format('dddd [d.] DD/MM YYYY [kl.] HH:mm')}`
	return 'Lukket'
}

/**
 * Returns a warning string for the kiosk, if any.
 */
function getWarningText (warning?: KioskWarning): string {
	switch (warning) {
		case 'noSession':
			return 'Kiosken er ikke logget ind.'
		case 'inactive':
			return 'Seneste aktivitet var for over 24 timer siden. Tjek om kiosken er offline.'
		case 'multiSession':
			return 'Kiosken har flere aktive sessioner. Gå til "Modificer" -> "Login Sessioner", og fjern unødvendige logins for denne kiosk.'
		default:
			return ''
	}
}

// --- Modal content component ---
// Handles the modal for opening/closing a kiosk, with clear state and logic
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
	const now = useMemo(() => new Date(), [])
	const closedUntilValid = (kiosk.closedUntil != null) && new Date(kiosk.closedUntil) > now ? kiosk.closedUntil : null
	const [mode, setMode] = useState<'manual' | 'until' | 'nextProduct'>(
		!kiosk.manualClosed && (closedUntilValid != null) ? 'until' : 'manual'
	)
	const [until, setUntil] = useState<string | null>(closedUntilValid)
	const isClosed = isKioskClosed(kiosk)
	const hasAvailableProducts = useMemo(() => products.some(p => p.isActive), [products])
	const isUntilInPast = mode === 'until' && until != null && new Date(until) <= now

	// Handles patching the kiosk state
	const handlePatch = useCallback(() => {
		if (mode === 'manual') onPatch({ manualClosed: true, closedUntil: null })
		else if (mode === 'until') onPatch({ manualClosed: false, closedUntil: until })
		else onPatch({ manualClosed: false, closedUntil: getNextAvailableProductTimeLocal(products)?.date.toISOString() ?? null })
	}, [mode, until, products, onPatch])

	// Handles opening the kiosk
	const handleOpenKiosk = useCallback(() => {
		onPatch({ manualClosed: false, closedUntil: null })
	}, [onPatch])

	return (
		<CloseableModal canClose onClose={onClose}>
			<div className="text-center flex flex-col gap-4">
				<KioskCircle
					isClosed={isClosed}
					kioskTag={kiosk.kioskTag}
					className="mx-auto mb-2"
				/>
				<h2 className="text-2xl font-bold text-gray-800">{kiosk.name}</h2>
				{isClosed
					? (
						<>
							{kiosk.manualClosed && <p className="text-red-700 font-semibold mt-2">{'Kiosken er lukket manuelt.'}</p>}
							{(kiosk.closedUntil != null) && !kiosk.manualClosed && (
								<p className="text-red-700 font-semibold mt-2">
									{'Kiosken er lukket indtil: '}{dayjs(kiosk.closedUntil).format('dddd [d.] DD/MM YYYY [kl.] HH:mm')}
								</p>
							)}
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
								<button
									type="button"
									disabled={
										isPatching ||
										(mode === 'until' && ((until == null) || isUntilInPast)) ||
										(mode === 'nextProduct' && !hasAvailableProducts)
									}
									onClick={handlePatch}
									className={`px-5 py-2 text-white rounded-md transition bg-red-500 hover:bg-red-600 ${isPatching ||
											(mode === 'nextProduct' && !hasAvailableProducts) ||
											(mode === 'until' && ((until == null) || isUntilInPast))
										? 'opacity-50 cursor-not-allowed'
										: ''
									}`}
								>
									{'Luk kiosk\r'}
								</button>
							</div>
						</>
					)}
			</div>
		</CloseableModal>
	)
}

// --- Main manager component ---
// Handles the kiosk status overview and modal logic
const KioskStatusManager = ({
	kiosks,
	products
}: {
	kiosks: KioskType[]
	products: ProductType[]
}): React.ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [selectedKiosk, setSelectedKiosk] = useState<KioskType | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [isPatching, setIsPatching] = useState(false)
	const [, setNow] = useState(Date.now())
	const [sessions, setSessions] = useState<SessionType[]>([])
	const [loadingSessions, setLoadingSessions] = useState(true)

	// Timer to force re-render for time-based UI
	useEffect(() => {
		const interval = setInterval(() => { setNow(Date.now()) }, 1000)
		return () => { clearInterval(interval) }
	}, [])

	// Fetch sessions for all kiosks
	useEffect(() => {
		async function fetchSessions (): Promise<void> {
			setLoadingSessions(true)
			try {
				const res = await axios.get<SessionType[]>(`${API_URL}/v1/sessions`, { withCredentials: true })
				setSessions(res.data)
			} catch (e) {
				// Optionally handle error
			} finally {
				setLoadingSessions(false)
			}
		}
		fetchSessions().catch(e => { addError(e) })
	}, [API_URL, addError])

	// Patch kiosk state
	const handlePatchKiosk = useCallback(async (kioskId: string, patch: Partial<KioskType>) => {
		await axios.patch(`${API_URL}/v1/kiosks/${kioskId}`, patch, { withCredentials: true })
	}, [API_URL])

	return (
		<div className="flex flex-col w-full max-w-2xl mx-auto">
			{loadingSessions
				? (
					<div className="flex justify-center items-center py-10 text-gray-500 text-lg">{'Indlæser sessions...'}</div>
				)
				: (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{kiosks.map(kiosk => {
							const kioskSessions = sessions.filter(s => s.type === 'kiosk' && s.userId === kiosk._id)
							const { base, warning } = getKioskStatus(kiosk, kioskSessions)
							const statusText = getStatusText(kiosk, base)
							const warningText = getWarningText(warning)
							return (
								<div key={kiosk._id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
									<KioskCircle
										warningStatus={warning}
										isClosed={base === 'closed'}
										kioskTag={kiosk.kioskTag}
									/>
									<div className="flex-1">
										<div className="text-sm font-medium text-gray-700 mb-1 line-clamp-2 flex items-center gap-2">{kiosk.name}</div>
										<div className="flex items-center gap-2">
											<span className={`text-xs ${warning != null ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>{statusText}</span>
											<button
												type="button"
												disabled={isPatching}
												onClick={() => { setSelectedKiosk(kiosk); setShowModal(true) }}
												className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${base === 'closed'
													? 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
													: warning != null
														? 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
														: 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50'
												} ${isPatching ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
												aria-label={base === 'closed' ? 'Åben kiosk' : 'Luk kiosk'}
											>
												{base === 'closed' ? 'Åben' : 'Luk'}
											</button>
										</div>
										{(warningText.length > 0) && (
											<div className="text-xs text-orange-600 mt-1">{warningText}</div>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
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
