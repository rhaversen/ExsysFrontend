'use client'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type AdminType, type KioskType, type SessionType } from '@/types/backendDataTypes'
import axios from 'axios'
import { type ReactElement, useCallback, useMemo } from 'react'
import SessionItem from './SessionItem'

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

	const kioskSessions = useMemo(
		() => sessions.filter((session) => session.type === 'kiosk' && session.userId !== null),
		[sessions]
	)

	const adminSessions = useMemo(
		() => sessions.filter((session) => session.type === 'admin' && session.userId !== null),
		[sessions]
	)

	// Map user IDs to kiosks
	const kioskUserMap = useMemo(() => {
		const map: Record<string, KioskType> = {}
		kiosks.forEach((kiosk) => {
			map[kiosk._id] = kiosk
		})
		return map
	}, [kiosks])

	// Map user IDs to admins
	const adminUserMap = useMemo(() => {
		const map: Record<string, AdminType> = {}
		admins.forEach((admin) => {
			map[admin._id] = admin
		})
		return map
	}, [admins])

	// Group kiosk sessions by userId
	const groupedKioskSessions = useMemo(() => {
		const groups: Record<string, SessionType[]> = {}
		kioskSessions.forEach((session) => {
			const userId = session.userId
			if (userId !== null && userId !== undefined) {
				if (groups[userId] === undefined) {
					groups[userId] = []
				}
				groups[userId].push(session)
			}
		})
		return groups
	}, [kioskSessions])

	// Group admin sessions by userId
	const groupedAdminSessions = useMemo(() => {
		const groups: Record<string, SessionType[]> = {}
		adminSessions.forEach((session) => {
			const userId = session.userId
			if (userId !== null && userId !== undefined) {
				if (groups[userId] === undefined) {
					groups[userId] = []
				}
				groups[userId].push(session)
			}
		})
		return groups
	}, [adminSessions])

	const deleteSession = useCallback(
		(id: string): void => {
			axios
				.delete(`${API_URL}/v1/sessions/${id}`, {
					data: { confirm: true },
					withCredentials: true
				})
				.catch((error) => {
					addError(error)
				})
		},
		[API_URL, addError]
	)

	return (
		<div className="p-4">
			<div className="flex justify-evenly">
				{/* Kiosk Sessions Column */}
				<div>
					<h2 className="flex justify-center text-gray-700 text-2xl font-bold mb-4">{'Kiosker'}</h2>
					{Object.keys(groupedKioskSessions).length === 0 && (
						<p className="text-gray-600">{'Ingen kiosk sessioner'}</p>
					)}
					{Object.keys(groupedKioskSessions).map((userId) => {
						const user = kioskUserMap[userId]
						const sessionsList = groupedKioskSessions[userId]
						return (
							<div key={userId} className="mb-8">
								<div className="flex justify-between items-center mb-2">
									<h3 className="text-xl text-gray-700 font-semibold">{`"${user.name}" sessioner`}</h3>
									<span className="text-gray-600">
										{sessionsList.length}{' session'}
										{sessionsList.length !== 1 ? 'er' : ''}
									</span>
								</div>
								<div className="grid gap-4">
									{sessionsList.map((session) => (
										<SessionItem key={session._id} session={session} onDelete={deleteSession} />
									))}
								</div>
							</div>
						)
					})}
				</div>

				{/* Admin Sessions Column */}
				<div>
					<h2 className="flex justify-center text-gray-700 text-2xl font-bold mb-4">{'Admins'}</h2>
					{Object.keys(groupedAdminSessions).length === 0 && (
						<p className="text-gray-600">{'Ingen admin sessioner'}</p>
					)}
					{Object.keys(groupedAdminSessions).map((userId) => {
						const user = adminUserMap[userId]
						const sessionsList = groupedAdminSessions[userId]
						return (
							<div key={userId} className="mb-8 max-w-fit">
								<div className="flex justify-between items-center mb-2">
									<h3 className="text-xl text-gray-700 font-semibold">{`"${user.name}" sessioner`}</h3>
									<span className="text-gray-600">
										{sessionsList.length}{' session'}
										{sessionsList.length !== 1 ? 'er' : ''}
									</span>
								</div>
								<div className="grid gap-4">
									{sessionsList.map((session) => (
										<SessionItem key={session._id} session={session} onDelete={deleteSession} />
									))}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export default SessionsView
