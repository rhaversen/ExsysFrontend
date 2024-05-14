import React, { type ReactElement } from 'react'

const ViewSelectionBar = ({
	views,
	selectedView,
	setSelectedView
}: {
	views: string[]
	selectedView: string
	setSelectedView: (view: string) => void

}): ReactElement => {
	return (
		<div className="w-full flex flex-row justify-center bg-gray-800">
			{views.map((view, index) => (
				<button
					key={index}
					type="button"
					className={`px-4 py-2 mx-2 my-1 text-white rounded-md border-gray-500 hover:border-blue-400 border-2 ${selectedView === view ? 'bg-blue-500 ' : ''
					}`}
					onClick={() => { setSelectedView(view) }}
				>
					{view}
				</button>
			))}
		</div>
	)
}

export default ViewSelectionBar
