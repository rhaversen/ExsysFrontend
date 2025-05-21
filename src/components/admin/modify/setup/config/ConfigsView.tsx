import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useState } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ConfigsType } from '@/types/backendDataTypes'

import ConfigItem from './ConfigItem'

const ConfigsView = (): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [configs, setConfigs] = useState<ConfigsType['configs'] | null>(null)

	const fetchConfigs = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<ConfigsType>(API_URL + '/v1/configs', { withCredentials: true })
			setConfigs(response.data.configs)
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError])

	useEffect(() => {
		fetchConfigs().catch((error) => {
			addError(error)
		})
	}, [addError, fetchConfigs])

	const shownConfigs = [
		'kioskPassword',
		'kioskInactivityTimeoutMs',
		'kioskInactivityTimeoutWarningMs',
		'kioskOrderConfirmationTimeoutMs',
		'kioskFeedbackBannerDelayMs',
		'kioskWelcomeMessage'
	] as const

	const text = {
		kioskInactivityTimeoutMs: {
			readableLabel: 'Kiosk Inaktivitet Timeout',
			description: 'Den maksimale tid, en bruger kan være inaktiv, før kiosken advarer om inaktivitet. Tiden nulstilles hver gang brugeren interagerer med skærmen.'
		},
		kioskInactivityTimeoutWarningMs: {
			readableLabel: 'Kiosk Inaktivitet Timeout Advarsel',
			description: 'Den tid, der går, før advarslen om inaktivitet udløber og sender brugeren tilbage til startskærmen. Brugeren kan interagere med skærmen for at nulstille Kiosk Inaktivitet Timeout, inden tiden løber ud.'
		},
		kioskOrderConfirmationTimeoutMs: {
			readableLabel: 'Kiosk Bestillingsbekræftelse Timeout',
			description: 'Den tid, kiosken venter, før den automatisk går tilbage til startskærmen efter en færdiggjort bestilling. Brugeren kan også trykke på skærmen for at fortsætte.'
		},
		kioskPassword: {
			readableLabel: 'Kiosk Adgangskode',
			description: 'Adgangskoden, der bruges til at logge ind på kioskerne. Kiosker forbliver logget ind ved ændring af adgangskoden, men nye kiosker skal bruge den nye adgangskode for at logge ind.'
		},
		kioskFeedbackBannerDelayMs: {
			readableLabel: 'Kiosk Ris og Ros Banner Forsinkelse',
			description: 'Tiden kiosken venter på velkomstskærmen uden brugerinteraktion, før Ris og Ros banneret vises.'
		},
		kioskWelcomeMessage: {
			readableLabel: 'Kiosk Velkomstbesked',
			description: 'Beskeden der vises øverst på kioskens velkomstskærm.'
		}
	}

	return (
		<div className="flex justify-center p-4">
			{configs === null
				? (
					<div className="text-black text-xl p-5">{'Henter...'}</div>
				)
				: (
					<div className="w-full max-w-4xl space-y-4">
						{shownConfigs.map((label) => (
							<ConfigItem
								key={label}
								label={label}
								value={configs[label]}
								readableLabel={text[label].readableLabel}
								description={text[label].description}
								onSave={(label, value) => {
									setConfigs({
										...configs,
										[label]: value
									})
								}}
							/>
						))}
					</div>
				)}
		</div>
	)
}

export default ConfigsView
