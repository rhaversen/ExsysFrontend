import ImageList from '@/components/admin/modify/ui/ImageList'
import AsyncImage from '@/components/ui/AsyncImage'
import React, { type ReactElement, useState } from 'react'

const EditableImage = ({
	URL,
	editable,
	edited,
	onChange
}: {
	URL: string | undefined
	editable: boolean
	edited: boolean
	onChange: (v: string) => void
}): ReactElement => {
	const [showImageList, setShowImageList] = useState(false)

	return (
		<div className="mt-1">
			<button
				type="button"
				className={`
					${editable && 'cursor-pointer border-2 rounded-md px-1 py-0.5 pr-1.5 transition-colors duration-200 ease-in-out focus:outline-none'}
					${edited
			? 'border-green-400 hover:border-green-600 focus:border-green-700'
			: 'border-blue-500 hover:border-blue-600 focus:border-blue-700'
		}`
				}
				onClick={() => {
					setShowImageList(true)
				}}
				draggable="false"
				disabled={!editable}
			>
				<span className="sr-only">
					{'Edit Image'}
				</span>
				<AsyncImage
					className="w-48 h-48"
					width={90}
					height={90}
					quality={50}
					src={`${URL === undefined || URL === '' ? '/none.svg' : URL}`}
					alt={URL?.split('/').pop() ?? 'Item Image'}
					draggable={false}
					priority={true}
				/>
			</button>
			{showImageList && (
				<ImageList
					onClose={() => {
						setShowImageList(false)
					}}
					onSelect={(imageURL: string) => {
						onChange(imageURL)
						setShowImageList(false)
					}}
				/>
			)}
		</div>
	)
}

export default EditableImage
