import dayjs from 'dayjs'
import React, { useState } from 'react'
import 'dayjs/locale/da'

import { getNextAvailableProductOrderWindowFrom } from '@/lib/timeUtils'
import type { ProductType } from '@/types/backendDataTypes'

interface CloseModeSelectorProps<Mode extends string = 'manual' | 'until' | 'nextProduct' | 'open'> {
  products: ProductType[]
  showOpenOption?: boolean
  initialMode?: Mode
  initialUntil?: string | null
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
		initialUntil = null,
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
	const [until, setUntil] = useState<string | null>(initialMode === 'until' ? getDefaultUntil() : initialUntil)
	const hasAvailableProducts = products.some(p => p.isActive)
	const isUntilInPast = mode === 'until' && until != null && new Date(until) <= new Date()

	// Determine confirm button label based on mode and mapping
	const buttonLabel = confirmLabelMap?.[mode] ?? confirmText ?? (mode === 'open' ? 'Åbn' : 'Luk')

	return (
		<div className="flex flex-col gap-2 text-gray-700">
			<label className="flex items-center gap-2">
				<input type="radio" checked={mode === 'manual'} onChange={() => { setMode('manual' as Mode); setUntil(null) }} />
				<span className="font-medium">{'Luk manuelt (indtil åbnet igen)'}</span>
			</label>
			<label className="flex items-center gap-2">
				<input type="radio" checked={mode === 'until'} onChange={() => { setMode('until' as Mode); setUntil(dayjs().add(1, 'minute').toISOString()) }} />
				<span className="font-medium">{'Luk indtil bestemt dato/tidspunkt'}</span>
			</label>
			<label className="flex items-center gap-2">
				<input type="radio" checked={mode === 'nextProduct'} onChange={() => { setMode('nextProduct' as Mode); setUntil(null) }} />
				<span className="font-medium">{'Luk indtil næste produkt bliver tilgængeligt'}</span>
			</label>
			{showOpenOption && (
				<label className="flex items-center gap-2">
					<input type="radio" checked={mode === 'open'} onChange={() => { setMode('open' as Mode); setUntil(null) }} />
					<span className="font-medium">{'Åbn alle kiosker'}</span>
				</label>
			)}
			{mode === 'until' && (
				<div className="flex flex-col gap-2 mt-2">
					<label className="text-sm text-gray-700 font-medium">{'Vælg dato og tid:'}</label>
					<input
						type="datetime-local"
						className="border rounded px-2 py-1 text-gray-700"
						value={(until != null) ? dayjs(until).format('YYYY-MM-DDTHH:mm') : ''}
						onChange={e => { setUntil(e.target.value ? new Date(e.target.value).toISOString() : null) }}
						min={dayjs().format('YYYY-MM-DDTHH:mm')}
						placeholder="Vælg dato og tid"
					/>
				</div>
			)}
			{mode === 'nextProduct' && (
				<div className="flex flex-col gap-2 mt-2">
					<span className="text-sm text-gray-700 font-medium">
						<div>
							{showOpenOption ? 'Kioskerne åbner automatisk når næste produkt bliver tilgængeligt:' : 'Kiosken åbner automatisk når næste produkt bliver tilgængeligt:'}
						</div>
						<div>
							{(() => {
								const t = getNextAvailableProductOrderWindowFrom(products)?.date
								return t ? dayjs(t).format('dddd [d.] DD/MM YYYY [kl.] HH:mm') : 'Ingen produkter tilgængelige'
							})()}
						</div>
					</span>
				</div>
			)}
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
