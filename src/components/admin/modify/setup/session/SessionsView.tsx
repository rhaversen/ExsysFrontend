'use client'

import axios from 'axios'
import { publicIpv4 } from 'public-ip'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { timeSince } from '@/lib/timeUtils'
import { type AdminType, type KioskType, type SessionType } from '@/types/backendDataTypes'

import SessionGroup from './SessionGroup'
import SessionItem from './SessionItem'

interface ViewMode {
	type: 'admin' | 'kiosk'
	userId: string | null
	showAll: boolean
}

const SessionsView = ({
	admins,
	kiosks,
	sessions
}: {
	admins: AdminType[]
	kiosks: KioskType[]
	sessions: SessionType[]
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	// Core state
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
	const [currentUserId, setCurrentUserId] = useState<string | null>(null)
	const [currentPublicIp, setCurrentPublicIp] = useState<string | null>(null)
	const [isLoadingIp, setIsLoadingIp] = useState<boolean>(true)
	const [viewMode, setViewMode] = useState<ViewMode>({
		type: 'admin',
		userId: null,
		showAll: false
	})

	// Split sessions by type for easier access
	const kioskSessions = useMemo(
		() => sessions.filter(session => session.type === 'kiosk' && session.userId !== null),
		[sessions]
	)

	const adminSessions = useMemo(
		() => sessions.filter(session => session.type === 'admin' && session.userId !== null),
		[sessions]
	)

	// Create lookup maps for user data
	const userMaps = useMemo(() => {
		const adminMap: Record<string, AdminType> = {}
		const kioskMap: Record<string, KioskType> = {}

		admins.forEach(admin => { adminMap[admin._id] = admin })
		kiosks.forEach(kiosk => { kioskMap[kiosk._id] = kiosk })

		return { adminMap, kioskMap }
	}, [admins, kiosks])

	// Group sessions by user
	const groupedSessions = useMemo(() => {
		const adminGroups: Record<string, SessionType[]> = {}
		const kioskGroups: Record<string, SessionType[]> = {}

		adminSessions.forEach(session => {
			const userId = session.userId
			if (userId != null) {
				adminGroups[userId] = adminGroups[userId] ?? []
				adminGroups[userId].push(session)
			}
		})

		kioskSessions.forEach(session => {
			const userId = session.userId
			if (userId != null) {
				kioskGroups[userId] = kioskGroups[userId] ?? []
				kioskGroups[userId].push(session)
			}
		})

		return { adminGroups, kioskGroups }
	}, [adminSessions, kioskSessions])

	// Sort user IDs for display
	const sortedUserIds = useMemo(() => {
		// Admin IDs: Current user first, then alphabetical
		const adminIds = Object.keys(groupedSessions.adminGroups)
		let sortedAdminIds = adminIds.filter(id => id !== currentUserId)
			.sort((a, b) => {
				const nameA = userMaps.adminMap[a]?.name ?? ''
				const nameB = userMaps.adminMap[b]?.name ?? ''
				return nameA.localeCompare(nameB)
			})

		if ((currentUserId != null) && adminIds.includes(currentUserId)) {
			sortedAdminIds = [currentUserId, ...sortedAdminIds]
		}

		// Kiosk IDs: Alphabetical
		const sortedKioskIds = Object.keys(groupedSessions.kioskGroups)
			.sort((a, b) => {
				const nameA = userMaps.kioskMap[a]?.name ?? ''
				const nameB = userMaps.kioskMap[b]?.name ?? ''
				return nameA.localeCompare(nameB)
			})

		return { adminIds: sortedAdminIds, kioskIds: sortedKioskIds }
	}, [groupedSessions, userMaps, currentUserId])

	// Get sessions to display based on the current view mode
	const sessionsToDisplay = useMemo(() => {
		const { type, userId, showAll } = viewMode

		// Return sessions for a specific user
		if (!showAll && userId !== null) {
			if (type === 'admin') { return groupedSessions.adminGroups[userId] ?? [] } else { return groupedSessions.kioskGroups[userId] ?? [] }
		}

		// Return all sessions, but we'll handle the display differently in the render
		if (type === 'admin') { return adminSessions } else { return kioskSessions }
	}, [viewMode, adminSessions, kioskSessions, groupedSessions])

	// Handler for sidebar item clicks
	const handleSelect = useCallback((type: 'admin' | 'kiosk', userId: string | null, showAll: boolean) => {
		setViewMode({ type, userId, showAll })
	}, [])

	// Delete a session
	const deleteSession = useCallback(
		(id: string): void => {
			axios
				.delete(`${API_URL}/v1/sessions/${id}`, {
					data: { confirm: true },
					withCredentials: true
				})
				.catch(error => { addError(error) })
		},
		[API_URL, addError]
	)

	// Get current public IP
	useEffect(() => {
		const fetchPublicIp = async (): Promise<void> => {
			try {
				setIsLoadingIp(true)
				const ip = await publicIpv4()
				setCurrentPublicIp(ip)
			} catch (error) {
				addError('Failed to fetch public IP:', error)
			} finally {
				setIsLoadingIp(false)
			}
		}

		fetchPublicIp().catch(error => { addError(error) })
	}, [addError])

	// Get current session on load
	useEffect(() => {
		axios.get<SessionType>(`${API_URL}/v1/sessions/current`, {
			withCredentials: true
		})
			.then(({ data }) => {
				setCurrentSessionId(data._id)
				if (data.userId != null) {
					setCurrentUserId(data.userId)
					setViewMode({ type: 'admin', userId: data.userId, showAll: false })
				}
				return null
			})
			.catch(error => { addError(error) })
	}, [API_URL, addError])

	// Generate header title for content area
	const headerTitle = useMemo(() => {
		const { type, userId, showAll } = viewMode

		if (type === 'admin') {
			if (showAll) { return 'Alle Administrator Sessioner' }
			if (userId != null) {
				return userId === currentUserId
					? 'Mine Sessioner'
					: `Administrator: ${userMaps.adminMap[userId]?.name ?? 'Ukendt Navn'}`
			}
		} else {
			if (showAll) { return 'Alle Kiosk Sessioner' }
			if (userId != null) { return `Kiosk: ${userMaps.kioskMap[userId]?.name ?? 'Ukendt navn'}` }
		}

		return ''
	}, [viewMode, currentUserId, userMaps])

	// Check if the current view shows a kiosk with multiple sessions
	const showKioskMultipleSessionsWarning = useMemo(() => {
		const { type, userId, showAll } = viewMode
		return type === 'kiosk' && !showAll && userId !== null &&
			(groupedSessions.kioskGroups[userId]?.length ?? 0) > 1
	}, [viewMode, groupedSessions])

	// Sort sessions by lastActivity to suggest which one to keep
	const sortedKioskSessions = useMemo(() => {
		if (!showKioskMultipleSessionsWarning || viewMode.userId === null) { return [] }

		return [...(groupedSessions.kioskGroups[viewMode.userId] ?? [])]
			.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
	}, [showKioskMultipleSessionsWarning, viewMode.userId, groupedSessions])

	// Find kiosks with multiple sessions for the "All Kiosks" view warning
	const kiosksWithMultipleSessions = useMemo(() => {
		const result: Array<{
			userId: string
			name: string
			sessionCount: number
		}> = []

		Object.entries(groupedSessions.kioskGroups).forEach(([userId, sessions]) => {
			if (sessions.length > 1) {
				result.push({
					userId,
					name: userMaps.kioskMap[userId]?.name ?? 'Ukendt kiosk',
					sessionCount: sessions.length
				})
			}
		})

		return result.sort((a, b) => b.sessionCount - a.sessionCount)
	}, [groupedSessions.kioskGroups, userMaps.kioskMap])

	// Generate the grouped sessions view for "All Sessions" mode
	const renderGroupedSessions = (): ReactElement => {
		const { type } = viewMode
		const isAdmin = type === 'admin'
		const userMap = isAdmin ? userMaps.adminMap : userMaps.kioskMap
		const userGroups = isAdmin ? groupedSessions.adminGroups : groupedSessions.kioskGroups

		// Get sorted user IDs for display order
		const userIdsToDisplay = Object.keys(userGroups).sort((a, b) => {
			const nameA = userMap[a]?.name ?? ''
			const nameB = userMap[b]?.name ?? ''
			return nameA.localeCompare(nameB)
		})

		if (userIdsToDisplay.length === 0) {
			return <div className="text-gray-500">{'Ingen sessioner at vise'}</div>
		}

		return (
			<>
				{userIdsToDisplay.map(userId => {
					const sessions = userGroups[userId] ?? []
					const userName = userMap[userId]?.name ?? (isAdmin ? 'Ukendt Administrator' : 'Ukendt Kiosk')
					const isCurrentUser = isAdmin && userId === currentUserId

					return (
						<div key={userId} className="mb-8">
							<div className="mb-3 pb-2 border-b border-gray-400 flex items-center">
								<div
									className="flex items-center cursor-pointer group p-1 rounded transition-colors"
									onClick={() => { handleSelect(type, userId, false) }}
								>
									<h3 className="text-lg font-medium text-gray-800 group-hover:text-blue-600">
										{userName}
									</h3>
									{isCurrentUser && (
										<span className="ml-2 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-800 font-medium">
											{'Dig'}
										</span>
									)}
									<span className="ml-3 bg-gray-100 text-gray-700 text-sm px-2 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-800">
										{sessions.length} {sessions.length === 1 ? 'session' : 'sessioner'}
									</span>
								</div>

								{type === 'kiosk' && sessions.length > 1 && (
									<span className="ml-2 flex items-center text-amber-600">
										<FaExclamationTriangle className="mr-1" size={14} />
										<span className="text-sm font-medium">{'Flere sessioner'}</span>
									</span>
								)}
							</div>

							<div className="grid gap-4">
								{sessions.map(session => (
									<SessionItem
										key={session._id}
										session={session}
										currentSessionId={currentSessionId}
										currentPublicIp={currentPublicIp}
										isLoadingIp={isLoadingIp}
										onDelete={deleteSession}
									/>
								))}
							</div>
						</div>
					)
				})}
			</>
		)
	}

	return (
		<div className="flex flex-col md:flex-row">
			{/* Sidebar */}
			<div className="w-full md:w-64 bg-gray-100 rounded-lg shadow-md overflow-y-auto md:mr-6 self-start mt-2 ml-2">
				<div className="mb-6 border-b border-gray-300 pb-4 px-4 pt-4">
					<SessionGroup
						title="Administratorer"
						type="admin"
						totalSessionCount={adminSessions.length}
						userIds={sortedUserIds.adminIds}
						userMap={userMaps.adminMap}
						sessionGroups={groupedSessions.adminGroups}
						viewMode={viewMode}
						currentUserId={currentUserId}
						onSelect={handleSelect}
					/>
				</div>

				<div className="px-4 pb-4">
					<SessionGroup
						title="Kiosker"
						type="kiosk"
						totalSessionCount={kioskSessions.length}
						userIds={sortedUserIds.kioskIds}
						userMap={userMaps.kioskMap}
						sessionGroups={groupedSessions.kioskGroups}
						viewMode={viewMode}
						currentUserId={currentUserId}
						onSelect={handleSelect}
					/>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 p-6 overflow-y-auto">
				{(headerTitle.length > 0)
					? (
						<div>
							<h2 className="text-2xl font-bold text-gray-800 mb-4">
								{headerTitle}
							</h2>

							{/* Warning for All Kiosks View */}
							{viewMode.type === 'kiosk' && viewMode.showAll && kiosksWithMultipleSessions.length > 0 && (
								<div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-5">
									<div className="flex items-start mb-3">
										<FaExclamationTriangle className="text-amber-500 mt-1 mr-3 flex-shrink-0" size={18} />
										<div>
											<h3 className="text-amber-800 font-medium">
												{`Advarsel: ${kiosksWithMultipleSessions.length} kiosk${kiosksWithMultipleSessions.length > 1 ? 'er' : ''} har flere aktive sessioner`}
											</h3>
											<p className="text-amber-700 text-sm">
												{'Flere aktive sessioner på samme kiosk kan skabe problemer. Undersøg disse kiosker.'}
											</p>
										</div>
									</div>

									<div className="flex flex-wrap gap-2 mt-1">
										{kiosksWithMultipleSessions.map(kiosk => (
											<button
												key={kiosk.userId}
												onClick={() => { handleSelect('kiosk', kiosk.userId, false) }}
												className="bg-white border border-amber-300 text-amber-800 rounded px-3 py-1 text-sm hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
											>
												<FaExclamationTriangle size={12} />
												<span>{kiosk.name}</span>
												<span className="bg-amber-200 text-amber-800 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs">
													{kiosk.sessionCount}
												</span>
											</button>
										))}
									</div>
								</div>
							)}

							{/* Warning message for kiosks with multiple sessions */}
							{showKioskMultipleSessionsWarning && (
								<div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-5 flex items-start">
									<FaExclamationTriangle className="text-amber-500 mt-1 mr-3 flex-shrink-0" size={18} />
									<div>
										<h3 className="text-amber-800 font-medium mb-1">{'Advarsel: Flere aktive sessioner på samme kiosk'}</h3>
										<p className="text-amber-700 text-sm">
											{'Det er problematisk at have flere aktive sessioner på samme kiosk, da det kan skabe \r'}
											{'forvirring og tekniske problemer. Du bør overveje at logge ud af de ældste sessioner og \r'}
											{'kun beholde den mest aktive session.\r'}
										</p>
										{sortedKioskSessions.length > 0 && (
											<p className="text-amber-700 text-sm mt-2 font-medium">
												{'Tip: Behold sessionen med seneste aktivitet ('}{' '}
												{timeSince(sortedKioskSessions[0].lastActivity)} {') og log ud af \r'}
												{'de øvrige sessioner.\r'}
											</p>
										)}
									</div>
								</div>
							)}

							{/* Render sessions - grouped if showing all, or individual if for a specific user */}
							{viewMode.showAll
								? renderGroupedSessions()
								: (
									<div className="grid gap-4">
										{sessionsToDisplay.map(session => (
											<SessionItem
												key={session._id}
												session={session}
												currentSessionId={currentSessionId}
												currentPublicIp={currentPublicIp}
												isLoadingIp={isLoadingIp}
												onDelete={deleteSession}
											/>
										))}

										{sessionsToDisplay.length === 0 && (
											<div className="text-gray-500">{'Ingen sessioner at vise'}</div>
										)}
									</div>
								)
							}
						</div>
					)
					: (
						<div className="flex items-center justify-center h-64 text-gray-500">
							<p>{'Vælg en bruger eller kategori fra sidepanelet for at se sessioner'}</p>
						</div>
					)}
			</div>
		</div>
	)
}

export default SessionsView
