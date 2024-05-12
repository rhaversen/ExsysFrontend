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
	children: ReactNode[]
}): ReactElement => {
	return (
		<div className="flex flex-row w-screen pr-10 my-auto">
			<div className="flex flex-col m-5">
				<h2 className="text-2xl min-w-40 font-bold p-4 text-center text-black">
					{header}
				</h2>
				<button
					type="button"
					className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
					onClick={onAdd}
				>
					{buttonText}
				</button>
			</div>
			<div className="no-scrollbar shadow-inner flex flex-row overflow-x-auto flex-1 bg-gray-300 rounded-xl">
				{children}
			</div>
		</div>
	)
}

export default ItemList
