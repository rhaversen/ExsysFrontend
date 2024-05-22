import ImageList from '@/components/admin/modify/ui/ImageList'
import React, { type ReactElement, useState } from 'react'
import Image from 'next/image'

const EditableImage = ({
	defaultURL,
	newURL,
	editable,
	edited,
	onChange
}: {
	defaultURL: string | undefined
	newURL?: string
	editable: boolean
	edited: boolean
	onChange: (v: string) => void
}): ReactElement => {
	const [editingURL, setEditingURL] = useState(newURL ?? defaultURL)
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
				<Image
					width={90}
					height={90}
					quality={50}
					src={`${editingURL === undefined || editingURL === '' ? '/none.svg' : editingURL}`}
					alt={editingURL?.split('/').pop() ?? 'Item Image'}
					className="w-40 h-40 object-cover text-gray-800"
					draggable="false"
					placeholder='blur'
					blurDataURL='/orderStation/loading.svg'
					priority // Load image immediately
				/>
			</button>
			{showImageList && (
				<ImageList
					onClose={() => {
						setShowImageList(false)
					}}
					onSelect={(imageURL: string) => {
						setEditingURL(imageURL)
						onChange(imageURL)
						setShowImageList(false)
					}}
				/>
			)}
		</div>
	)
}

export default EditableImage
