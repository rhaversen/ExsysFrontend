import React, { type ReactElement } from 'react'

const ViewSelectionBar = ({
	subLevel,
	views,
	selectedView,
	setSelectedView
}: {
	subLevel: number
	views: string[]
	selectedView: string | null
	setSelectedView: (view: string) => void
}): ReactElement => {
	// Define container styles for each sublevel
	const containerStyles: Record<number, string> = {
		0: 'bg-gray-800 py-2',
		1: 'bg-gray-800 pb-2',
		2: 'py-2'
	}

	// Define button size and spacing styles for each sublevel
	const buttonSizeStyles: Record<number, string> = {
		0: 'bg-gray-800 text-white px-4 py-2 mx-2 my-1',
		1: 'bg-gray-800 text-white px-2 py-1 mx-2 my-1',
		2: 'text-black px-2 py-1 mx-2 my-1'
	}

	const baseContainerClassName = 'flex justify-center flex-wrap max-w-screen'
	const baseButtonClassName = 'rounded-md transition-all border-2'

	// Get the styles based on the current sublevel
	const containerClassName = containerStyles[subLevel] ?? containerStyles[0]
	const buttonClassName = buttonSizeStyles[subLevel] ?? buttonSizeStyles[0]

	return (
		<div className={`${baseContainerClassName} ${containerClassName}`}>
			{views.map((view, index) => {
				const isSelected = selectedView === view

				// Base classes for all buttons
				let modifiedButtonClassName = `${baseButtonClassName} ${buttonClassName}`

				if (isSelected) {
					// Styles for the selected button
					modifiedButtonClassName += ' border-blue-400 cursor-default'
				} else {
					// Styles for unselected buttons
					modifiedButtonClassName += ' border-gray-500 hover:border-blue-500 hover:scale-110 hover:shadow-lg'
				}

				return (
					<button
						key={index}
						type="button"
						className={modifiedButtonClassName}
						onClick={() => { setSelectedView(view) }}
					>
						{view}
					</button>
				)
			})}
		</div>
	)
}

export default ViewSelectionBar
