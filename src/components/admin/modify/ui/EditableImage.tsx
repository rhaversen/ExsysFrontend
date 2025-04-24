import { type ReactElement, useState } from 'react'

import ImageList from '@/components/admin/modify/ui/ImageList'
import AsyncImage from '@/components/ui/AsyncImage'
import { AdminImages } from '@/lib/images'

const EditableImage = ({
	URL,
	editable = true,
	className = '',
	onChange
}: {
	URL: string | undefined
	editable?: boolean
	className?: string
	onChange: (v: string) => void
}): ReactElement => {
	const [showImageList, setShowImageList] = useState(false)

	return (
		<div className="mt-1">
			<button
				type="button"
				className={`
					${editable && 'border-blue-500 cursor-pointer border-2 rounded-md px-1 py-0.5 pr-1.5 focus:outline-none'}`
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
					className={className ?? 'w-48 h-48'}
					width={90}
					height={90}
					quality={50}
					src={`${URL === undefined || URL === '' ? AdminImages.noUrl.src : URL}`}
					alt={URL?.split('/').pop() ?? AdminImages.noUrl.alt}
					draggable={false}
					priority={false}
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
