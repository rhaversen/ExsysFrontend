import React, { useState, useEffect, type ReactElement } from 'react'
import { useUser } from '@/contexts/UserProvider'
import LogoutButton from './LogoutButton'
import { type AdminType } from '@/types/backendDataTypes'

const SessionInfoBar = (): ReactElement | null => {
	const { currentUser } = useUser()
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return null
	}

	const name = (currentUser as AdminType)?.name ?? 'Mangler Navn'

	return (
		<div className="w-full h-8 bg-gray-800 py-6">
			<div className="flex justify-between items-center h-full px-4">
				<div className="text-sm">
					{'Logget ind som '}
					<span className="font-bold">{name}</span>
				</div>
				<LogoutButton />
			</div>
		</div>
	)
}

export default SessionInfoBar
