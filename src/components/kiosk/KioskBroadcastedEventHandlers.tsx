'use client'

import { type ReactElement, useEffect } from 'react'

import { useSharedSocket } from '@/hooks/useSharedSocket'

const useKioskEvents = (): ReactElement => {
	const socket = useSharedSocket()

	useEffect(() => {
		if (socket == null) { return }
		const onRefresh = (): void => { window.location.reload() }
		socket.on('kiosk-refresh', onRefresh)
		return () => { socket.off('kiosk-refresh', onRefresh) }
	}, [socket])

	return <></>
}

export default useKioskEvents
