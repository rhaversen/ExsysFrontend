import axios from 'axios'
import dayjs from 'dayjs'
import React, { useState, useEffect, useCallback } from 'react'
import 'dayjs/locale/da'

import CloseableModal from '@/components/ui/CloseableModal'
import KioskCircle from '@/components/ui/KioskCircle'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { getNextAvailableProductOrderWindowFrom, isKioskDeactivated, isCurrentTimeInOrderWindow, getNextOpen, formatRelativeDateLabel } from '@/lib/timeUtils'
import type { KioskType, ProductType, SessionType, ConfigsType } from '@/types/backendDataTypes'

import CloseModeSelector from './ui/CloseModeSelector'

// --- Types and helpers ---

export type AdminControlStatus = 'active' | 'deactivated' | 'deactivated_until'

export type SessionWarning = 'inactive' | 'multiSession' | 'noSession'

export type OperationalStatusReason = 'operational' | 'closed_deactivated' | 'closed_deactivated_until' | 'closed_time_window' | 'closed_weekday' | 'closed_no_products' | 'loading_configs'
export interface OperationalStatus {
	isOpen: boolean
	reason: OperationalStatusReason
}

function getAdminControlStatus (kiosk: KioskType): AdminControlStatus {
	if (kiosk.deactivated) { return 'deactivated' }
	if (kiosk.deactivatedUntil != null && new Date(kiosk.deactivatedUntil) > new Date()) {
		return 'deactivated_until'
	}
	return 'active'
}

function getSessionWarning (sessions: SessionType[]): SessionWarning | undefined {
	if (sessions.length === 0) { return 'noSession' }
	if (sessions.length > 1) { return 'multiSession' }
	const lastActivity = new Date(sessions[0].lastActivity)
	if (Date.now() - lastActivity.getTime() > 24 * 60 * 60 * 1000) {
		return 'inactive'
	}
	return undefined
}

function getAdminControlStatusText (kiosk: KioskType): string {
	const status = getAdminControlStatus(kiosk)
	switch (status) {
		case 'deactivated':
		case 'deactivated_until':
			return 'Deaktiveret'
		case 'active':
		default:
			return 'Aktiv'
	}
}

function getSessionWarningText (warning?: SessionWarning): string {
	switch (warning) {
		case 'noSession':
			return 'Kiosken er ikke logget ind.'
		case 'inactive':
			return 'Seneste aktivitet var over 24 timer siden. Tjek om kiosken er offline.'
		case 'multiSession':
			return 'Flere aktive sessioner. Gå til "Modificer" -> "Login Sessioner", og fjern unødvendige logins.'
		default:
			return ''
	}
}

// --- Actual Operational Status Logic ---

function getOperationalStatus (
	kiosk: KioskType,
	products: ProductType[],
	configs: ConfigsType | null
): OperationalStatus {
	if (configs === null) {
		return { isOpen: false, reason: 'loading_configs' }
	}

	const adminStatus = getAdminControlStatus(kiosk)
	if (adminStatus === 'deactivated') {
		return { isOpen: false, reason: 'closed_deactivated' }
	}
	if (adminStatus === 'deactivated_until') {
		return { isOpen: false, reason: 'closed_deactivated_until' }
	}

	const todayWeekday = new Date().getDay()
	if (configs.configs.disabledWeekdays.includes(todayWeekday)) {
		return { isOpen: false, reason: 'closed_weekday' }
	}

	const hasAvailableProductsNow = products.some(
		p => p.isActive && isCurrentTimeInOrderWindow(p.orderWindow)
	)
	if (!hasAvailableProductsNow) {
		return { isOpen: false, reason: 'closed_time_window' }
	}

	return { isOpen: true, reason: 'operational' }
}

function getOperationalStatusText (status: OperationalStatus, kiosk: KioskType): string {
	if (status.isOpen) { return 'Operationel' }
	switch (status.reason) {
		case 'loading_configs':
			return 'Indlæser konfiguration...'
		case 'closed_deactivated':
			return 'Ikke operationel (Deaktiveret)'
		case 'closed_deactivated_until':
			return `Ikke operationel (Deaktiveret indtil ${formatRelativeDateLabel(kiosk.deactivatedUntil)})`
		case 'closed_weekday':
			return 'Ikke operationel (Lukket på denne ugedag)'
		case 'closed_time_window':
			return 'Ikke operationel (Ingen varer kan bestilles nu)'
		case 'closed_no_products':
			return 'Ikke operationel (Ingen aktive varer)'
		default:
			return 'Ikke operationel'
	}
}

// --- Modal content component ---

function KioskControlModalContent ({
	kiosk,
	products,
	configs,
	isPatching,
	onPatch,
	onClose
}: {
	kiosk: KioskType
	products: ProductType[]
	configs: ConfigsType | null
	isPatching: boolean
	onPatch: (patch: Partial<KioskType>) => void
	onClose: () => void
}): React.ReactElement {
	dayjs.locale('da')
	const isDeactivated = isKioskDeactivated(kiosk)
	const deactivatedUntilValid = (kiosk.deactivatedUntil != null) && new Date(kiosk.deactivatedUntil) > new Date()
	const initialMode = !kiosk.deactivated && deactivatedUntilValid ? 'until' : 'manual'
	const initialUntil = deactivatedUntilValid ? (kiosk.deactivatedUntil as string) : undefined
	const operationalStatus = getOperationalStatus(kiosk, products, configs)

	const handleConfirmDeactivate = (mode: 'manual' | 'until' | 'nextProduct', until: string | null) => {
		if (mode === 'manual') { onPatch({ deactivated: true, deactivatedUntil: null }) } else if (mode === 'until') { onPatch({ deactivated: false, deactivatedUntil: until }) } else { onPatch({ deactivated: false, deactivatedUntil: getNextAvailableProductOrderWindowFrom(products)?.date.toISOString() ?? null }) }
	}

	const handleActivateKiosk = useCallback(() => {
		onPatch({ deactivated: false, deactivatedUntil: null })
	}, [onPatch])

	return (
		<CloseableModal canClose onClose={onClose}>
			<div className="text-center flex flex-col gap-4">
				<KioskCircle
					isClosed={!operationalStatus.isOpen}
					kioskTag={kiosk.kioskTag}
					className="mx-auto mb-2"
				/>
				<h2 className="text-2xl font-bold text-gray-800">{kiosk.name}</h2>
				{isDeactivated ? (
					<>
						{kiosk.deactivated && <p className="text-red-700 font-semibold mt-2">{'Kiosken er deaktiveret.'}</p>}
						{(kiosk.deactivatedUntil != null) && !kiosk.deactivated && (
							<p className="text-red-700 font-semibold mt-2">
								{'Kiosken er deaktiveret indtil: '}
								{formatRelativeDateLabel(kiosk.deactivatedUntil)}
							</p>
						)}
						<div className="flex gap-4 justify-center pt-2">
							<button type="button" disabled={isPatching} onClick={onClose} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800">{'Annuller'}</button>
							<button type="button" disabled={isPatching} onClick={handleActivateKiosk} className={`px-5 py-2 text-white rounded-md transition bg-green-500 hover:bg-green-600 ${isPatching ? 'opacity-50 cursor-not-allowed' : ''}`}>{'Aktiver kiosk'}</button>
						</div>
					</>
				) : (
					<CloseModeSelector<'manual' | 'until' | 'nextProduct'>
						products={products}
						initialMode={initialMode}
						initialUntil={initialUntil}
						isPatching={isPatching}
						onConfirm={handleConfirmDeactivate}
						onCancel={onClose}
						cancelText="Annuller"
						confirmLabelMap={{ manual: 'Deaktiver kiosk', until: 'Deaktiver kiosk', nextProduct: 'Deaktiver kiosk' }}
					/>
				)}
			</div>
		</CloseableModal>
	)
}

// --- Main manager component ---

const KioskStatusManager = ({
	kiosks,
	products,
	configs
}: {
	kiosks: KioskType[]
	products: ProductType[]
	configs: ConfigsType | null
}): React.ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const [selectedKiosk, setSelectedKiosk] = useState<KioskType | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [isPatching, setIsPatching] = useState(false)
	const [, setNow] = useState(Date.now())
	const [sessions, setSessions] = useState<SessionType[]>([])
	const [loadingSessions, setLoadingSessions] = useState(true)

	useEffect(() => {
		const interval = setInterval(() => { setNow(Date.now()) }, 1000 * 60)
		return () => { clearInterval(interval) }
	}, [])

	useEffect(() => {
		async function fetchSessions (): Promise<void> {
			setLoadingSessions(true)
			try {
				const sessionsRes = await axios.get<SessionType[]>(`${API_URL}/v1/sessions`, { withCredentials: true })
				setSessions(sessionsRes.data)
			} catch (error) {
				addError(error)
			} finally {
				setLoadingSessions(false)
			}
		}
		fetchSessions().catch(e => { addError(e) })
	}, [API_URL, addError])

	const handlePatchKiosk = useCallback(async (kioskId: string, patch: Partial<KioskType>) => {
		setIsPatching(true)
		try {
			await axios.patch(`${API_URL}/v1/kiosks/${kioskId}`, patch, { withCredentials: true })
		} catch (error) {
			addError(error)
		} finally {
			setIsPatching(false)
			setShowModal(false)
		}
	}, [API_URL, addError])

	const isLoading = loadingSessions || configs === null

	return (
		<div className='p-4 bg-gray-50 rounded-lg'>
			<h2 className="mb-3 text-lg text-gray-800">
				{'Kiosk status og håndtering'}
			</h2>
			<div className="flex flex-col w-full mx-auto">
				{isLoading
					? (
						<div className="flex justify-center items-center py-10 text-gray-500 text-lg">{'Indlæser data...'}</div>
					)
					: (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{kiosks.map(kiosk => {
								const kioskSessions = sessions.filter(s => s.type === 'kiosk' && s.userId === kiosk._id)
								const sessionWarning = getSessionWarning(kioskSessions)
								const sessionWarningText = getSessionWarningText(sessionWarning)

								const adminControlStatusText = getAdminControlStatusText(kiosk)
								const isDeactivated = isKioskDeactivated(kiosk)

								const operationalStatus = getOperationalStatus(kiosk, products, configs)
								const operationalStatusText = getOperationalStatusText(operationalStatus, kiosk)

								const nextOpenTime = (!operationalStatus.isOpen)
									? getNextOpen(configs, kiosk, products)
									: null
								const openingMessage = nextOpenTime ? `Kiosken åbner igen ${formatRelativeDateLabel(nextOpenTime)}` : null

								const buttonLabel = isDeactivated ? 'Aktiver' : 'Deaktiver'
								const buttonAriaLabel = isDeactivated ? `Aktiver ${kiosk.name}` : `Deaktiver ${kiosk.name}`
								const buttonColorClasses = isDeactivated
									? 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
									: 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50'

								return (
									<div key={kiosk._id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
										<KioskCircle
											warningStatus={sessionWarning}
											isClosed={!operationalStatus.isOpen}
											kioskTag={kiosk.kioskTag}
											className="mt-1 flex-shrink-0"
										/>
										<div className="flex-1 flex flex-col gap-1.5">
											<div title={kiosk.name} className="text-base font-semibold text-gray-900 break-all line-clamp-1">{kiosk.name}</div>

											<div className={`text-sm font-bold ${operationalStatus.isOpen ? 'text-green-700' : 'text-red-700'}`}>
												{operationalStatusText}
											</div>

											{(openingMessage != null) && (
												<div className="text-xs text-gray-600">
													{openingMessage}
												</div>
											)}

											<div className="flex items-center gap-2 mt-1">
												<span className="text-xs text-gray-500">
													{adminControlStatusText}
												</span>
												<button
													type="button"
													disabled={isPatching}
													onClick={() => { setSelectedKiosk(kiosk); setShowModal(true) }}
													className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${buttonColorClasses} ${isPatching ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
													aria-label={buttonAriaLabel}
												>
													{buttonLabel}
												</button>
											</div>

											{(sessionWarningText.length > 0) && (
												<div className="text-xs text-orange-700 font-medium mt-1">{`Advarsel: ${sessionWarningText}`}</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					)}
			</div>

			{showModal && (selectedKiosk != null) && (
				<KioskControlModalContent
					kiosk={selectedKiosk}
					products={products}
					configs={configs}
					isPatching={isPatching}
					onPatch={patch => {
						void handlePatchKiosk(selectedKiosk._id, patch)
					}}
					onClose={() => { if (!isPatching) { setShowModal(false) } }}
				/>
			)}
		</div>
	)
}

export default KioskStatusManager
