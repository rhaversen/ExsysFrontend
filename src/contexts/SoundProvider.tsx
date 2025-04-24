'use client'

import Cookies from 'js-cookie'
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
	setIsMuted: () => {},
	soundUrl: '',
	setSoundUrl: () => {}
})

export const useSound = (): SoundContextType => useContext(SoundContext)

export default function SoundProvider ({ children }: { readonly children: ReactNode }): ReactElement {
	const [isMuted, setIsMuted] = useState<boolean>(() => {
		const cookie = Cookies.get('soundMuted')
		return (cookie != null) ? JSON.parse(cookie) : false
	})

	const [soundUrl, setSoundUrl] = useState<string>(() => {
		const cookie = Cookies.get('soundUrl')
		return (cookie != null) ? JSON.parse(cookie) : AdminSounds.newOrderAlert[0]
	})

	useEffect(() => {
		Cookies.set('soundMuted', JSON.stringify(isMuted), { expires: 365, path: '/' })
	}, [isMuted])

	useEffect(() => {
		Cookies.set('soundUrl', JSON.stringify(soundUrl), { expires: 365, path: '/' })
	}, [soundUrl])

	const value = React.useMemo(() => ({ isMuted, setIsMuted, soundUrl, setSoundUrl }), [isMuted, soundUrl])

	return (
		<SoundContext.Provider value={value}>
			{children}
		</SoundContext.Provider>
	)
}
