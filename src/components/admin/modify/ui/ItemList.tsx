import Image from 'next/image'
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
					className="relative w-1/4 m-5 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded items-center justify-center"
					onClick={onAdd}
				>
					<div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center">
						<Image
							className="h-7 w-7"
							src="/images/admin/modify/plus.svg"
							alt="Tilføj"
							width={10}
							height={10}
						/>
					</div>
					<span className="block text-center w-full">{buttonText}</span>
				</button>
			</div>
			<div className="flex flex-wrap justify-evenly">
				{children}
			</div>
		</div>
	)
}

export default ItemList
