import dayjs from 'dayjs'
import React from 'react'

import { getNextAvailableProductOrderWindowFrom } from '@/lib/timeUtils'
import type { ProductType } from '@/types/backendDataTypes'

// Helper to format ISO string to local datetime-local value
const getLocalDateTimeValue = (isoString: string | null): string => {
	if (isoString == null) { return '' }
	const date = new Date(isoString)
	const tzOffset = date.getTimezoneOffset() * 60000
	const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
	return localISO
}

function CloseModeSelector<Mode extends string = 'manual' | 'until' | 'nextProduct' | 'open'> (
	{
		mode,
		setMode,
		until,
		setUntil,
		products,
		showOpenOption = false,
		minDateTime
	}: {
		mode: Mode
		setMode: (mode: Mode) => void
		until: string | null
		setUntil: (until: string | null) => void
		products: ProductType[]
		showOpenOption?: boolean
		minDateTime?: string
	}
): React.ReactElement {
	return (
		<div className="flex flex-col gap-2 text-gray-700">
			<label className="flex items-center gap-2">
				<input type="radio" checked={mode === 'manual'} onChange={() => { setMode('manual' as Mode); setUntil(null) }} />
				<span className="font-medium">{'Luk manuelt (indtil åbnet igen)'}</span>
			</label>
			<label className="flex items-center gap-2">
				<input type="radio" checked={mode === 'until'} onChange={() => { setMode('until' as Mode) }} />
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
						value={getLocalDateTimeValue(until)}
						onChange={e => { setUntil((e.target.value.length > 0) ? new Date(e.target.value).toISOString() : null) }}
						min={minDateTime ?? dayjs().format('YYYY-MM-DDTHH:mm')}
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
								return (t != null) ? dayjs(t).format('dddd [d.] DD/MM YYYY [kl.] HH:mm') : 'Ingen produkter tilgængelige'
							})()}
						</div>
					</span>
				</div>
			)}
		</div>
	)
}

export default CloseModeSelector
