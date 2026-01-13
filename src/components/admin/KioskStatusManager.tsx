import axios from 'axios'
import dayjs from 'dayjs'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import 'dayjs/locale/da'
import { FaCodeBranch, FaMoon, FaSyncAlt, FaUsers, FaUserSlash, FaWifi } from 'react-icons/fa'
import { FiCheck, FiX, FiLoader } from 'react-icons/fi'

import CloseableModal from '@/components/ui/CloseableModal'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useAdminKioskPing } from '@/hooks/useAdminKioskPing'
import { getNextAvailableProductOrderWindowFrom, isKioskDeactivated, isCurrentTimeInOrderWindow, getNextOpen, formatRelativeDateLabel } from '@/lib/timeUtils'
import type { KioskType, ProductType, SessionType, ConfigsType } from '@/types/backendDataTypes'

import CloseModeSelector from './ui/CloseModeSelector'

// --- Types ---

type KioskHealthState =
	| 'not_logged_in'
	| 'multi_session'
	| 'not_responding'
	| 'checking'
	| 'healthy'

type OperationalState =
	| 'operational'
	| 'closed_deactivated'
	| 'closed_deactivated_until'
	| 'closed_weekday'
	| 'closed_time_window'
	| 'loading'

type DisplayColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green'

interface KioskStatus {
	health: KioskHealthState
	operational: OperationalState
	hasVersionMismatch: boolean
	viewState?: string
	kioskGitHash?: string
}

// --- Style Mappings ---

const DISPLAY_COLORS: Record<DisplayColor, { ring: string, text: string, background: string }> = {
	gray: { ring: 'ring-2 ring-gray-300', text: 'text-gray-500', background: 'bg-gray-300' },
	red: { ring: 'ring-2 ring-red-400', text: 'text-red-700', background: 'bg-red-400' },
	orange: { ring: 'ring-2 ring-orange-400', text: 'text-orange-700', background: 'bg-orange-400' },
	yellow: { ring: 'ring-2 ring-yellow-400', text: 'text-yellow-700', background: 'bg-yellow-400' },
	green: { ring: 'ring-2 ring-green-400', text: 'text-green-700', background: 'bg-green-400' }
}

// --- Helper Functions ---

function getKioskHealth (
	sessions: SessionType[],
	isResponding: boolean,
	isChecking: boolean
): KioskHealthState {
	if (sessions.length === 0) { return 'not_logged_in' }
	if (sessions.length > 1) { return 'multi_session' }
	if (isChecking) { return 'checking' }
	if (!isResponding) { return 'not_responding' }
	return 'healthy'
}

function getOperationalState (
	kiosk: KioskType,
	products: ProductType[],
	configs: ConfigsType | null
): OperationalState {
	if (configs === null) { return 'loading' }

	if (kiosk.deactivated) { return 'closed_deactivated' }

	if (kiosk.deactivatedUntil !== null && new Date(kiosk.deactivatedUntil) > new Date()) {
		return 'closed_deactivated_until'
	}

	const todayWeekday = new Date().getDay()
	if (configs.configs.disabledWeekdays.includes(todayWeekday)) {
		return 'closed_weekday'
	}

	const hasAvailableProducts = products.some(
		p => p.isActive && isCurrentTimeInOrderWindow(p.orderWindow)
	)
	if (!hasAvailableProducts) { return 'closed_time_window' }

	return 'operational'
}

function getDisplayColor (status: KioskStatus): DisplayColor {
	switch (status.health) {
		case 'not_logged_in':
		case 'checking':
			return 'gray'
		case 'multi_session':
		case 'not_responding':
			return 'red'
		case 'healthy':
			switch (status.operational) {
				case 'loading':
					return 'gray'
				case 'operational':
					return 'green'
				case 'closed_deactivated':
					return 'orange'
				case 'closed_deactivated_until':
				case 'closed_weekday':
				case 'closed_time_window':
					return 'yellow'
			}
	}
}

function getBadgeIcon (status: KioskStatus): React.ReactElement {
	switch (status.health) {
		case 'not_logged_in':
			return <FaUserSlash className="w-3.5 h-3.5 text-gray-500" />
		case 'multi_session':
			return <FaUsers className="w-3.5 h-3.5 text-red-700" />
		case 'not_responding':
			return <FaWifi className="w-3.5 h-3.5 text-red-700" />
		case 'checking':
			return <FiLoader className="w-3.5 h-3.5 text-gray-400 animate-spin" />
		case 'healthy':
			if (status.hasVersionMismatch) {
				return <FaCodeBranch className="w-3.5 h-3.5 text-orange-600" />
			}
			if (status.operational === 'operational') {
				return <FiCheck className="w-3.5 h-3.5 text-green-600" />
			}
			if (status.operational === 'closed_deactivated') {
				return <FiX className="w-3.5 h-3.5 text-orange-600" />
			}
			return <FaMoon className="w-3.5 h-3.5 text-yellow-600" />
	}
}

function getStatusText (status: KioskStatus, kiosk: KioskType): string {
	switch (status.health) {
		case 'not_logged_in':
			return 'Ikke logget ind'
		case 'multi_session':
			return 'Flere sessioner aktive'
		case 'not_responding':
			return 'Svarer ikke'
		case 'checking':
			return 'Kontrollerer...'
		case 'healthy':
			switch (status.operational) {
				case 'loading':
					return 'Indlæser...'
				case 'operational':
					return 'Operationel'
				case 'closed_deactivated':
					return 'Deaktiveret'
				case 'closed_deactivated_until':
					return `Lukket indtil ${formatRelativeDateLabel(kiosk.deactivatedUntil)}`
				case 'closed_weekday':
					return 'Lukket i dag'
				case 'closed_time_window':
					return 'Lukket nu'
			}
	}
}

function getDescription (status: KioskStatus, adminGitHash: string): string {
	switch (status.health) {
		case 'not_logged_in':
			return 'Kiosken er ikke logget ind. Log ind på kiosken for at aktivere den.'
		case 'multi_session':
			return 'Kiosken er logget ind på flere enheder. Fjern overflødige sessioner under "Modificer" → "Login Sessioner".'
		case 'not_responding':
			return 'Kiosken svarer ikke på ping. Tjek at kiosken er tændt og har internetforbindelse.'
		case 'checking':
			return 'Kontrollerer forbindelse til kiosk...'
		case 'healthy':
			if (status.hasVersionMismatch) {
				return `Kiosken kører en forældet version (${status.kioskGitHash?.slice(0, 7)}). Genindlæs kiosken for at opdatere til version ${adminGitHash.slice(0, 7)}.`
			}
			switch (status.operational) {
				case 'loading':
					return 'Indlæser konfiguration...'
				case 'operational':
					return 'Kiosken er åben og klar til bestillinger.'
				case 'closed_deactivated':
					return 'Kiosken er manuelt deaktiveret.'
				case 'closed_deactivated_until':
					return 'Kiosken er midlertidigt deaktiveret og åbner automatisk.'
				case 'closed_weekday':
					return 'Kiosken er lukket på denne ugedag.'
				case 'closed_time_window':
					return 'Ingen produkter er tilgængelige på dette tidspunkt.'
			}
	}
}

function translateViewState (viewState: string): string {
	switch (viewState) {
		case 'welcome': return 'Velkomst'
		case 'activity': return 'Aktivitet'
		case 'room': return 'Lokale'
		case 'order': return 'Ordre'
		case 'feedback': return 'Feedback'
		default: return viewState
	}
}

// --- Components ---

function KioskCircle ({
	kioskTag,
	color,
	badgeIcon,
	className = ''
}: {
	kioskTag: string
	color: DisplayColor
	badgeIcon: React.ReactElement
	className?: string
}): React.ReactElement {
	const styles = DISPLAY_COLORS[color]
	return (
		<div className={`relative ${className}`}>
			<div
				className={`w-16 h-16 text-xl rounded-full flex items-center justify-center font-semibold shadow-sm bg-white ${styles.ring}`}
			>
				<div className={`absolute inset-2 rounded-full opacity-20 ${styles.background}`} />
				<span className={`relative text-lg ${styles.text}`}>
					{kioskTag}
				</span>
			</div>
			<div
				className="absolute w-6 h-6 -bottom-1 -right-1 rounded-full flex items-center justify-center shadow-sm border border-gray-100 bg-white"
			>
				{badgeIcon}
			</div>
		</div>
	)
}

function KioskControlModalContent ({
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
	const isDeactivated = isKioskDeactivated(kiosk)
	const deactivatedUntilValid = (kiosk.deactivatedUntil !== null) && new Date(kiosk.deactivatedUntil) > new Date()
	const initialMode = !kiosk.deactivated && deactivatedUntilValid ? 'until' : 'manual'
	const initialUntil = deactivatedUntilValid ? (kiosk.deactivatedUntil as string) : undefined

	const handleConfirmDeactivate = (mode: 'manual' | 'until' | 'nextProduct', until: string | null) => {
		if (mode === 'manual') {
			onPatch({ deactivated: true, deactivatedUntil: null })
		} else if (mode === 'until') {
			onPatch({ deactivated: false, deactivatedUntil: until })
		} else {
			onPatch({ deactivated: false, deactivatedUntil: getNextAvailableProductOrderWindowFrom(products)?.date.toISOString() ?? null })
		}
	}

	const handleActivateKiosk = useCallback(() => {
		onPatch({ deactivated: false, deactivatedUntil: null })
	}, [onPatch])

	return (
		<CloseableModal canClose onClose={onClose}>
			<div className="text-center flex flex-col gap-4">
				<h2 className="text-2xl font-bold text-gray-800">{kiosk.name}</h2>
				{isDeactivated ? (
					<>
						{kiosk.deactivated && <p className="text-red-700 font-semibold mt-2">{'Kiosken er deaktiveret.'}</p>}
						{(kiosk.deactivatedUntil !== null) && !kiosk.deactivated && (
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

// --- Main Component ---

const KioskStatusManager = ({
	kiosks,
	products,
	configs,
	sessions
}: {
	kiosks: KioskType[]
	products: ProductType[]
	configs: ConfigsType | null
	sessions: SessionType[]
}): React.ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const adminGitHash = process.env.NEXT_PUBLIC_GIT_HASH ?? 'unknown'
	const { addError } = useError()
	const [selectedKiosk, setSelectedKiosk] = useState<KioskType | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [isPatching, setIsPatching] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState<string | null>(null)
	const [, setNow] = useState(Date.now())

	const kioskIds = useMemo(() => kiosks.map(k => k._id), [kiosks])
	const { pingStatuses, getPingState } = useAdminKioskPing(kioskIds)

	useEffect(() => {
		const interval = setInterval(() => { setNow(Date.now()) }, 1000)
		return () => { clearInterval(interval) }
	}, [])

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

	const handleRefreshKiosk = useCallback(async (kioskId: string) => {
		setIsRefreshing(kioskId)
		try {
			await axios.get(`${API_URL}/service/force-kiosk-refresh`, {
				params: { kioskId },
				withCredentials: true
			})
		} catch (error) {
			addError(error)
		} finally {
			setIsRefreshing(null)
		}
	}, [API_URL, addError])

	const isLoading = configs === null

	return (
		<div className='p-4 bg-gray-50 rounded-lg'>
			<h2 className="mb-3 text-lg text-gray-800">{'Kiosk status og håndtering'}</h2>
			<div className="flex flex-col w-full mx-auto">
				{isLoading ? (
					<div className="flex justify-center items-center py-10 text-gray-500 text-lg">{'Indlæser data...'}</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{kiosks.map(kiosk => {
							const kioskSessions = sessions.filter(s => s.type === 'kiosk' && s.userId === kiosk._id)
							const pingState = getPingState(kiosk._id)
							const pingStatus = pingStatuses.get(kiosk._id)

							const isResponding = pingState === 'active'
							const isChecking = pingState === 'loading'

							const health = getKioskHealth(kioskSessions, isResponding, isChecking)
							const operational = getOperationalState(kiosk, products, configs)
							const kioskGitHash = pingStatus?.gitHash
							const hasVersionMismatch = health === 'healthy' &&
								kioskGitHash !== undefined &&
								kioskGitHash !== adminGitHash &&
								kioskGitHash !== 'unknown' &&
								adminGitHash !== 'unknown'

							const status: KioskStatus = {
								health,
								operational,
								hasVersionMismatch,
								viewState: pingStatus?.viewState,
								kioskGitHash
							}

							const color = getDisplayColor(status)
							const badgeIcon = getBadgeIcon(status)
							const statusText = getStatusText(status, kiosk)
							const description = getDescription(status, adminGitHash)
							const isDeactivated = isKioskDeactivated(kiosk)

							const nextOpenTime = (
								health === 'healthy' &&
								operational !== 'operational' &&
								operational !== 'closed_deactivated' &&
								operational !== 'loading'
							) ? getNextOpen(configs, kiosk, products) : null

							return (
								<div key={kiosk._id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
									<KioskCircle
										kioskTag={kiosk.kioskTag}
										color={color}
										badgeIcon={badgeIcon}
										className="mt-1 shrink-0"
									/>
									<div className="flex-1 flex flex-col gap-1">
										<div title={kiosk.name} className="text-base font-semibold text-gray-900 break-all line-clamp-1">
											{kiosk.name}
										</div>

										<div className={`text-sm font-medium ${DISPLAY_COLORS[color].text}`}>
											{statusText}
										</div>

										<div className="text-xs text-gray-600">
											{description}
										</div>

										{nextOpenTime !== null && (
											<div className="text-xs text-gray-500">
												{`Åbner ${formatRelativeDateLabel(nextOpenTime)}`}
											</div>
										)}

										{health === 'healthy' && status.viewState !== undefined && (
											<div className="text-xs text-gray-500">
												{`Viser: ${translateViewState(status.viewState)}`}
											</div>
										)}

										{hasVersionMismatch && (
											<div className="text-xs text-orange-600">
												{`Version: ${kioskGitHash?.slice(0, 7)} (forventet: ${adminGitHash.slice(0, 7)})`}
											</div>
										)}

										<div className="flex items-center gap-2 mt-2">
											<button
												type="button"
												disabled={isPatching}
												onClick={() => { setSelectedKiosk(kiosk); setShowModal(true) }}
												className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
													isDeactivated
														? 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
														: 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50'
												} ${isPatching ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
												aria-label={isDeactivated ? `Aktiver ${kiosk.name}` : `Deaktiver ${kiosk.name}`}
											>
												{isDeactivated ? 'Aktiver' : 'Deaktiver'}
											</button>
											<button
												type="button"
												disabled={isRefreshing === kiosk._id || health === 'not_logged_in'}
												onClick={() => { void handleRefreshKiosk(kiosk._id) }}
												className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 ${
													isRefreshing === kiosk._id || health === 'not_logged_in' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
												}`}
												aria-label={`Genindlæs ${kiosk.name}`}
												title={health === 'not_logged_in' ? 'Kiosk er ikke logget ind' : `Genindlæs ${kiosk.name}`}
											>
												<span className="flex items-center gap-1">
													<FaSyncAlt className={`w-3 h-3 ${isRefreshing === kiosk._id ? 'animate-spin' : ''}`} />
													{'Genindlæs'}
												</span>
											</button>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{showModal && selectedKiosk !== null && (
				<KioskControlModalContent
					kiosk={selectedKiosk}
					products={products}
					isPatching={isPatching}
					onPatch={patch => { void handlePatchKiosk(selectedKiosk._id, patch) }}
					onClose={() => { if (!isPatching) { setShowModal(false) } }}
				/>
			)}
		</div>
	)
}

export default KioskStatusManager
