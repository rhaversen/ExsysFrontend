import dayjs from 'dayjs'
import React, { useState } from 'react'
import 'dayjs/locale/da'

import { getNextAvailableProductOrderWindowFrom } from '@/lib/timeUtils'
import type { ProductType } from '@/types/backendDataTypes'

interface CloseModeSelectorProps<Mode extends string = 'manual' | 'until' | 'nextProduct' | 'open'> {
  products: ProductType[]
  showOpenOption?: boolean
  initialMode?: Mode
  initialUntil?: string
  isPatching?: boolean
  onConfirm: (mode: Mode, until: string | null) => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  confirmLabelMap?: Partial<Record<Mode, string>>
}
function CloseModeSelector<Mode extends string = 'manual' | 'until' | 'nextProduct' | 'open'> (
	{
		products,
		showOpenOption = false,
		initialMode = 'manual' as Mode,
		initialUntil,
		isPatching = false,
		onConfirm,
		onCancel,
		confirmText,
		cancelText,
		confirmLabelMap
	}: CloseModeSelectorProps<Mode>
): React.ReactElement {
	dayjs.locale('da')

	const [mode, setMode] = useState<Mode>(initialMode)
	// Set default until to now + 1 minute if mode is 'until' and no initialUntil is provided
	const getDefaultUntil = () => {
		if (initialUntil != null) { return initialUntil }
		return dayjs().add(1, 'minute').toISOString()
	}
	const [until, setUntil] = useState<string | null>(getDefaultUntil())
	const hasAvailableProducts = products.some(p => p.isActive)
	const isUntilInPast = mode === 'until' && until != null && new Date(until) <= new Date()

	// Determine confirm button label based on mode and mapping
	const buttonLabel = confirmLabelMap?.[mode] ?? confirmText ?? (mode === 'open' ? 'Åbn' : 'Luk')

	// Descriptions for each mode (Danish)
	const modeDescriptions: Record<string, string> = {
		manual: 'Kiosken lukkes manuelt og forbliver lukket indtil den åbnes igen.',
		until: 'Kiosken lukkes indtil det valgte tidspunkt. Den åbner automatisk derefter.',
		nextProduct: 'Kiosken lukkes og åbner automatisk, når næste produkt bliver tilgængeligt.',
		open: 'Åbn alle kiosker med det samme.'
	}

	// Reserve space for option details to avoid layout shift
	const optionDetailMinHeight = 70

	return (
		<div className="flex flex-col gap-2 text-gray-700">
			{/* Radio buttons group with always-visible descriptions */}
			<div className="flex flex-col gap-2">
				<label className="flex flex-col gap-0.5">
					<span className="flex items-center gap-2">
						<input type="radio" checked={mode === 'manual'} onChange={() => { setMode('manual' as Mode); setUntil(null) }} />
						<span className="font-medium">{'Luk manuelt (indtil genåbnet manuelt)'}</span>
					</span>
					<span className="text-xs text-gray-500 pl-6">{modeDescriptions.manual}</span>
				</label>
				<label className="flex flex-col gap-0.5">
					<span className="flex items-center gap-2">
						<input type="radio" checked={mode === 'until'} onChange={() => { setMode('until' as Mode); setUntil(dayjs().add(1, 'minute').toISOString()) }} />
						<span className="font-medium">{'Luk indtil bestemt dato/tidspunkt'}</span>
					</span>
					<span className="text-xs text-gray-500 pl-6">{modeDescriptions.until}</span>
				</label>
				<label className="flex flex-col gap-0.5">
					<span className="flex items-center gap-2">
						<input type="radio" checked={mode === 'nextProduct'} onChange={() => { setMode('nextProduct' as Mode); setUntil(null) }} />
						<span className="font-medium">{'Luk indtil næste produkt bliver tilgængeligt'}</span>
					</span>
					<span className="text-xs text-gray-500 pl-6">{modeDescriptions.nextProduct}</span>
				</label>
				{showOpenOption && (
					<label className="flex flex-col gap-0.5">
						<span className="flex items-center gap-2">
							<input type="radio" checked={mode === 'open'} onChange={() => { setMode('open' as Mode); setUntil(null) }} />
							<span className="font-medium">{'Åbn alle kiosker'}</span>
						</span>
						<span className="text-xs text-gray-500 pl-6">{modeDescriptions.open}</span>
					</label>
				)}
			</div>

			{/* Option details below radio group */}
			<div style={{ minHeight: optionDetailMinHeight }} className="mt-2">
				{(mode === 'until' || mode === 'nextProduct') && (
					<div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex flex-col gap-2">
						{mode === 'until' && (
							<>
								<label className="text-sm text-gray-700 font-semibold">{'Kiosken er lukket indtil det valgte tidspunkt:'}</label>
								<input
									type="datetime-local"
									className="border rounded px-2 py-1 text-gray-700 font-semibold bg-blue-50"
									value={until != null ? dayjs(until).format('YYYY-MM-DDTHH:mm') : ''}
									onChange={e => { setUntil(e.target.value ? new Date(e.target.value).toISOString() : null) }}
									min={dayjs().add(1, 'minute').format('YYYY-MM-DDTHH:mm')}
									placeholder="Vælg dato og tid"
								/>
								<div className="text-xs text-gray-500 mt-1">
									{(until != null) && (
										<span>
											{dayjs(until).format('dddd [d.] DD/MM YYYY [kl.] HH:mm').charAt(0).toUpperCase() + dayjs(until).format('dddd [d.] DD/MM YYYY [kl.] HH:mm').slice(1)}
										</span>
									)}
								</div>
								{isUntilInPast && (
									<div className="text-xs text-red-600 font-semibold mt-1">{'Datoen/tidspunktet skal være i fremtiden.'}</div>
								)}
							</>
						)}
						{mode === 'nextProduct' && (
							<>
								 <div className="text-sm text-gray-700 font-semibold">
									{showOpenOption ? 'Kioskerne er lukket indtil næste produkt bliver tilgængeligt:' : 'Kiosken åbner automatisk når næste produkt bliver tilgængeligt:'}
								</div>
								<div className="font-semibold text-gray-700 text-base bg-blue-50 rounded px-2 py-1 inline-block mt-1">
									{(() => {
										const t = getNextAvailableProductOrderWindowFrom(products)?.date
										return t ? (dayjs(t).format('dddd [d.] DD/MM YYYY [kl.] HH:mm').charAt(0).toUpperCase() + dayjs(t).format('dddd [d.] DD/MM YYYY [kl.] HH:mm').slice(1)) : 'Ingen produkter tilgængelige'
									})()}
								</div>
							</>
						)}
					</div>
				)}
			</div>

			<div className="flex gap-4 justify-end pt-2">
				{(cancelText != null) && onCancel && (
					<button
						type="button"
						disabled={isPatching}
						onClick={onCancel}
						className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition text-gray-800"
					>
						{cancelText}
					</button>
				)}
				<button
					type="button"
					disabled={isPatching || (mode === 'until' && (until == null || isUntilInPast)) || (mode === 'nextProduct' && !hasAvailableProducts)}
					onClick={() => onConfirm(mode, until)}
					className="px-5 py-2 text-white rounded-md transition bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{buttonLabel}
				</button>
			</div>
		</div>
	)
}
export default CloseModeSelector
