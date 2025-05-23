'use client'
import axios from 'axios'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import { type ConfigsType } from '@/types/backendDataTypes'

import { useError } from './ErrorContext/ErrorContext'

interface ConfigContextType {
	config: ConfigsType | null
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function useConfig (): ConfigContextType {
	const context = useContext(ConfigContext)
	if (context === undefined) {
		throw new Error('useConfig must be used within a ConfigProvider')
	}
	return context
}

export default function ConfigProvider ({ children }: Readonly<{ children: ReactNode }>): ReactNode {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { addError } = useError()
	const [config, setConfig] = useState<ConfigsType | null>(null)
	const [socket, setSocket] = useState<Socket | null>(null)

	useEffect(() => {
		const fetchConfig = async (): Promise<void> => {
			try {
				const response = await axios.get<ConfigsType>(`${API_URL}/v1/configs`, { withCredentials: true })
				setConfig(response.data)
			} catch (error) {
				addError(error)
			}
		}

		if (config === null) {
			fetchConfig().catch(addError)
		}
	}, [API_URL, addError, config])

	// Initialize WebSocket connection
	useEffect(() => {
		if (WS_URL === undefined || WS_URL === null || WS_URL === '') { return }
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			socketInstance.disconnect()
		}
	}, [WS_URL])

	// Listen for config updates
	useEffect(() => {
		if (socket === null) { return }

		const handleConfigUpdate = (updatedConfig: ConfigsType): void => {
			setConfig(updatedConfig)
		}

		socket.on('configsUpdated', handleConfigUpdate)

		return () => {
			socket.off('configsUpdated', handleConfigUpdate)
		}
	}, [socket])

	return (
		<ConfigContext.Provider value={{ config }}>
			{children}
		</ConfigContext.Provider>
	)
}
