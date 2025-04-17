'use client'

import { type ReactElement, useEffect, useState } from 'react'
import { FaCircle, FaDesktop, FaMobile, FaTablet, FaTrash } from 'react-icons/fa'

import { parseUserAgent } from '@/lib/ParsingUtils'
import { timeSince, timeUntil } from '@/lib/timeUtils'
import { type SessionType } from '@/types/backendDataTypes'

const SessionItem = ({
	session,
	currentSessionId,
	currentPublicIp,
	isLoadingIp,
	onDelete
}: {
	session: SessionType
	currentSessionId: string | null
	currentPublicIp: string | null
	isLoadingIp: boolean
	onDelete: (sessionId: string) => void
}): ReactElement => {
	const [lastActivityAgo, setLastActivityAgo] = useState<string>('')
	const [loginTimeAgo, setLoginTimeAgo] = useState<string>('')
	const [sessionExpiresIn, setSessionExpiresIn] = useState<string | null>('')

	useEffect(() => {
		const updateTimes = (): void => {
			setLastActivityAgo(timeSince(session.lastActivity))
			setLoginTimeAgo(timeSince(session.loginTime))
			setSessionExpiresIn(session.stayLoggedIn ? timeUntil(session.sessionExpires ?? '') : null)
		}

		// Initial call to set the times immediately
		updateTimes()

		// Update times every second
		const interval = setInterval(updateTimes, 1000)

		// Cleanup interval on component unmount
		return () => { clearInterval(interval) }
	}, [session])

	const isExpired = !(!session.stayLoggedIn || new Date(session.sessionExpires ?? 0).getTime() > Date.now())
	const {
		browser,
		os,
		deviceType
	} = parseUserAgent(session.userAgent)

	const isCurrentSession = currentSessionId === session._id
	const isSameIpAsCurrent = !isLoadingIp && currentPublicIp === session.ipAddress

	// Get appropriate device icon
	const DeviceIcon = (): ReactElement => {
		if (deviceType.includes('mobile')) return <FaMobile className="text-blue-500" size={16} />
		if (deviceType.includes('tablet')) return <FaTablet className="text-purple-500" size={16} />
		return <FaDesktop className="text-gray-700" size={16} />
	}

	return (
		<div className={`border rounded-lg p-4 shadow-sm w-full ${isCurrentSession ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
			{/* Status bar */}
			<div className="flex justify-between items-center mb-3">
				<div className="flex items-center space-x-2">
					<FaCircle className={`text-xs ${isExpired ? 'text-red-500' : 'text-green-500'}`} />
					<span className={`font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
						{isExpired ? 'Udløbet' : 'Aktiv'}
					</span>
					{isCurrentSession && (
						<span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">
							{'Denne Session\r'}
						</span>
					)}
				</div>
				{session._id !== currentSessionId && (
					<button
						type="button"
						onClick={() => { onDelete(session._id) }}
						className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm py-1 px-2 rounded hover:bg-red-50"
						title="Log ud af denne session"
					>
						<FaTrash size={14} />
						<span>{'Log ud'}</span>
					</button>
				)}
			</div>

			{/* Device Info Header */}
			<div className="flex items-center gap-2 mb-3">
				<DeviceIcon />
				<span className="text-gray-700 font-medium">
					{os}{', '}{browser}
				</span>
			</div>

			{/* Session details */}
			<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-gray-600">
				{/* IP Address */}
				<span className="text-gray-600 font-medium">{'IP:'}</span>
				<span className="text-gray-800 flex items-center">
					{session.ipAddress}
					{isLoadingIp
						? (
							<span className="ml-2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-medium">
								{'Checker IP...'}
							</span>
						)
						: isSameIpAsCurrent && (
							<span
								className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded font-medium"
								title="Samme IP som din nuværende session"
							>
								{'Nuværende IP'}
							</span>
						)}
				</span>

				{/* Login Time */}
				<span className="text-gray-600 font-medium">{'Logget Ind:'}</span>
				<span className="text-gray-800">{loginTimeAgo}</span>

				{/* Last Activity */}
				<span className="text-gray-600 font-medium">{'Aktivitet:'}</span>
				<span className="text-gray-800">{lastActivityAgo}</span>

				{/* Session Expires */}
				<span className="text-gray-600 font-medium">{'Udløber:'}</span>
				<span className="text-gray-800">{sessionExpiresIn ?? 'Ved Lukning'}</span>

				{/* Stay Logged In */}
				<span className="text-gray-600 font-medium">{'Forbliv Logget Ind:'}</span>
				<span className="text-gray-800">{session.stayLoggedIn ? 'Ja' : 'Nej'}</span>
			</div>

			{/* User Agent Details */}
			<div className={`w-full text-wrap text-xs mt-3 max-w-full p-2 rounded break-all ${
				isCurrentSession ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-600'
			}`}>
				{session.userAgent}
			</div>
		</div>
	)
}

export default SessionItem
