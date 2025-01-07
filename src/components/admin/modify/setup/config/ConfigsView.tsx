import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { type ConfigsType } from '@/types/backendDataTypes'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import Config from './Config'

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

	const text = {
		kioskInactivityTimeoutMs: {
			readableLabel: 'Kiosk Inaktivitet Timeout',
			description: 'Den maksimale tid en bruger kan være inaktiv, før kiosken advarer om inaktivitet. Tiden starter forfra hver gang brugeren interagerer med skærmen.'
		},
		kioskInactivityTimeoutWarningMs: {
			readableLabel: 'Kiosk Inaktivitet Timeout Advarsel',
			description: 'Tid før kiosken advarer brugeren om inaktivitet og sender dem tilbage til startskærmen. Brugeren kan interagere med skærmen og forlænge tiden.'
		},
		kioskOrderConfirmationTimeoutMs: {
			readableLabel: 'Kiosk Bestillingsbekræftelse Timeout',
			description: 'Den tid kiosken venter, før den går tilbage til startskærmen efter en bestilling er bekræftet. Brugeren kan også trykke på skærmen for at gå videre.'
		}
	}

	return (
		<div className="flex justify-center p-4">
			{configs === null
				? (
					<div className='text-black text-xl p-5'>{'Henter...'}</div>
				)
				: (
					<div className="w-full max-w-4xl space-y-4">
						{(Object.entries(configs) as Array<[keyof ConfigsType['configs'], number]>).map(([label, value]) => (
							<Config
								key={label}
								label={label}
								value={value}
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
