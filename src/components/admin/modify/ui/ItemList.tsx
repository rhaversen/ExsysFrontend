import { AdminImages } from '@/lib/images'
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
		<div className='flex flex-col items-center'>
			<button
				type="button"
				title="Tilføj"
				className="flex w-auto m-5 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded items-center justify-center"
				onClick={onAdd}
			>
				<Image
					className="h-7 w-7"
					src={AdminImages.add.src}
					alt={AdminImages.add.alt}
					width={10}
					height={10}
				/>
				<span className="p-2 mx-5 font-bold">{buttonText}</span>
			</button>
			<div className="flex flex-wrap justify-evenly">
				{children}
			</div>
		</div>
	)
}

export default ItemList
