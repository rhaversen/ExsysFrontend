import axios from 'axios'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { FaStore } from 'react-icons/fa'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { getNextAvailableProductTimeLocal } from '@/lib/timeUtils'
import type { KioskType, ProductType } from '@/types/backendDataTypes'

import 'dayjs/locale/da'

const AllKiosksStatusManager = ({
	kiosks,
	products
}: {
	kiosks: KioskType[]
	products: ProductType[]
}): React.ReactElement => {
	dayjs.locale('da')
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [allKiosksMode, setAllKiosksMode] = useState<'manual' | 'until' | 'nextProduct' | 'open'>('manual')
	const [allKiosksUntil, setAllKiosksUntil] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const { addError } = useError()

	// Check if there is any available products
	const hasAvailableProducts = products.some(p => p.isActive)

	// Helper to format ISO string to local datetime-local value
	const getLocalDateTimeValue = (isoString: string | null): string => {
		if (isoString == null) return ''
		const date = new Date(isoString)
		const tzOffset = date.getTimezoneOffset() * 60000
		const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
		return localISO
	}

	const handleAllKiosksAction = async (): Promise<void> => {
		try {
			if (API_URL == null) return
			setIsProcessing(true)
			if (allKiosksMode === 'manual') {
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: true, closedUntil: null },
							{ withCredentials: true }
						)
					)
				)
			} else if (allKiosksMode === 'until') {
				if (allKiosksUntil == null) return
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: false, closedUntil: allKiosksUntil },
							{ withCredentials: true }
						)
					)
				)
			} else if (allKiosksMode === 'nextProduct') {
				const until = getNextAvailableProductTimeLocal(products)?.date.toISOString()
				if (until == null) return
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: false, closedUntil: until },
							{ withCredentials: true }
						)
					)
				)
			} else if (allKiosksMode === 'open') {
				await Promise.all(
					kiosks.map(async kiosk =>
						await axios.patch(`${API_URL}/v1/kiosks/${kiosk._id}`,
							{ manualClosed: false, closedUntil: null },
							{ withCredentials: true }
						)
					)
				)
			}
			setAllKiosksUntil(null)
		} catch (error) {
			addError(error)
		} finally {
			setIsProcessing(false)
		}
	}

	const now = new Date()
	const isUntilInPast = allKiosksMode === 'until' && allKiosksUntil != null && new Date(allKiosksUntil) <= now

	return (
		<div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
			<div className="flex items-center gap-4">
				<FaStore className="text-blue-500 text-2xl" />
				<div className="flex flex-col flex-grow">
					<span className="text-lg text-gray-800">
						{'Administrer alle kioskers status'}
					</span>
					<div className="text-sm text-gray-600">
						{'Luk eller åbn alle kiosker for bestillinger på én gang.'}
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-2 text-gray-700 mt-2">
				<label className="flex items-center gap-2">
					<input type="radio" checked={allKiosksMode === 'manual'} onChange={() => { setAllKiosksMode('manual'); setAllKiosksUntil(null) }} />
					<span className="font-medium">{'Luk manuelt (indtil åbnet igen)'}</span>
				</label>
				<label className="flex items-center gap-2">
					<input type="radio" checked={allKiosksMode === 'until'} onChange={() => { setAllKiosksMode('until') }} />
					<span className="font-medium">{'Luk indtil bestemt dato/tidspunkt'}</span>
				</label>
				<label className="flex items-center gap-2">
					<input type="radio" checked={allKiosksMode === 'nextProduct'} onChange={() => { setAllKiosksMode('nextProduct'); setAllKiosksUntil(null) }} />
					<span className="font-medium">{'Luk indtil næste produkt bliver tilgængeligt'}</span>
				</label>
				<label className="flex items-center gap-2">
					<input type="radio" checked={allKiosksMode === 'open'} onChange={() => { setAllKiosksMode('open'); setAllKiosksUntil(null) }} />
					<span className="font-medium">{'Åbn alle kiosker'}</span>
				</label>
			</div>
			{allKiosksMode === 'until' && (
				<div className="flex flex-col gap-2 mt-2">
					<label className="text-sm text-gray-700 font-medium">{'Vælg dato og tid:'}</label>
					<input
						id="close-until-all-input"
						type="datetime-local"
						className="border rounded px-2 py-1 text-gray-700"
						value={getLocalDateTimeValue(allKiosksUntil)}
						onChange={e => { setAllKiosksUntil((e.target.value.length > 0) ? new Date(e.target.value).toISOString() : null) }}
						min={dayjs().format('YYYY-MM-DDTHH:mm')}
						placeholder="Vælg dato og tid"
					/>
				</div>
			)}
			{allKiosksMode === 'nextProduct' && (
				<div className="flex flex-col gap-2 mt-2">
					<span className="text-sm text-gray-700 font-medium">
						<div>
							{'Kioskerne åbner automatisk når næste produkt bliver tilgængeligt:'}
						</div>
						<div>
							{(() => {
								const t = getNextAvailableProductTimeLocal(products)?.date
								return (t != null) ? dayjs(t).format('dddd [d.] DD/MM YYYY [kl.] HH:mm') : 'Ingen produkter tilgængelige'
							})()}
						</div>
					</span>
				</div>
			)}
			<div className="flex gap-4 justify-end pt-2">
				<button
					type="button"
					disabled={isProcessing || (allKiosksMode === 'until' && (allKiosksUntil == null)) || (allKiosksMode === 'until' && isUntilInPast) || (allKiosksMode === 'nextProduct' && !hasAvailableProducts)}
					onClick={() => { void handleAllKiosksAction() }}
					className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition disabled:opacity-50"
				>
					{allKiosksMode === 'open' ? 'Åbn alle' : 'Luk alle'}
				</button>
			</div>
		</div>
	)
}

export default AllKiosksStatusManager
