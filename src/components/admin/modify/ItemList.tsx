import React, { type ReactElement, type ReactNode } from 'react'

const ItemList = ({
	buttonText,
	onAdd,
	children
}: {
	buttonText: string
	onAdd: () => void
	children: ReactNode[]
}): ReactElement => {
	return (
		<div>
			<div className="flex justify-center">
				<button
					type="button"
					className="w-1/4 m-5 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
					onClick={onAdd}
				>
					{buttonText}
				</button>
			</div>
			<div className="flex flex-wrap justify-evenly">
				{children}
			</div>
		</div>
	)
}

export default ItemList
