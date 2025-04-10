'use client'

import { type ReactElement } from 'react'

const SortingControl = ({
	options,
	currentField,
	currentDirection,
	onSortFieldChange,
	onSortDirectionChange
}: {
	options: Array<{ prop: string, label: string }>
	currentField: string
	currentDirection: 'asc' | 'desc'
	onSortFieldChange: (field: string) => void
	onSortDirectionChange: (direction: 'asc' | 'desc') => void
}): ReactElement => {
	return (
		<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
			<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
				<label className="text-black font-semibold whitespace-nowrap text-sm">
					{'Sorter efter:\r'}
				</label>
				<select
					className="rounded-md px-3 py-1.5 border bg-white cursor-pointer text-black text-sm"
					onChange={(e) => { onSortFieldChange(e.target.value) }}
					value={currentField}
					title="Sorteringsfelt"
				>
					{options.map(opt => (
						<option key={opt.prop} value={opt.prop}>
							{opt.label}
						</option>
					))}
				</select>
			</div>
			<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
				<label className="text-black font-semibold whitespace-nowrap text-sm">
					{'Retning:\r'}
				</label>
				<select
					className="rounded-md px-3 py-1.5 border bg-white cursor-pointer text-black text-sm"
					onChange={(e) => { onSortDirectionChange(e.target.value as 'asc' | 'desc') }}
					value={currentDirection}
					title="Sorteringsretning"
				>
					<option value="asc">{'Stigende'}</option>
					<option value="desc">{'Aftagende'}</option>
				</select>
			</div>
		</div>
	)
}

export default SortingControl
