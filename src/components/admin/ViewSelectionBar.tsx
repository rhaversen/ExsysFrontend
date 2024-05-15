import React, { type ReactElement } from 'react'

const ViewSelectionBar = ({
	subBar,
	views,
	selectedView,
	setSelectedView
}: {
	subBar: boolean
	views: string[]
	selectedView: string | null
	setSelectedView: (view: string) => void

}): ReactElement => {
	return (
		<div className={`flex justify-center bg-gray-800 ${subBar ? 'py-1' : 'py-2'}`}>
			{views.map((view, index) => (
				<button
					key={index}
					type="button"
					className={`${subBar ? 'px-2 py-1 mx-2 my-1' : 'px-4 py-2 mx-2 my-1'} text-white rounded-md transition-all border-2 ${selectedView === view ? 'bg-blue-500 border-blue-500' : 'border-gray-500 bg-gray-800 hover:border-blue-600 hover:scale-110 hover:shadow-lg'
					}`}
					onClick={() => {
						setSelectedView(view)
					}}
				>
					{view}
				</button>
			))}
		</div>
	)
}

export default ViewSelectionBar
