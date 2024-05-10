import React, { type ReactElement, type ReactNode } from 'react'

const ItemList = ({
	header,
	buttonText,
	onAdd,
	children
}: {
	header: string
	buttonText: string
	onAdd: () => void
	children: ReactNode
}): ReactElement => {
	return (
		<div className="flex flex-col h-full">
			<h2 className="text-2xl font-bold p-4 shadow-md text-center text-black">
				{header}
			</h2>
			<ul className="no-scrollbar overflow-y-auto flex-1">
				{children}
			</ul>
			<div className="bottom-0 flex justify-center">
				<button
					type='button'
					className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
					onClick={onAdd}
				>
					{buttonText}
				</button>
			</div>
		</div>
	)
}

export default ItemList
