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
		<div className="absolute right-0 text-black flex flex-col items-center">
			<p className="m-2">{'Sorter efter:'}</p>
			<div className="flex justify-center items-center">
				<select
					className="mx-2 rounded-md text-center"
					onChange={(e) => { onSortFieldChange(e.target.value) }}
					title="Sorteringsfelt"
					value={currentField}
				>
					{options.map(prop => (
						<option key={prop.prop} value={prop.prop}>{prop.label}</option>
					))}
				</select>
				<select
					className="mx-2 rounded-sm text-center"
					onChange={(e) => { onSortDirectionChange(e.target.value as 'asc' | 'desc') }}
					title="Sorteringsretning"
					value={currentDirection}
				>
					<option value="asc">{'Stigende'}</option>
					<option value="desc">{'Aftagende'}</option>
				</select>
			</div>
		</div>
	)
}

export default SortingControl
