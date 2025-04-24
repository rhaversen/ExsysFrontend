import { type ReactElement, useCallback, useState } from 'react'

import SaveFeedback, { useSaveFeedback } from '@/components/ui/SaveFeedback'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSound } from '@/contexts/SoundProvider'
import { AdminSounds } from '@/lib/sounds'

import CloseableModal from '../../ui/CloseableModal'

const SoundsConfig = ({ onClose }: { onClose: () => void }): ReactElement => {
	const {
		isMuted,
		setIsMuted,
		soundUrl,
		setSoundUrl
	} = useSound()
	const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
	const {
		showSuccess,
		showSuccessMessage
	} = useSaveFeedback()
	const { addError } = useError()

	const handlePlaySound = useCallback((url: string) => {
		if (audio !== null) {
			audio.pause()
			audio.currentTime = 0
		}
		const newAudio = new Audio(url)
		newAudio.play().catch(addError)
		setAudio(newAudio)
	}, [addError, audio])

	const handleSoundSelect = (url: string): void => {
		setSoundUrl(url)
		showSuccessMessage()
	}

	const handleMuteToggle = (): void => {
		setIsMuted(!isMuted)
		showSuccessMessage()
	}

	return (
		<CloseableModal onClose={onClose} canComplete={true} onComplete={onClose}>
			<div className="w-[500px] space-y-6">
				<h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
					{'Lydindstillinger'}
				</h2>

				<div className="p-4 bg-gray-50 rounded-lg shadow-sm">
					<label
						htmlFor="sound-toggle"
						className="flex items-center space-x-3 cursor-pointer py-2"
					>
						<input
							type="checkbox"
							id="sound-toggle"
							checked={!isMuted}
							onChange={handleMuteToggle}
							className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
						/>
						<span className="text-gray-700 font-medium select-none">
							{'Afspil notifikationslyde'}
						</span>
					</label>
				</div>

				<h3 className="text-lg font-medium text-gray-700 mb-4">
					{'Vælg notifikationslyd'}
				</h3>
				<div className="space-y-3">
					{AdminSounds.newOrderAlert.map((sound, index) => (
						<div
							key={sound}
							className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200"
						>
							<label
								htmlFor={`sound-${index}`}
								className="flex items-center gap-4 cursor-pointer py-2 flex-1"
							>
								<input
									type="radio"
									id={`sound-${index}`}
									name="sound"
									checked={soundUrl === sound}
									onChange={() => { handleSoundSelect(sound) }}
									className="w-4 h-4 text-blue-500"
								/>
								<span className="text-gray-700 select-none">
									{(sound.split('/').pop() ?? '').replace(/\.[^/.]+$/, '').charAt(0).toUpperCase() + (sound.split('/').pop() ?? '').replace(/\.[^/.]+$/, '').slice(1)}
								</span>
							</label>
							<button
								type="button"
								onClick={() => { handlePlaySound(sound) }}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
							>
								{'Afspil'}
							</button>
						</div>
					))}
				</div>

				<SaveFeedback show={showSuccess} />

				<div className="flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
					>
						{'Færdig'}
					</button>
				</div>
			</div>
		</CloseableModal>
	)
}

export default SoundsConfig
