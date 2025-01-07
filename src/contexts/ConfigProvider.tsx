'use client'
import { type ConfigsType } from '@/types/backendDataTypes'
import axios from 'axios'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
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

	const { addError } = useError()
	const [config, setConfig] = useState<ConfigsType | null>(null)

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

	return (
		<ConfigContext.Provider value={{ config }}>
			{children}
		</ConfigContext.Provider>
	)
}
