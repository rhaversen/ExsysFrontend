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
		<div className="w-full py-2 flex flex-row justify-center bg-gray-800">
			{views.map((view, index) => (
				<button
					key={index}
					type="button"
					className={`px-4 py-2 mx-2 my-1 text-white rounded-md transition-all border-2 ${selectedView === view ? 'bg-blue-500 border-blue-500' : 'border-gray-500 bg-gray-800 hover:border-blue-600 hover:scale-110 hover:shadow-lg'
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
