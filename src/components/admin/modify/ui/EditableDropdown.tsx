import React, { type ReactElement } from 'react'

interface Option {
	value: string
	label: string
}

const Dropdown = ({
	options,
	selectedValue,
	onChange,
	title,
	editable = true
}: {
	options: Option[]
	selectedValue: string
	onChange: (value: string) => void
	title?: string
	editable?: boolean
}): ReactElement => {
	return (
		<div className={'font-bold pb-2 text-gray-800'}>
			{editable
				? (
					<select
						className={'border-2 border-blue-500 bg-transparent rounded-md p-2 focus:outline-none'}
						value={selectedValue}
						onChange={(e) => { onChange(e.target.value) }}
						title={title}
					>
						{options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				)
				: (
					<p className="p-0 m-0 text-center border-0 cursor-text focus:outline-none w-auto">
						{options.find((option) => option.value === selectedValue)?.label ?? 'Manglene Navn'}
					</p>
				)}
		</div>
	)
}

export default Dropdown
