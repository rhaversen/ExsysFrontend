'use client'
import { useUser } from '@/contexts/UserProvider'
import { type KioskType } from '@/types/backendDataTypes'
import React, { type ReactElement, useEffect, useState } from 'react'

const KioskSessionInfo = (): ReactElement | null => {
	const { currentUser } = useUser()
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	// SSR will cause hydration mismatch, return null if not on client
	if (!isClient) {
		return null
	}

	const kioskTag = (currentUser as KioskType)?.kioskTag ?? 'Mangler #'
	const kioskName = (currentUser as KioskType)?.name ?? 'Mangler Navn'
	return (
		<div className="h-5 w-full bg-black flex flex-row items-center">
			<div className="text-xs text-white px-1">
				{kioskName} <span className="font-bold px-2">{`#${kioskTag}`}</span>
			</div>
		</div>
	)
}

export default KioskSessionInfo
