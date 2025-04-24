'use client'

import { type ReactElement, useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const useKioskEvents = (): ReactElement => {
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL
	const [socket, setSocket] = useState<Socket | null>(null)

	useEffect(() => {
		if (WS_URL == null) { return }
		const s = io(WS_URL)
		setSocket(s)
		return () => { s.disconnect() }
	}, [WS_URL])

	useEffect(() => {
		if (socket == null) { return }
		const onRefresh = (): void => { window.location.reload() }
		socket.on('kiosk-refresh', onRefresh)
		return () => { socket.off('kiosk-refresh', onRefresh) }
	}, [socket])

	return <></>
}

export default useKioskEvents
