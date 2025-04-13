'use client'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type AdminType, type KioskType, type SessionType } from '@/types/backendDataTypes'
import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import SessionItem from './SessionItem'
import SessionGroup from './SessionGroup' // Import the new component

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
	const [currentSessionIp, setCurrentSessionIp] = useState<string | null>(null)
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

		if (type === 'admin') {
			if (showAll) return adminSessions
			if (userId != null) return groupedSessions.adminGroups[userId] ?? []
		} else {
			if (showAll) return kioskSessions
			if (userId != null) return groupedSessions.kioskGroups[userId] ?? []
		}

		return []
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
				setCurrentSessionIp(data.ipAddress)
			})
			.catch(error => { addError(error) })
	}, [API_URL, addError])

	// Generate header title for content area
	const headerTitle = useMemo(() => {
		const { type, userId, showAll } = viewMode

		if (type === 'admin') {
			if (showAll) return 'Alle Administrator Sessioner'
			if (userId != null) {
				return userId === currentUserId
					? 'Mine Sessioner'
					: `Administrator: ${userMaps.adminMap[userId]?.name ?? 'Ukendt Navn'}`
			}
		} else {
			if (showAll) return 'Alle Kiosk Sessioner'
			if (userId != null) return `Kiosk: ${userMaps.kioskMap[userId]?.name ?? 'Ukendt navn'}`
		}

		return ''
	}, [viewMode, currentUserId, userMaps])

	return (
		<div className="flex">
			{/* Sidebar */}
			<div className="w-64 bg-gray-100 rounded-lg shadow-md overflow-y-auto mr-6 self-start mt-2 ml-2">
				<div className="mb-6 border-b pb-4 px-4 pt-4">
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
							<div className="grid gap-4">
								{sessionsToDisplay.map(session => (
									<SessionItem
										key={session._id}
										session={session}
										currentSessionId={currentSessionId}
										currentSessionIp={currentSessionIp}
										onDelete={deleteSession}
									/>
								))}

								{sessionsToDisplay.length === 0 && (
									<div className="text-gray-500">{'Ingen sessioner at vise'}</div>
								)}
							</div>
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
