'use client'
import React, {
	createContext,
	type Dispatch,
	type ReactElement,
	type ReactNode,
	type SetStateAction,
	useContext,
	useEffect,
	useState
} from 'react'

import { AdminSounds } from '@/lib/sounds'

interface SoundContextType {
	isMuted: boolean
	setIsMuted: Dispatch<SetStateAction<boolean>>
	soundUrl: string
	setSoundUrl: Dispatch<SetStateAction<string>>
}

const SoundContext = createContext<SoundContextType>({
	isMuted: false,
	setIsMuted: () => { },
	soundUrl: '',
	setSoundUrl: () => { }
})

export const useSound = (): SoundContextType => useContext(SoundContext)

export default function SoundProvider ({ children }: { readonly children: ReactNode }): ReactElement {
	const [isMuted, setIsMuted] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			const storedMuted = localStorage.getItem('soundMuted')
			return storedMuted !== null ? JSON.parse(storedMuted) : false
		}
		return false
	})

	const [soundUrl, setSoundUrl] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			const storedUrl = localStorage.getItem('soundUrl')
			return storedUrl !== null ? JSON.parse(storedUrl) : AdminSounds.newOrderAlert[0]
		}
		return ''
	})

	useEffect(() => {
		localStorage.setItem('soundMuted', JSON.stringify(isMuted))
	}, [isMuted])

	useEffect(() => {
		localStorage.setItem('soundUrl', JSON.stringify(soundUrl))
	}, [soundUrl])

	const value = React.useMemo(() => ({
		isMuted,
		setIsMuted,
		soundUrl,
		setSoundUrl
	}), [isMuted, soundUrl])

	return (
		<SoundContext.Provider value={value}>
			{children}
		</SoundContext.Provider>
	)
}
