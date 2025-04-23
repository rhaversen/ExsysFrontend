'use client'
import { type ReactElement, useEffect, useState } from 'react'

import { useUser } from '@/contexts/UserProvider'
import { type KioskType } from '@/types/backendDataTypes'

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
			<div className="text-xs font-bold px-1 flex gap-6 tracking-wide">
				<div>{kioskName}</div>
				<div>{`#${kioskTag}`}</div>
			</div>
		</div>
	)
}

export default KioskSessionInfo
