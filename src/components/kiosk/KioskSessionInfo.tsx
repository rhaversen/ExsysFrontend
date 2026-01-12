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
	const gitHash = process.env.NEXT_PUBLIC_GIT_HASH ?? 'unknown commit'

	return (
		<div className="h-5 w-full bg-black flex flex-row items-center justify-between">
			<div className="text-xs text-white font-bold px-1 flex gap-6 tracking-wide">
				<div>{kioskName}</div>
				<div>{`#${kioskTag}`}</div>
			</div>
			<div className="text-xs text-white/50 px-1 tracking-wide">
				{gitHash}
			</div>
		</div>
	)
}

export default KioskSessionInfo
