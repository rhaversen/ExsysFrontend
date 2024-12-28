'use client'

import { parseUserAgent } from '@/lib/ParsingUtils'
import { formatDuration, timeSince, timeUntil } from '@/lib/timeUtils'
import { type SessionType } from '@/types/backendDataTypes'
import { type ReactElement, useEffect, useState } from 'react'

const SessionItem = ({
	session,
	currentSessionId,
	onDelete
}: {
	session: SessionType
	currentSessionId: string | null
	onDelete: (sessionId: string) => void
}): ReactElement => {
	const [sessionDurationFormatted, setSessionDurationFormatted] = useState<string>('')
	const [lastActivityAgo, setLastActivityAgo] = useState<string>('')
	const [loginTimeAgo, setLoginTimeAgo] = useState<string>('')
	const [sessionExpiresIn, setSessionExpiresIn] = useState<string | null>('')

	useEffect(() => {
		const updateTimes = (): void => {
			const sessionDurationMs =
				new Date(session.lastActivity).getTime() - new Date(session.loginTime).getTime()
			setSessionDurationFormatted(formatDuration(sessionDurationMs))
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
	const statusIcon = isExpired ? <>&#10060;</> : <>&#9989;</>
	const {
		browser,
		os
	} = parseUserAgent(session.userAgent)

	return (
		<div className="border rounded-lg p-4 shadow-sm bg-white w-fit">
			<div className="flex justify-between items-center mb-2">
				<div className="flex items-center space-x-2">
					{statusIcon}
					<span className="text-gray-700 font-semibold">
						{isExpired ? 'Udløbet' : 'Aktiv'}
					</span>
				</div>
				{currentSessionId === null
					? (
						<span className="text-gray-600 font-semibold">{'Henter Session ID...'}</span>
					)
					: session._id !== currentSessionId
						? (
							<button
								type="button"
								onClick={() => { onDelete(session._id) }}
								className="text-red-600 hover:text-red-800 flex items-center"
							>
								{'Log ud'}
							</button>
						)
						: (
							<span className="text-blue-600 font-semibold">{'Denne Session'}</span>
						)
				}
			</div>
			<div className="text-gray-700 w-fit">
				<div>
					<p>
						<strong>{'IP Addresse:'}</strong> {session.ipAddress}
					</p>
					<p>
						<strong>{'Enhed:'}</strong> {os}
						{', '}
						{browser}
					</p>
					<p>
						<strong>{'Logget Ind:'}</strong> {loginTimeAgo}
					</p>
					<p>
						<strong>{'Sidste Aktivitet:'}</strong> {lastActivityAgo}
					</p>
					<p>
						<strong>{'Session Længde:'}</strong> {sessionDurationFormatted}
					</p>
					<p>
						<strong>{'Session Udløber:'}</strong> {sessionExpiresIn ?? 'Ved Lukning'}
					</p>
					<p>
						<strong>{'Forbliv Logget Ind:'}</strong> {session.stayLoggedIn ? 'Ja' : 'Nej'}
					</p>
					<p className="text-wrap max-w-xl">
						<strong>{'User Agent:'}</strong> {session.userAgent}
					</p>
				</div>
			</div>
		</div>
	)
}

export default SessionItem
