'use client'
import React, { useEffect, useState, type ReactElement } from 'react'
import { useUser } from '@/contexts/UserProvider'
import { type KioskType } from '@/types/backendDataTypes'

const SessionInfoBar = (): ReactElement | null => {
	const { currentUser } = useUser()
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return null
	}

	const kioskTag = (currentUser as KioskType)?.kioskTag ?? 'Mangler Tag'

	return (
		// Thin bar the entire screen wide
		<div className="absolute top-1 left-1">
			<div className="text-xs text-black">
				{'Kiosk Tag'} <span className="font-bold">{kioskTag}</span>
			</div>
		</div>
	)
}

export default SessionInfoBar
